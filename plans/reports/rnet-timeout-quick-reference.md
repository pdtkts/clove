# rnet Timeout Quick Reference

## Direct Answers

### 1. Does rnet.Client() support granular timeout params?

**YES.** rnet supports these distinct timeout parameters:

- `timeout` - overall request timeout
- `connect_timeout` - TCP connection establishment
- `read_timeout` - response reading
- `write_timeout` - request sending
- `pool_timeout` - connection pool wait

### 2. API Signature of rnet.Client()

```python
rnet.Client(
    # Timeout parameters (all Optional[int], in seconds)
    timeout: Optional[int] = None,
    connect_timeout: Optional[int] = None,
    read_timeout: Optional[int] = None,

    # ... other 30+ parameters for headers, proxies, TLS, etc.
)
```

### 3. Timeout Scope (total vs per-operation)

- **`timeout`** → Total request lifecycle (all phases)
- **`connect_timeout`** → Connection phase only
- **`read_timeout`** → Per read operation (each chunk)
- **`write_timeout`** → Per write operation
- **`pool_timeout`** → Acquiring connection from pool

**NOT per-operation across all phases** - each is scoped to its phase.

### 4. Streaming Timeout Configuration

Streaming is supported via the timeout parameters used during request:

```python
response = await client.request(
    rnet.Method.GET,
    url,
    timeout=None,      # No total timeout
    read_timeout=10,   # 10 sec per chunk read
)

async with response.stream() as streamer:
    async for chunk in streamer:  # Each chunk must arrive within read_timeout
        process(chunk)
```

---

## Implementation Examples

### Basic client with timeouts:

```python
import rnet

client = rnet.Client(
    timeout=30,            # 30 sec total
    connect_timeout=5,     # 5 sec to establish connection
    read_timeout=10,       # 10 sec per read
)
```

### Per-request timeout override:

```python
response = await client.request(
    rnet.Method.GET,
    url,
    timeout=60,          # Override for this request
    read_timeout=15,     # Override for this request
)
```

### Streaming with granular control:

```python
response = await client.request(
    rnet.Method.GET,
    large_file_url,
    read_timeout=5,      # Short timeout per chunk
)

async with response.stream() as streamer:
    async for chunk in streamer:
        # Each chunk must arrive within 5 seconds
        save_chunk(chunk)
```

---

## Important Details

- **Value type:** Integers only (seconds, not milliseconds)
- **Error:** Raises `rnet.TimeoutError` on timeout
- **Per-request override:** `timeout` and `read_timeout` only
- **Client-wide only:** `connect_timeout`, `write_timeout`, `pool_timeout`
- **Streaming reads:** Each individual read operation times out independently; total streaming duration is not capped by `timeout`
- **Default:** None (likely infinite if not specified)

---

## Project Integration

Current code in `app/core/http_client.py`:

```python
self._client = RnetClient(
    emulation=rnet_emulation,
    timeout=timeout,  # Only using single timeout parameter
    proxies=proxies,
    allow_redirects=follow_redirects,
)
```

**Could be enhanced to:**

```python
self._client = RnetClient(
    emulation=rnet_emulation,
    timeout=settings.request_timeout,
    connect_timeout=settings.connect_timeout or 5,
    read_timeout=settings.read_timeout or 10,
    proxies=proxies,
    allow_redirects=follow_redirects,
)
```
