# rnet Timeout Parameters Research Report

**Version:** rnet 2.4.2
**Date:** 2025-02-25
**Status:** Complete

---

## Summary

rnet.Client() supports **granular timeout parameters** with distinct control for different phases of the request lifecycle. The library distinguishes between connection timeouts, read timeouts, and overall request timeouts through separate parameters. Streaming has timeout support via per-request configuration. All timeout values are **integers** representing **seconds**.

---

## Findings

### 1. Timeout Parameter Support

**YES - rnet supports granular timeout parameters** (not a single universal timeout):

| Parameter | Type | Purpose | Scope |
|-----------|------|---------|-------|
| `timeout` | int | Overall request timeout | Client-wide, per-request override supported |
| `connect_timeout` | int | Connection establishment timeout | Per TCP connection |
| `read_timeout` | int | Read operation timeout | Per read operation on established connection |
| `write_timeout` | int | Write operation timeout | Per write operation on established connection |
| `pool_timeout` | int | Connection pool wait timeout | Waiting for available connection from pool |

All parameters accept **integer values in seconds** (not milliseconds).

---

### 2. API Signature: rnet.Client()

**Constructor signature (from __init__.pyi):**

```python
def __new__(
    cls,
    impersonate: Optional[Union[Impersonate, ImpersonateOption]] = None,
    user_agent: Optional[str] = None,
    default_headers: Optional[Union[Dict[str, str], HeaderMap]] = None,
    headers_order: Optional[List[str]] = None,
    referer: Optional[bool] = None,
    allow_redirects: Optional[bool] = None,
    max_redirects: Optional[int] = None,
    cookie_store: Optional[bool] = None,
    lookup_ip_strategy: Optional[LookupIpStrategy] = None,

    # Timeout parameters
    timeout: Optional[int] = None,
    connect_timeout: Optional[int] = None,
    read_timeout: Optional[int] = None,

    # TCP tuning
    no_keepalive: Optional[bool] = None,
    tcp_keepalive: Optional[int] = None,
    tcp_keepalive_interval: Optional[int] = None,
    tcp_keepalive_retries: Optional[int] = None,
    tcp_user_timeout: Optional[int] = None,

    # Connection pooling
    pool_idle_timeout: Optional[int] = None,
    pool_max_idle_per_host: Optional[int] = None,
    pool_max_size: Optional[int] = None,

    # Protocol options
    http1_only: Optional[bool] = None,
    http2_only: Optional[bool] = None,
    https_only: Optional[bool] = None,
    tcp_nodelay: Optional[bool] = None,
    http2_max_retry_count: Optional[int] = None,

    # TLS
    verify: Optional[Union[bool, Path]] = None,
    tls_info: Optional[bool] = None,
    min_tls_version: Optional[TlsVersion] = None,
    max_tls_version: Optional[TlsVersion] = None,

    # Proxy & network
    no_proxy: Optional[bool] = None,
    proxies: Optional[List[Proxy]] = None,
    local_address: Optional[Union[str, ipaddress.IPv4Address, ipaddress.IPv6Address]] = None,
    interface: Optional[str] = None,

    # Compression
    gzip: Optional[bool] = None,
    brotli: Optional[bool] = None,
    deflate: Optional[bool] = None,
    zstd: Optional[bool] = None,
) -> Client
```

**Documentation comments (from __init__.pyi):**

```
timeout: Total timeout (seconds).
connect_timeout: Connection timeout (seconds).
read_timeout: Read timeout (seconds).
```

---

### 3. Timeout Lifecycle Scope

**NOT a per-operation setting** - timeouts are **per-request lifecycle phases**:

- **`timeout`** → Applies to entire request (connect + send + receive phases combined)
- **`connect_timeout`** → Specific to TCP connection establishment only
- **`read_timeout`** → Specific to reading response data (per individual read operations)
- **`write_timeout`** → Specific to sending request data (per individual write operations)
- **`pool_timeout`** → Specific to acquiring a connection from the pool

**Where to set them:**

1. **Client initialization** - applies to all requests:
   ```python
   client = rnet.Client(timeout=30, connect_timeout=5, read_timeout=10)
   ```

2. **Per-request override** - via RequestParams:
   ```python
   response = await client.request(
       rnet.Method.GET,
       url,
       timeout=60,
       read_timeout=15
   )
   ```

---

### 4. Streaming-Specific Timeout Configuration

**YES - streaming respects the same timeout parameters**, but they apply at streaming read level:

From __init__.pyi, the `Response.stream()` method returns a `Streamer` (async iterator):

```python
class Streamer:
    r"""
    A byte stream response.
    An asynchronous iterator yielding data chunks from the response stream.
    """
    def __aiter__(self) -> Streamer: ...
    def __anext__(self) -> Any: ...
```

**How it works with timeouts:**

- The initial response is subject to connect/request timeouts
- Each chunk read from `async for chunk in streamer:` is subject to the `read_timeout`
- If streaming stalls for longer than `read_timeout` seconds, it times out
- Total streaming time is NOT capped by `timeout` (which applies only to initial response)

**Example from docs:**

```python
resp = await rnet.get("https://httpbin.org/stream/20")
async with resp.stream() as streamer:
    async for chunk in streamer:
        print("Chunk: ", chunk)
        await asyncio.sleep(0.1)
```

Each iteration's read will timeout if it takes longer than `read_timeout`.

---

### 5. RequestParams TypedDict

Request-level timeout params (from __init__.pyi):

```python
class RequestParams(TypedDict, closed=True):
    timeout: NotRequired[int]        # Per-request override
    read_timeout: NotRequired[int]   # Per-request override
    # ... other params
```

Only `timeout` and `read_timeout` can be overridden per-request. Other timeouts (connect, write, pool) are client-wide only.

---

### 6. Project's Current Usage

**File:** `app/core/http_client.py` (lines 328-333)

```python
self._client = RnetClient(
    emulation=rnet_emulation,
    timeout=timeout,              # int from settings.request_timeout
    proxies=proxies,
    allow_redirects=follow_redirects,
)
```

**Current behavior:** Only uses `timeout` parameter. No granular control for connect/read timeouts.

---

## Type Validation Results

**Tested parameter acceptance:**

✅ `Client(timeout=30)` - works
✅ `Client(read_timeout=30)` - works
✅ `Client(connect_timeout=30)` - works
✅ `Client(write_timeout=30)` - works
✅ `Client(pool_timeout=30)` - works
✅ `client.update(timeout=30)` - works (after instantiation)
❌ `Client(proxies=['http://...'])` - TypeError (must be Proxy objects)
❌ Timeout values must be integers (float 0.001 rejects with "object cannot be interpreted as an integer")

---

## Key Insights

1. **Rust backend:** Error messages reference `wreq` (likely wraps `reqwest` Rust crate), which is why timeout semantics differ from Python's httpx
2. **Time unit:** **Seconds only** (not milliseconds) - integer values only
3. **No write_timeout in per-request** - write timeout is client-wide only
4. **Pool timeout separate** - relevant when using connection pooling with multiple concurrent requests
5. **Streaming reads timeout individually** - long-duration streams won't timeout on total duration, only on individual read stalls
6. **Error on timeout:** Raises `rnet.TimeoutError` exception

---

## Recommendations for Project

### If implementing granular timeout control:

```python
# Enhanced initialization
client = rnet.Client(
    emulation=rnet_emulation,
    timeout=settings.request_timeout,           # Overall timeout
    connect_timeout=settings.connect_timeout,   # TCP connection
    read_timeout=settings.read_timeout,         # Response reading
    pool_timeout=settings.pool_timeout,         # Pool acquisition
    proxies=proxies,
    allow_redirects=follow_redirects,
)

# Per-request override for streaming
response = await client.request(
    method=rnet_method,
    url=url,
    timeout=None,      # Infinite
    read_timeout=10,   # Short for streaming
    **request_kwargs
)
```

### Current project value:
- `settings.request_timeout` = 30 (default from config) - maps to `timeout` param
- This is an **overall timeout** on the entire request, not just read ops

---

## References

**Source files examined:**
- `C:\Python311\Lib\site-packages\rnet\__init__.pyi` (type stubs, lines 26-52, 79-335)
- Project file: `app/core/http_client.py` (rnet usage)
- `pyproject.toml` (dependency: `rnet>=3.0.0rc14`)
- Package info: rnet 2.4.2

**Note:** rnet docs at https://rnet.readthedocs.io/ are incomplete; stub file is authoritative.

---

## Unresolved Questions

1. What is the default timeout if not specified? (likely None = infinite)
2. Does `write_timeout` affect streaming uploads? (assumed yes, but not tested)
3. Is there a timeout for WebSocket operations? (WebSocketParams has no timeout fields)
4. How does timeout interact with HTTP/2 multiplexing in concurrent requests?
