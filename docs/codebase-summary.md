# Clove Codebase Summary

Generated from repomix analysis of the complete codebase.

## Directory Structure

```
clove/
├── app/                          # Python backend (~5,000 LOC)
│   ├── main.py                   # Entry point, lifespan, app setup
│   ├── api/                      # FastAPI routers
│   │   ├── main.py               # Router registration
│   │   └── routes/               # Route handlers
│   │       ├── claude.py          # POST /v1/messages (main API)
│   │       ├── accounts.py        # Account CRUD operations
│   │       ├── settings.py        # Settings management
│   │       └── statistics.py      # System statistics
│   ├── core/                     # Core application logic
│   │   ├── config.py             # Pydantic settings (env vars)
│   │   ├── account.py            # Account model definition
│   │   ├── claude_session.py      # Session state management
│   │   ├── exceptions.py         # Exception hierarchy
│   │   ├── error_handler.py      # Global error handler
│   │   ├── http_client.py        # HTTP client (rnet > curl_cffi > httpx)
│   │   ├── external/             # External service integrations
│   │   │   └── claude_client.py  # Claude API client wrapper
│   │   └── static.py             # Static file route registration
│   ├── models/                   # Pydantic models
│   │   ├── claude.py             # Claude API req/resp models
│   │   ├── internal.py           # Internal models (Account, Session)
│   │   └── streaming.py          # SSE streaming models
│   ├── processors/               # Request processing pipeline
│   │   ├── base.py               # Base processor class
│   │   └── claude_ai/            # Claude-specific processors
│   │       ├── context.py        # Processor context
│   │       ├── claude_api_processor.py       # OAuth API requests
│   │       ├── claude_web_processor.py       # Web proxy requests
│   │       ├── event_parser_processor.py     # Parse SSE events
│   │       ├── message_collector_processor.py # Collect stream messages
│   │       ├── model_injector_processor.py   # Inject model in response
│   │       ├── non_streaming_response_processor.py # Buffer stream
│   │       ├── stop_sequences_processor.py        # Apply stops
│   │       ├── streaming_response_processor.py    # Stream response
│   │       ├── test_message_processor.py          # Validate request
│   │       ├── token_counter_processor.py         # Count tokens
│   │       └── tool_call_processor.py             # Handle tool calls
│   ├── services/                 # Singleton service managers
│   │   ├── account.py            # AccountManager (load balance)
│   │   ├── session.py            # SessionManager (web proxy)
│   │   ├── cache.py              # CacheService (prompt cache)
│   │   ├── oauth_authenticator.py # OAuthAuthenticator (tokens)
│   │   ├── i18n.py               # I18nService (translations)
│   │   └── tool_call.py          # ToolCallManager (tracking)
│   ├── dependencies/             # Dependency injection
│   │   └── auth.py               # API key auth validators
│   ├── utils/                    # Utility functions
│   │   ├── logger.py             # Logging configuration
│   │   ├── message.py            # Message processing
│   │   ├── image.py              # Image handling
│   │   └── retry.py              # Retry decorators
│   ├── locales/                  # i18n translation files
│   │   ├── en.json               # English (170+ keys)
│   │   └── zh.json               # Simplified Chinese
│   └── static/                   # Compiled React frontend
│
├── front/                        # React frontend (~2,700 LOC)
│   ├── src/
│   │   ├── main.tsx              # React entry
│   │   ├── App.tsx               # Root component
│   │   ├── pages/                # Page components
│   │   │   ├── Login.tsx          # Admin login page
│   │   │   ├── Dashboard.tsx      # Statistics dashboard
│   │   │   ├── Accounts.tsx       # Account CRUD table/cards
│   │   │   └── Settings.tsx       # API keys + config
│   │   ├── components/           # Reusable components
│   │   │   ├── AccountModal.tsx   # Account form modal
│   │   │   ├── OAuthModal.tsx     # OAuth setup modal
│   │   │   ├── BatchCookieModal.tsx # Batch import modal
│   │   │   ├── LanguageSwitcher.tsx # i18n toggle
│   │   │   ├── ui/               # Shadcn UI components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── sidebar.tsx
│   │   │   │   └── (others)
│   │   │   └── hooks/            # Custom hooks
│   │   │       └── useIsMobile.tsx # Responsive detection
│   │   ├── lib/
│   │   │   ├── api.ts            # Axios + interceptors
│   │   │   └── utils.ts          # Utility functions
│   │   ├── i18n/
│   │   │   ├── config.ts         # react-i18next setup
│   │   │   └── locales/          # Translation files
│   │   ├── types/                # TypeScript types
│   │   │   └── index.ts          # API response types
│   │   └── styles/               # Global styles
│   │       └── index.css         # Tailwind config
│   ├── vite.config.ts            # Vite build config
│   ├── tsconfig.json             # TypeScript config
│   ├── package.json              # Dependencies
│   └── pnpm-lock.yaml            # Lock file
│
├── .github/workflows/            # CI/CD automation
│   └── build-and-publish.yml     # Build, test, publish pipeline
│
├── docker-compose.yml            # Local development/deployment
├── Dockerfile                    # Multi-stage production build
├── Dockerfile.pypi               # PyPI package builder
├── Dockerfile.huggingface        # HuggingFace space deployment
│
├── Makefile                      # Development commands
├── pyproject.toml                # Python project config
├── .env.example                  # Environment variables template
├── .python-version               # Python version pin
├── uv.lock                       # Python dependency lock
│
└── docs/                         # Documentation
    ├── project-overview-pdr.md
    ├── codebase-summary.md       # This file
    ├── code-standards.md
    ├── system-architecture.md
    ├── deployment-guide.md
    └── project-roadmap.md
```

## File Statistics

### Top Files by Complexity

| File | Purpose | LOC |
|------|---------|-----|
| front/src/components/ui/sidebar.tsx | Responsive sidebar | ~500 |
| front/src/pages/Settings.tsx | Settings page | ~450 |
| front/src/pages/Accounts.tsx | Accounts CRUD page | ~400 |
| app/services/account.py | Account management | ~350 |
| app/core/http_client.py | HTTP abstraction | ~330 |
| app/processors/claude_ai/claude_web_processor.py | Web proxy logic | ~300 |

### Code Organization

- **Backend**: 55 Python files (~5,000 LOC)
- **Frontend**: 40+ TypeScript/TSX files (~2,700 LOC)
- **Configuration**: 10+ config files
- **Documentation**: 6+ markdown files
- **CI/CD**: GitHub Actions workflows

## Key Modules

### Backend Core

**app/main.py**
- FastAPI app initialization
- CORS middleware
- Lifespan management (startup/shutdown)
- Static file serving

**app/core/config.py**
- Pydantic settings with environment variable loading
- Configuration validation
- Default values

**app/core/http_client.py**
- HTTP client factory with fallback chain
- rnet > curl_cffi > httpx
- Connection pooling
- Request timeout handling

**app/services/account.py**
- Singleton AccountManager
- Account CRUD operations
- Load balancing across accounts
- OAuth token management
- Account persistence (JSON)

**app/processors/base.py**
- Base processor class
- Processor chain pattern
- Context passing

### Frontend Core

**front/src/App.tsx**
- Router setup (React Router 7.6)
- Protected routes (auth checking)
- Theme setup

**front/src/pages/Accounts.tsx**
- Account table (desktop) / cards (mobile)
- CRUD operations
- Modal integration
- Batch import via cookie

**front/src/lib/api.ts**
- Axios instance with auth interceptor
- Error handling
- Base URL configuration

**front/src/i18n/config.ts**
- react-i18next initialization
- Language detection
- LocalStorage persistence

## Request Flow

### OAuth Flow (OAuth Mode)
```
Client Request
  → Route handler (routes/claude.py)
    → Dependency (get_admin_key or get_api_key)
      → Test Processor
        → Model Injector
          → Claude API Processor
            → HTTP client (rnet/curl_cffi/httpx)
              → Claude OAuth API
                → Parse response
                  → Token Counter
                    → Streaming Response Processor
                      → Client Response (SSE or JSON)
```

### Web Proxy Flow
```
Client Request
  → Route handler (routes/claude.py)
    → Dependency (get_api_key)
      → Test Processor
        → Model Injector
          → Claude Web Processor
            → Session Manager (get session)
              → HTTP client → Claude.ai web
                → Event Parser
                  → Message Collector
                    → Tool Call Processor (if needed)
                      → Stop Sequences
                        → Token Counter
                          → Streaming/Non-streaming Response
                            → Client Response
```

## Configuration Management

**app/core/config.py** uses Pydantic settings:
- Environment variable loading
- Type validation
- Default values
- Nested model support

Key settings:
- `HOST`, `PORT` — Server binding
- `ADMIN_API_KEYS` — Admin authentication
- `API_KEYS` — Client authentication
- `COOKIES` — Claude.ai web access
- `LOG_LEVEL`, `LOG_TO_FILE` — Logging
- `OAUTH_*` — OAuth settings
- `SESSION_*` — Session configuration

## Database/Persistence

No traditional database. Data persisted as JSON:
- **Accounts**: `{DATA_FOLDER}/accounts.json`
- **Sessions**: In-memory with cleanup tasks
- **Cache**: Memory-based with TTL

## Internationalization

- **Frontend**: 170+ translation keys in English and Chinese
- **Backend**: JSON locale files in `app/locales/`
- **Language**: Browser locale detection, localStorage persistence

## Testing

No explicit test directory visible, but test-related files excluded from builds via `pyproject.toml`.

## Dependencies Management

- **Python**: `pyproject.toml` + `uv.lock`
- **Node**: `package.json` + `pnpm-lock.yaml`
- **Optional groups**: `curl`, `rnet` (HTTP), `dev` (build tools)

## Build Pipeline

1. **Frontend**: Vite build → TypeScript → Tailwind CSS → bundled static
2. **Backend**: uv sync → wheel package → Docker image
3. **Docker**: Multi-stage build, multi-platform (amd64, arm64)

## CI/CD

GitHub Actions workflow:
- Build frontend and backend
- Run tests (if present)
- Publish to PyPI (release)
- Push Docker images (ghcr.io, Docker Hub)
- Trivy security scan

## Performance Optimizations

- HTTP connection pooling
- Streaming responses (no buffer-all)
- Token counting optimization
- Prompt cache affinity
- Session reuse
- Image caching

## Security

- API key validation (Pydantic)
- Admin key checking
- CORS protection
- Cookie isolation per session
- Error message sanitization
- Input validation on all endpoints

## Notable Patterns

1. **Pipeline**: 12-processor chain for request handling
2. **Singleton**: Service managers maintain state
3. **Factory**: Processor selection based on auth mode
4. **Adapter**: Claude.ai interface adapted to API
5. **Repository**: Account persistence layer
