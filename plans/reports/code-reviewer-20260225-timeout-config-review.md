# Code Review: Granular Timeout Configuration

**Date:** 2026-02-25
**Commit:** 164c7af
**Reviewer:** code-reviewer agent

---

## Scope

- Files reviewed: `app/core/http_client.py`, `app/processors/claude_ai/claude_api_processor.py`
- Related callers checked: `app/services/oauth.py`, `app/core/external/claude_client.py`, `download_image()`
- LOC changed: ~40
- Focus: Timeout configuration correctness, fallback safety, regression risk

---

## Overall Assessment

The rnet path (primary HTTP backend) is correct and well-designed. The `timeout=None` change for streaming is sound -- rnet natively accepts `Optional[int]` and `None` disables the overall timeout while `connect_timeout=10` and `read_timeout=300` remain as safety nets.

However, **two critical bugs** exist in the fallback paths (curl_cffi and httpx) that will crash when `timeout=None` is passed. The tenacity retry tuple is correctly formed.

---

## Critical Issues

### 1. CurlAsyncSessionWrapper crashes with `timeout=None` (TypeError)

**File:** `D:\CODE\fullstack\package run only\mirrorange_clove\app\core\http_client.py`, line 215

```python
# curl_cffi only supports single timeout, use the larger value
effective_timeout = max(timeout, read_timeout)
```

`max(None, 300)` raises `TypeError: '>' not supported between instances of 'int' and 'NoneType'`.

When `create_session(timeout=None)` falls through to the curl_cffi backend (rnet not installed), the constructor immediately crashes.

**Fix:**

```python
# curl_cffi only supports single timeout, use the larger value
if timeout is None:
    effective_timeout = read_timeout
else:
    effective_timeout = max(timeout, read_timeout)
```

**Also:** The `timeout` type hint on `CurlAsyncSessionWrapper.__init__` should be `Optional[int]` to match `create_session()`.

### 2. HttpxAsyncSession crashes with `timeout=None` (TypeError)

**File:** `D:\CODE\fullstack\package run only\mirrorange_clove\app\core\http_client.py`, lines 461-465

```python
self._client = httpx.AsyncClient(
    timeout=httpx.Timeout(
        timeout=float(timeout),     # float(None) -> TypeError
        connect=float(connect_timeout),
        read=float(read_timeout),
    ),
```

`float(None)` raises `TypeError: float() argument must be a string or a real number, not 'NoneType'`.

**Fix:**

```python
self._client = httpx.AsyncClient(
    timeout=httpx.Timeout(
        timeout=None if timeout is None else float(timeout),
        connect=float(connect_timeout),
        read=float(read_timeout),
    ),
```

httpx natively accepts `timeout=None` to mean no overall timeout cap.

**Also:** The `timeout` type hint on `HttpxAsyncSession.__init__` should be `Optional[int]` to match.

---

## High Priority

### 3. Hanging request risk with `timeout=None`

`claude_api_processor.py` now creates sessions with `timeout=None`. The safety nets are:
- `connect_timeout=10` (default) -- protects against unreachable hosts
- `read_timeout=300` (default) -- protects against stalled reads (5 min per chunk)

**Assessment:** Adequate for normal operation. A stalled connection that sends 1 byte every 299 seconds would evade read_timeout indefinitely, but this is an impractical attack vector for the Claude API endpoint. The previous `timeout=60` was genuinely too short for streaming responses -- disabling it is the correct tradeoff.

No action required, but consider logging a warning if a streaming response exceeds 30 minutes total elapsed time (optional, low priority).

### 4. Exception hierarchy -- retry tuple is necessary and correct

Confirmed via runtime introspection:
- `RnetTimeoutError` is **NOT** a subclass of `RnetRequestError`
- `RnetBodyError` is **NOT** a subclass of `RnetRequestError`
- All three inherit directly from `Exception`

The tuple `(RnetRequestError, RnetTimeoutError, RnetBodyError)` in `retry_if_exception_type()` is therefore required. Without `RnetTimeoutError`, transient timeout errors would not trigger retries. Without `RnetBodyError`, body read failures would not retry.

Tenacity officially supports tuple-of-exceptions. Verified correct.

---

## Medium Priority

### 5. Other callers of `create_session()` are unaffected

| Caller | `timeout` arg | Impact |
|--------|--------------|--------|
| `oauth.py:_request()` | `settings.request_timeout` (int=60) | No change, uses default `connect_timeout`/`read_timeout` |
| `claude_client.py:initialize()` | `settings.request_timeout` (int=60) | No change, uses default `connect_timeout`/`read_timeout` |
| `download_image()` | `timeout=30` (int) | No change |
| `claude_api_processor.py` | `timeout=None` | **This is the only caller passing None** |

The new `connect_timeout` and `read_timeout` params on `create_session()` have defaults matching settings, so existing callers that don't pass them get the same behavior as before. **No regression for existing callers.**

### 6. Type consistency across session wrappers

`create_session()` signature: `timeout: Optional[int]`
- `RnetAsyncSession.__init__`: `timeout: Optional[int]` -- matches
- `CurlAsyncSessionWrapper.__init__`: `timeout: int` -- **mismatch, should be `Optional[int]`**
- `HttpxAsyncSession.__init__`: `timeout: int` -- **mismatch, should be `Optional[int]`**

---

## Positive Observations

1. Good defensive comment in `claude_api_processor.py` explaining why `timeout=None` with per-phase safety nets
2. Clean separation of concern: overall timeout disabled only where needed (streaming), not globally
3. Research report (`rnet-timeout-research.md`) is thorough and validates the approach
4. Retry exception tuple correctly identifies all non-inheriting rnet exceptions
5. Settings defaults are sensible: `connect_timeout=10`, `read_timeout=300`

---

## Recommended Actions

**Must fix (Critical):**
1. Handle `timeout=None` in `CurlAsyncSessionWrapper.__init__` (line 215)
2. Handle `timeout=None` in `HttpxAsyncSession.__init__` (lines 461-465)
3. Update type hints to `Optional[int]` on both fallback session wrappers

**Optional (Low priority):**
4. Add elapsed-time warning for streaming responses exceeding a threshold

---

## Unresolved Questions

1. Is there a deployment where rnet is NOT available and curl_cffi or httpx would be the active backend? If yes, the critical bugs above are reachable in production. If rnet is always available (Docker image bundles it), the bugs are latent but should still be fixed for correctness.
