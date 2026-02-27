# rnet Architecture & Timeout Mechanics

## Architecture Overview

**rnet** is a **Rust-based HTTP client** with Python bindings:

```
Python Code (app/core/http_client.py)
    ↓
rnet Python Package (wrapper)
    ↓
rnet.cp311-win_amd64.pyd (compiled Rust extension)
    ↓
Underlying Rust HTTP stack
```

The `.pyd` is a compiled Rust binary; type stubs in `__init__.pyi` are the only Python interface documentation.

---

## Timeout Architecture

### Client-Level vs Request-Level

**Client initialization sets defaults:**
```python
client = rnet.Client(
    timeout=30,
    connect_timeout=5,
    read_timeout=10,
)
```

**Per-request can override:**
```python
await client.request(
    Method.GET,
    url,
    timeout=60,        # Overrides client's 30
    read_timeout=15,   # Overrides client's 10
    # write_timeout NOT overridable per-request
)
```

---

## Timeout Scopes Explained

### timeout (Overall Request)

Timeout for **entire request lifecycle**: connect → send → receive all headers/body.

```
CLIENT              NETWORK                SERVER
|                    |                       |
|------- request timer started ------>|      |
|                    |--[TCP.connect]->|      |
|                    |<--[connected]---|      |
|---[HTTP.send]----->|                 |      |
|                    |--[send body]--->|      |
|                    |<--[response]-----      |
|<---- all received --|                       |
|<---- if > timeout, TimeoutError fired
```

### connect_timeout (TCP Connection)

Timeout for **establishing TCP connection only**:

```
|--[TCP.connect]-->|  ← If stalls > connect_timeout, TimeoutError
|<--[ACK]----------|
```

Happens **before any HTTP data** is sent.

### read_timeout (Per Read)

Timeout for **each individual read operation**:

```
|<--[chunk 1]---|     ← Must arrive within read_timeout
|<--[chunk 2]---|     ← Each chunk on its own timer
|<--[chunk 3]---|     ← Not cumulative
```

**For streaming**, each `async for chunk in streamer:` must get data within read_timeout seconds.

### write_timeout (Per Write)

Timeout for **sending request body** (especially for large uploads):

```
|---[body part 1]--->|  ← Must complete within write_timeout
|---[body part 2]--->|  ← Each write on its own timer
```

### pool_timeout (Connection Pool)

When using connection pooling with concurrent requests:

```
Request A: |--get connection from pool--|  ← Wait up to pool_timeout
Request B: |--queued, waiting..........|
Request C: |--gets immediate connection|
```

---

## Streaming Timeout Behavior

### Scenario: Large file download

```python
response = await client.request(
    Method.GET,
    "https://example.com/large_file.zip",
    timeout=None,          # No total limit
    read_timeout=10,       # Each chunk must arrive in 10 sec
)

async with response.stream() as streamer:
    async for chunk in streamer:  # Up to 10 sec per chunk
        process(chunk)
```

**What happens:**

1. Initial request can take `timeout` seconds (if set)
2. Headers are received, response established
3. Each `async for` iteration waits up to `read_timeout` for next chunk
4. If no data arrives in `read_timeout` seconds → TimeoutError
5. **Total download time can be unlimited** (no aggregate timeout)

**Contrast with httpx:**

```python
# httpx (not rnet)
httpx.AsyncClient(timeout=30)  # 30 sec total, includes streaming
```

---

## Implementation in rnet Python Binding

From the `.pyi` stubs, the flow is:

1. `Client.__new__()` → Creates Rust client with config
2. Each method (`get`, `post`, `request`, etc.) → Routes to `request()`
3. `request(Method, URL, **RequestParams)` → Passes to Rust layer
4. Rust layer manages actual HTTP with configured timeouts
5. Returns `Response` object with async streaming support

---

## Error Handling

```python
try:
    response = await client.request(
        Method.GET,
        url,
        timeout=5,
    )
except rnet.TimeoutError:
    # Handle timeout - could be connect, read, write, or total
    log.error("Request timed out")
except rnet.RequestError as e:
    # Other request errors
    log.error(f"Request failed: {e}")
```

**Note:** The `rnet.TimeoutError` doesn't distinguish which phase timed out. For debugging, need to catch and examine context.

---

## Performance Implications

### TCP Connection Reuse

rnet maintains connection pool internally:

```
Client -> [Pool of TCP connections]
             ├─ http://api.example.com:80
             ├─ https://api2.example.com:443
             └─ ...
```

`pool_idle_timeout` (default not specified) determines how long idle connections stay open.

### Keepalive

```python
client = rnet.Client(
    no_keepalive=False,  # Default: use keepalive
    tcp_keepalive=60,    # TCP keepalive probe interval (seconds)
)
```

Keepalive allows reusing connections without reconnecting for each request.

### HTTP/2 Multiplexing

```python
client = rnet.Client(
    http2_only=False,    # Allow both HTTP/1.1 and HTTP/2
)
```

HTTP/2 multiplexing means multiple streams share one TCP connection, so connect_timeout is shared per connection, not per request.

---

## Why Granular Timeouts Matter

**Scenario: Slow network with unreliable server**

```
With timeout=30 only:
├─ Connect in 5 sec ✓
├─ Send request in 2 sec ✓
├─ Receive headers in 20 sec ✓
└─ Read first data chunk in 3 sec → ERROR (5+2+20+3 = 30, now stalled)

With granular timeouts:
├─ connect_timeout=10 → Passes in 5 sec ✓
├─ write_timeout=10 → Passes in 2 sec ✓
└─ read_timeout=20 → Can handle 20 sec stall per chunk ✓
```

Granular timeouts prevent premature failures in multi-phase operations.

---

## Debugging Timeout Issues

**Check client configuration:**

```python
# You can't inspect directly, but you can log what you set:
client = rnet.Client(
    timeout=30,
    connect_timeout=5,
    read_timeout=10,
)
log.info(f"Client configured with timeouts: conn={5}, read={10}, total={30}")
```

**Add per-request logging:**

```python
try:
    response = await client.request(
        Method.GET,
        url,
        timeout=60,
        read_timeout=15,
    )
except rnet.TimeoutError as e:
    log.error(f"Timeout on {url} with settings {timeout=60, read_timeout=15}")
```

---

## Project Impact Assessment

**Current code** uses only `timeout=30` from settings:
- Only covers total request time
- No distinction between connection and read phases
- May timeout legitimate slow uploads/downloads

**Potential improvements:**
1. Add `connect_timeout` for faster failure on network issues
2. Add separate `read_timeout` for streaming endpoints
3. Log timeout parameters for debugging
4. Handle streaming separately (longer read_timeout acceptable)

---

## Unresolved Areas

1. **Default timeout value** - What happens if not specified? (likely None = infinite)
2. **Interaction with proxies** - How do timeouts apply through proxy layers?
3. **WebSocket timeouts** - No timeout params in WebSocketParams TypedDict
4. **HTTP/2 push behavior** - Does timeout apply to server pushes?
5. **Connection reuse semantics** - When pool reuses connection, does connect_timeout still apply?
