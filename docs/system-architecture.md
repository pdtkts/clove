# System Architecture

## High-Level Overview

Clove is a two-tier reverse proxy architecture:

```
┌─────────────────────────────────────────────────────┐
│                  Client Applications                 │
│  (Claude SDK, SillyTavern, Other API Clients)       │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP (Standard Claude API)
┌──────────────────────▼──────────────────────────────┐
│            Clove API Gateway (FastAPI)              │
│  - Request validation & transformation              │
│  - Account selection & routing                      │
│  - Response streaming                               │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
   ┌────▼────────┐          ┌────────▼────┐
   │ OAuth Mode  │          │ Web Proxy    │
   │             │          │              │
   │ Claude API  │          │ Claude.ai    │
   │ (api.      │          │ (claude.ai)  │
   │  anthropic) │          │              │
   └─────────────┘          └──────────────┘
```

## Architectural Components

### 1. API Gateway Layer (FastAPI)

**Location**: `app/api/routes/`

**Responsibility**: HTTP request handling, routing, response formatting

**Key Routers**
- `claude.py` — Main Claude message endpoint (`POST /v1/messages`)
- `accounts.py` — Account CRUD operations
- `settings.py` — System configuration
- `statistics.py` — Usage statistics
- Health check endpoint

**Request Flow**
```
HTTP Request
  ↓
Authentication (Dependency)
  ├─ Admin operations: ADMIN_API_KEYS
  └─ Client operations: API_KEYS
  ↓
Route Handler (routes/claude.py)
  ↓
Processor Pipeline (see below)
  ↓
HTTP Response (JSON or Server-Sent Events)
```

### 2. Processor Pipeline

**Location**: `app/processors/claude_ai/`

**Pattern**: Chain of responsibility with 12 sequential processors

**Processor Chain**
```
1. TestMessage
   ├─ Validate request structure
   └─ Check for required fields

2. ToolResult
   ├─ Handle tool call results
   └─ Append to message history

3. ClaudeAPI (if OAuth account selected)
   ├─ Call Claude OAuth API
   └─ Handle API response

4. ClaudeWeb (if web proxy mode selected)
   ├─ Maintain Claude.ai session
   └─ Emulate browser behavior

5. EventParsing
   ├─ Parse streaming responses
   └─ Extract events from SSE

6. ModelInjector
   ├─ Inject model name in response
   └─ Ensure consistency

7. StopSequences
   ├─ Apply stop sequences
   └─ Truncate response if matched

8. ToolCallEvent
   ├─ Handle tool/function calls
   └─ Track pending calls

9. MessageCollector
   ├─ Accumulate streamed messages
   └─ Build complete response

10. TokenCounter
    ├─ Count request tokens
    └─ Count response tokens

11. StreamingResponse
    ├─ Stream response as SSE
    └─ Flush on event boundary

12. NonStreamingResponse
    ├─ Buffer complete response
    └─ Return as JSON
```

**Base Class** (app/processors/base.py)
```python
class Processor(ABC):
    async def process(
        self,
        context: ProcessorContext
    ) -> ProcessorContext:
        """Process request/response."""
        pass
```

### 3. Service Layer (Singleton Managers)

**Location**: `app/services/`

Each service manages application state and coordinates operations.

#### AccountManager (account.py)
- **Responsibility**: Account CRUD, load balancing, OAuth coordination
- **State**: Accounts list, account index, background task
- **Key Methods**:
  - `add_account(cookie_value)` — Create account
  - `get_account(account_id)` — Retrieve account
  - `list_accounts()` — All accounts
  - `select_account(model)` — Load balance by model availability
  - `save_accounts()` — Persist to JSON
- **Persistence**: `{DATA_FOLDER}/accounts.json`

#### SessionManager (session.py)
- **Responsibility**: Web proxy session lifecycle
- **State**: Active sessions, session timeouts
- **Key Methods**:
  - `get_or_create_session(cookie)` — Session retrieval
  - `cleanup_expired()` — Timeout cleanup
- **Timeout**: Configurable, default 300s

#### OAuthAuthenticator (oauth_authenticator.py)
- **Responsibility**: OAuth token exchange and refresh
- **State**: OAuth configuration
- **Key Methods**:
  - `exchange_code(authorization_code)` — Get access token
  - `refresh_token(account_id)` — Refresh expired token
- **Endpoints**: Configurable OAuth URLs

#### CacheService (cache.py)
- **Responsibility**: Prompt cache management
- **State**: Cache entries with TTL
- **Key Methods**:
  - `get(key)` — Retrieve cached value
  - `set(key, value, ttl)` — Cache with expiration
  - `cleanup_expired()` — TTL cleanup

#### I18nService (i18n.py)
- **Responsibility**: Translation management
- **State**: Locale files, language mappings
- **Key Methods**:
  - `get_translations(language)` — Load locale
  - `translate(key, language)` — Get translation
- **Locales**: `app/locales/en.json`, `app/locales/zh.json`

#### ToolCallManager (tool_call.py)
- **Responsibility**: Track pending tool calls
- **State**: Pending tool calls, result cache
- **Key Methods**:
  - `add_call(call_id)` — Register call
  - `set_result(call_id, result)` — Store result
  - `get_result(call_id)` — Retrieve result

### 4. Core Infrastructure

**Location**: `app/core/`

#### HTTP Client (http_client.py)
- **Responsibility**: Abstraction over HTTP libraries
- **Fallback Chain**: rnet > curl_cffi > httpx
- **Features**:
  - Connection pooling
  - Request timeout
  - Retry logic
  - Session reuse

**Selection Logic**
```python
try:
    # Try rnet (highest performance)
    import rnet
except ImportError:
    try:
        # Fallback to curl_cffi
        import curl_cffi
    except ImportError:
        # Final fallback to httpx (always available)
        import httpx
```

#### Configuration (config.py)
- **Tool**: Pydantic settings with environment validation
- **Source**: Environment variables
- **Validation**: Type checking, default values
- **Structure**: Nested models for logical grouping

#### Exception Hierarchy (exceptions.py)
```
AppError
├── AuthenticationError
├── ConfigurationError
├── ExternalServiceError
├── ValidationError
├── SessionError
└── QuotaExceededError
```

#### Error Handler (error_handler.py)
- Catches AppError exceptions
- Returns user-friendly error responses
- Logs errors at appropriate levels
- Sanitizes sensitive information

### 5. Data Models

**Location**: `app/models/`

#### Claude Models (claude.py)
- `MessageRequest` — User message request
- `MessageResponse` — AI response
- `ContentBlock` — Text/image/tool content
- `ToolUseBlock` — Function call
- `StreamEvent` — SSE event types

#### Internal Models (internal.py)
- `Account` — Account state and metadata
- `Session` — Web proxy session
- `AccountStatus` — Quota and availability

#### Streaming Models (streaming.py)
- `SSEEvent` — Server-sent event format
- `DeltaEvent` — Incremental updates

### 6. Frontend Architecture

**Location**: `front/src/`

#### Component Hierarchy
```
App
├── Router
│   ├── Login
│   ├── Dashboard
│   │   ├── StatCard
│   │   └── Chart (TBD)
│   ├── Accounts
│   │   ├── AccountTable (desktop)
│   │   ├── AccountCards (mobile)
│   │   ├── AccountModal
│   │   ├── OAuthModal
│   │   └── BatchCookieModal
│   └── Settings
│       ├── APIKeySection
│       └── ConfigSection
├── Sidebar (nav)
└── LanguageSwitcher
```

#### State Management
- **Pattern**: Component-level `useState`
- **No Redux/Zustand**
- **API calls**: Axios with loading/error states
- **Auth**: localStorage for admin key

#### Styling
- **Framework**: TailwindCSS 4.1
- **UI Library**: Shadcn/ui + Radix
- **Responsive**: Mobile-first, 768px breakpoint
- **Components**: Dialog/Drawer pattern

#### i18n
- **Library**: react-i18next
- **Locales**: en.json, zh.json (170+ keys)
- **Detection**: Browser language, localStorage override
- **Persistence**: localStorage for user preference

## Authentication & Authorization

### Admin Operations
- **Header**: `Authorization: Bearer {ADMIN_API_KEY}`
- **Operations**: Account CRUD, settings, OAuth setup
- **Storage**: ADMIN_API_KEYS (comma-separated)

### Client API Calls
- **Header**: `Authorization: Bearer {API_KEY}`
- **Operations**: Message API, statistics (read-only)
- **Storage**: API_KEYS (comma-separated)

### OAuth Authentication
- **Flow**: Authorization code
- **Client ID**: Configured (default: Claude Code client)
- **Token**: Stored in Account object
- **Refresh**: Automatic before expiration

## Data Flow Diagrams

### Message Request (OAuth Mode)
```
1. Client sends message request
   ↓
2. Route validates API key
   ↓
3. AccountManager selects OAuth account
   ↓
4. Request → Processor pipeline
   ├─ TestMessage: validate structure
   ├─ ClaudeAPI: call api.anthropic.com
   ├─ EventParsing: parse response
   ├─ ModelInjector: add model name
   ├─ TokenCounter: estimate tokens
   └─ StreamingResponse: stream to client
   ↓
5. Client receives SSE stream
```

### Message Request (Web Proxy Mode)
```
1. Client sends message request
   ↓
2. Route validates API key
   ↓
3. AccountManager selects web proxy account
   ↓
4. SessionManager gets/creates Claude.ai session
   ↓
5. Request → Processor pipeline
   ├─ TestMessage: validate structure
   ├─ ClaudeWeb: post to claude.ai
   ├─ EventParsing: parse event stream
   ├─ MessageCollector: accumulate messages
   ├─ ToolCallEvent: handle calls if present
   ├─ TokenCounter: estimate tokens
   └─ StreamingResponse: stream to client
   ↓
6. Client receives SSE stream
```

### Account Management
```
Client Request (POST /api/admin/accounts)
   ↓
Admin Auth: verify ADMIN_API_KEY
   ↓
Route Handler: validate request
   ↓
AccountManager.add_account()
   ├─ Create Account object
   ├─ Initialize OAuth if applicable
   ├─ Add to accounts list
   └─ Persist to accounts.json
   ↓
Response: Account created
```

## Deployment Architecture

### Docker Multi-Stage Build
```
Stage 1: Frontend Builder
├─ Node 20 Alpine
├─ Copy package files
├─ pnpm install
├─ Copy source
└─ Vite build

Stage 2: Python Application
├─ uv + Python 3.11
├─ Copy pyproject.toml + uv.lock
├─ uv sync (dependencies)
├─ Copy app source
├─ Copy frontend build (from stage 1)
├─ uv sync (project install)
└─ CMD: uvicorn app.main:app
```

### Container Configuration
- **Port**: 5201 (HTTP)
- **Volume**: `/data` (persistence)
- **Environment**: Via ENV or -e flags
- **Entry**: `python -m app.main`

### Docker Compose Setup
```yaml
services:
  clove:
    build: .
    ports:
      - "5201:5201"
    volumes:
      - ./data:/data
    environment:
      - ADMIN_API_KEYS=...
      - COOKIES=...
```

## Security Architecture

### Input Validation
- Pydantic models validate all inputs
- Type checking at request level
- Sanitization of user-provided values

### Authentication
- Admin operations require ADMIN_API_KEYS
- Client operations require API_KEYS
- OAuth tokens stored encrypted in accounts

### Cookie Isolation
- Sessions per Claude.ai cookie
- Cookies not shared across requests
- Cleanup on timeout

### Error Handling
- AppError exceptions caught globally
- Error messages don't leak internal details
- Stack traces only in debug logs

## Performance Optimizations

### Streaming
- SSE for real-time updates
- No buffering large responses
- Event flushing on boundaries

### Connection Pooling
- HTTP client connection reuse
- Session reuse for web proxy
- Timeout configuration

### Caching
- Prompt cache affinity tracking
- Response caching (future enhancement)
- Session reuse

### Concurrency
- Async/await throughout
- `asyncio.gather()` for parallel operations
- Connection limits per host

## Scalability Considerations

### Current Limitations
- Single-process (Uvicorn)
- In-memory session storage
- JSON-based persistence

### Future Enhancements
- Multi-worker deployment (gunicorn + Uvicorn)
- Redis for distributed sessions
- Database for persistence
- Message queue for async tasks

## Dependency Management

### Direct Dependencies
- **fastapi** — Web framework
- **httpx** — HTTP client
- **pydantic** — Validation
- **uvicorn** — ASGI server
- **tenacity** — Retries
- **tiktoken** — Token counting
- **loguru** — Logging

### Optional Dependencies
- **rnet** — High-performance HTTP
- **curl_cffi** — Advanced HTTP
- **cryptography** — Encryption (future)

### Frontend Dependencies
- **react** — UI library
- **react-router-dom** — Routing
- **axios** — HTTP client
- **tailwindcss** — Styling
- **react-i18next** — i18n
- **shadcn/ui** — Components

## Monitoring & Observability

### Logging
- Configured via `LOG_LEVEL`, `LOG_TO_FILE`
- Output to console and file (optional)
- Rotation and retention configured

### Health Check
- `GET /health` endpoint
- Returns status based on account count
- Used by Docker health checks

### Statistics
- `GET /api/admin/statistics` endpoint
- Tracks account stats, quota usage
- Response counts and error rates
