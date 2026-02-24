# Clove Project Overview & PDR

## Project Summary

**Clove** is a Claude.ai reverse proxy (v0.3.1) that enables access to Claude APIs through multiple authentication methods. It bridges Claude.ai and standard Claude API clients, making Claude accessible to any application using the Anthropic SDK or Claude API-compatible tools.

**Key Innovation**: First reverse proxy supporting OAuth authentication for Claude's official API (same method as Claude Code).

**Author**: mirrorange <orange@freesia.ink>
**License**: MIT
**Repository**: https://github.com/mirrorange/clove
**PyPI**: clove-proxy

## Project Metrics

- **Python LOC**: ~5,000 (55 files)
- **Frontend LOC**: ~2,700 (React/TypeScript)
- **Total**: ~7,700 LOC
- **Python Support**: 3.11, 3.12, 3.13+
- **Version**: 0.3.1 (Beta)

## Core Use Cases

1. **API Bridge**: Enable OAuth access to Claude for applications limited to standard API
2. **Web Proxy**: Provide Claude.ai access when API credentials unavailable
3. **Load Balancing**: Distribute requests across multiple Claude accounts
4. **Session Management**: Maintain persistent cookie-based sessions
5. **Admin Control**: Centralized account and key management via web interface

## Technical Stack

### Backend
- **Framework**: FastAPI 0.115+
- **Python**: 3.11+
- **Server**: Uvicorn
- **Architecture**: Pipeline-based processor pattern
- **Key Dependencies**: httpx, pydantic, tenacity, tiktoken, loguru

### Frontend
- **Library**: React 19.1
- **Language**: TypeScript 5.8
- **Build**: Vite 7.0
- **Styling**: TailwindCSS 4.1 + shadcn/ui
- **i18n**: react-i18next (en, zh)
- **Routing**: React Router DOM 7.6
- **HTTP**: Axios

### Infrastructure
- **Containerization**: Docker (multi-stage, multi-platform)
- **Package Manager**: uv (Python), pnpm (Node)
- **Build System**: hatchling
- **CI/CD**: GitHub Actions (PyPI publish, Docker multi-platform)

## Functional Requirements

### F1: OAuth Authentication
- Direct Claude API access via OAuth tokens
- Automatic token exchange from cookies
- Support for preferred auth method per account
- Token refresh and expiration handling

### F2: Web Proxy Mode
- Claude.ai web interface emulation
- Cookie-based session management
- Image upload support
- Extended thinking support
- Function calling adaptation
- Stop sequences adaptation

### F3: Dual-Mode Request Processing
- Intelligent switching between OAuth and web proxy
- Model availability awareness
- Account capacity checking
- Load balancing across multiple accounts

### F4: Admin Management Interface
- Modern React-based dashboard
- Account CRUD operations (via web UI)
- OAuth authentication setup
- API key management
- System statistics and monitoring
- Responsive design (desktop/mobile)

### F5: Internationalization
- Frontend: English and Simplified Chinese
- Automatic language detection
- LocalStorage persistence
- 170+ translation keys

### F6: Request Processing Pipeline
- 12-step processor chain
- Request validation and transformation
- Response parsing and event handling
- Token counting and model injection
- Streaming and non-streaming responses

### F7: Session & Cache Management
- Persistent cookie-based sessions
- Session timeout and cleanup
- Prompt cache affinity
- Tool call tracking and cleanup

### F8: Error Handling
- Comprehensive exception hierarchy
- User-friendly error messages
- Graceful fallback mechanisms
- Logging and debugging support

## Non-Functional Requirements

### NFR1: Performance
- Sub-second response times
- Efficient connection pooling
- Streaming response support
- Token counting optimization

### NFR2: Reliability
- Automatic retry with exponential backoff
- Connection failure recovery
- Session persistence across restarts
- Quota reset recovery

### NFR3: Scalability
- Multi-account load balancing
- Concurrent request handling
- Efficient memory management
- Docker containerization

### NFR4: Security
- API key validation
- Admin authentication
- Cookie isolation
- CORS protection
- Input validation (Pydantic)

### NFR5: Maintainability
- Clear module organization
- Comprehensive error handling
- Extensive logging
- Documentation and examples

### NFR6: Compatibility
- Python 3.11+
- Linux, macOS, Windows
- Standard Claude API clients
- Claude Code compatible

## Acceptance Criteria

### AC1: OAuth Authentication
- [ ] OAuth accounts exchange tokens successfully
- [ ] Tokens refresh before expiration
- [ ] Failed OAuth falls back to web proxy
- [ ] Preferred auth method respected per account

### AC2: Web Proxy
- [ ] Claude.ai requests processed correctly
- [ ] Image uploads handled
- [ ] Extended thinking parsed
- [ ] Responses streamed or buffered per spec

### AC3: Admin Interface
- [ ] CRUD operations work for accounts
- [ ] API keys generated and validated
- [ ] Statistics display accurate data
- [ ] Responsive on mobile and desktop

### AC4: i18n
- [ ] English UI renders correctly
- [ ] Chinese UI renders correctly
- [ ] Language toggle persists
- [ ] All text translated

### AC5: API Compatibility
- [ ] Claude API requests accepted
- [ ] Response format matches specification
- [ ] Streaming works
- [ ] Error responses formatted correctly

### AC6: Docker
- [ ] Docker build succeeds
- [ ] Multi-platform builds (amd64, arm64)
- [ ] Volume mounting for persistence
- [ ] Environment variables respected

## Known Limitations

1. **Termux Incompatibility**: curl_cffi doesn't work on Android Termux (workaround: use OAuth-only mode)
2. **Parallel Tool Calls**: Web proxy mode has connection limits with many concurrent tool calls
3. **Prompt Structure**: Web proxy adds system prompts; structure-sensitive prompts may differ
4. **Free Tier**: No OAuth access; limited to web proxy mode

## Design Patterns

### Pipeline Pattern
Request processing through 12 sequential processors:
1. TestMessage
2. ToolResult
3. ClaudeAPI
4. ClaudeWeb
5. EventParsing
6. ModelInjector
7. StopSequences
8. ToolCallEvent
9. MessageCollector
10. TokenCounter
11. StreamingResponse
12. NonStreamingResponse

### Singleton Pattern
Service managers (AccountManager, SessionManager, CacheService, OAuthAuthenticator) as singletons for state management.

### Factory Pattern
Processor creation based on context (OAuth vs web proxy).

### Adapter Pattern
Claude.ai web interface adapted to match API behavior.

## API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | /v1/messages | API Key | Claude message endpoint |
| GET/POST/PUT/DELETE | /api/admin/accounts/* | Admin | Account management |
| POST | /api/admin/accounts/:id/oauth/exchange | Admin | OAuth token exchange |
| GET/PUT | /api/admin/settings | Admin | Settings management |
| GET | /api/admin/statistics | Admin | System statistics |
| GET | /health | None | Health check |

## Dependencies

### Core
- fastapi, uvicorn, httpx, pydantic, pydantic-settings
- tenacity (retry), tiktoken (tokens), loguru (logging)

### Optional
- curl_cffi (web requests)
- rnet (high-performance HTTP)

### Frontend
- react, typescript, vite, tailwindcss
- react-i18next, react-router-dom, axios
- shadcn/ui, radix-ui

## Success Metrics

1. **Functionality**: All F1-F8 requirements met
2. **Compatibility**: Works with Clewd alternative tools, SillyTavern, Claude SDK
3. **Performance**: <1s response time for typical requests
4. **Reliability**: 99.5% uptime in Docker deployments
5. **Adoption**: Community forks and external projects using Clove
6. **Documentation**: Complete README, deployment guides, API docs

## Project Phases

### Phase 1: Core (COMPLETE)
- OAuth authentication
- Web proxy mode
- Admin interface
- Basic i18n

### Phase 2: Enhancement (CURRENT)
- Preferred auth method per account
- Advanced load balancing
- Improved session management
- Extended i18n coverage

### Phase 3: Future
- WebSocket support
- Advanced caching strategies
- Custom processor plugins
- Rate limiting per API key
- Audit logging
