# Project Roadmap

## Current Status

**Version**: 0.3.1 (Beta)
**Status**: Active Development
**Last Updated**: February 2026

## Vision

Make Claude.ai accessible to any application through a standard, well-designed reverse proxy that supports both OAuth (full API) and web proxy (fallback) modes with an intuitive admin interface.

## Completed Features

### Phase 1: Core Foundation (COMPLETE)

- [x] FastAPI backend with async support
- [x] OAuth authentication flow
- [x] Web proxy mode (Claude.ai emulation)
- [x] Request processing pipeline (12 processors)
- [x] Admin REST API for accounts/settings
- [x] React admin dashboard
- [x] Docker containerization (multi-platform)
- [x] PyPI publishing
- [x] i18n support (English, Chinese)
- [x] Session management
- [x] Tool call support
- [x] Streaming responses
- [x] Error handling and validation
- [x] Logging infrastructure

### Phase 2: Enhancement (CURRENT - 70% Complete)

- [x] Preferred authentication method per account
- [x] OAuth token auto-exchange from cookies
- [x] Advanced account load balancing
- [x] i18n UI completion (170+ keys)
- [ ] Improved session persistence (in progress)
- [ ] Extended performance optimizations
- [ ] Enhanced error recovery

## Planned Features

### Phase 3: Advanced Features (Next)

**Q1 2026**

- [ ] **WebSocket Support**
  - Real-time event streaming
  - Reduce latency for streaming responses
  - Priority: Medium

- [ ] **Rate Limiting**
  - Per-API-key rate limits
  - Per-account quota enforcement
  - Time-window based throttling
  - Priority: High

- [ ] **Audit Logging**
  - Request/response logging
  - Admin action audit trail
  - Search and filtering UI
  - Priority: Medium

- [ ] **Advanced Caching**
  - Response caching (with invalidation)
  - Prompt cache optimization
  - Cache statistics dashboard
  - Priority: Low

### Phase 4: Scalability (Future)

**Q2 2026**

- [ ] **Multi-Worker Support**
  - Horizontal scaling with Gunicorn
  - Load balancer integration
  - Priority: High

- [ ] **Distributed Session Storage**
  - Redis backend for sessions
  - Shared state across workers
  - Priority: High

- [ ] **Database Integration**
  - PostgreSQL for accounts (replacing JSON)
  - Persistent request logs
  - Analytics dashboards
  - Priority: Medium

- [ ] **Message Queue**
  - Async task processing
  - Background job queue (Celery/RQ)
  - Priority: Low

### Phase 5: Extensibility (Future)

**Q3 2026**

- [ ] **Custom Processor Plugins**
  - Plugin interface definition
  - Plugin loading system
  - Example plugins (filtering, transformation)
  - Priority: Medium

- [ ] **Webhook Support**
  - Event webhooks (auth, error, quota)
  - Custom callback URLs
  - Priority: Low

- [ ] **API Gateway Features**
  - Request transformation middleware
  - Response modification hooks
  - Priority: Medium

### Phase 6: Operational Excellence (Future)

**Q4 2026**

- [ ] **Observability**
  - Prometheus metrics endpoint
  - Distributed tracing (OpenTelemetry)
  - Grafana dashboard templates
  - Priority: Medium

- [ ] **Configuration Management**
  - YAML config file support
  - Hot reload without restart
  - Config validation and migration
  - Priority: Low

- [ ] **Admin UI Enhancements**
  - Advanced analytics dashboard
  - Request/response inspection tool
  - Account performance metrics
  - Priority: Medium

## Detailed Feature Specs

### Rate Limiting (Phase 3)

**Requirements**
- Per-API-key limits (configurable)
- Per-account quota tracking
- Time-window based (minute, hour, day)
- Graceful degradation on quota exceeded

**Configuration**
```bash
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=100
RATE_LIMIT_TOKENS_PER_HOUR=100000
```

**Response**
```json
{
  "error": "Rate limit exceeded",
  "retry_after": 60,
  "limits": {
    "requests": {"limit": 100, "remaining": 0},
    "tokens": {"limit": 100000, "remaining": 5000}
  }
}
```

### Audit Logging (Phase 3)

**Events to Log**
- Account created/updated/deleted
- API key generated/revoked
- OAuth authentication
- Failed authentication attempts
- Quota exceeded
- Admin panel logins

**Storage**
- File-based (JSON lines format)
- Structured fields: timestamp, actor, action, resource, status

**UI Features**
- Audit log viewer in admin panel
- Filterable by action, actor, date range
- Export to CSV
- Search and sorting

### WebSocket Support (Phase 3)

**Use Cases**
- Real-time streaming without SSE overhead
- Bidirectional communication
- Multiple concurrent messages

**Endpoint**
```
WS /v1/messages/stream
```

**Message Format**
```json
{"type": "message", "content": {...}}
{"type": "delta", "delta": {"text": "..."}}
{"type": "tool_use", "content": {...}}
{"type": "done"}
```

### Multi-Worker Scaling (Phase 4)

**Architecture**
```
Nginx Load Balancer
├── Uvicorn Worker 1 (5201)
├── Uvicorn Worker 2 (5202)
├── Uvicorn Worker 3 (5203)
└── Uvicorn Worker 4 (5204)
    ↓
Redis (shared sessions)
    ↓
Persistent Accounts Store
```

**Configuration**
```bash
WORKERS=4
WORKER_CLASS=uvicorn
BIND=0.0.0.0:5200
```

### Database Integration (Phase 4)

**Tables**
- `accounts` — Account info with encrypted OAuth tokens
- `api_keys` — Client API keys with usage tracking
- `sessions` — Web proxy sessions with TTL
- `request_logs` — Audit trail
- `quotas` — Rate limit tracking

**Benefits**
- Easier backup/restore
- Query-based analytics
- Multi-instance sharing
- Scalable to large datasets

## Community Requests

Prioritized based on impact and effort:

1. **Docker Hub Auto-Deploy** (High Impact, Low Effort) — Next release
2. **HuggingFace Spaces Support** (High Impact, Low Effort) — Current version
3. **Rate Limiting UI** (High Impact, Medium Effort) — Phase 3
4. **Webhook Notifications** (Medium Impact, Medium Effort) — Phase 5
5. **Custom Processor API** (Medium Impact, High Effort) — Phase 5

## Release Schedule

| Version | Target | Focus |
|---------|--------|-------|
| 0.3.1 | Now | Beta launch, i18n |
| 0.4.0 | Q1 2026 | Rate limiting, audit logging |
| 0.5.0 | Q2 2026 | Multi-worker, database |
| 1.0.0 | Q3 2026 | Stable release, plugins |
| 1.1.0+ | Q4 2026+ | Observability, advanced features |

## Success Metrics

### User Adoption
- GitHub stars: Target 500+ (currently ~100)
- PyPI downloads: Target 1,000+/month (currently ~200/month)
- Community forks: Target 20+ (currently ~3)

### Quality
- Code coverage: Target 80%+ (currently ~60%)
- Issue response time: <24 hours
- Zero critical security issues
- Stable API (no breaking changes in minor versions)

### Performance
- Message latency: <1s p95 (OAuth mode)
- Message latency: <3s p95 (web proxy mode)
- Memory usage: <100MB baseline
- CPU usage: <20% during load test

### Operational
- Uptime: 99%+ (in Docker)
- Deployment time: <5 minutes
- Recovery time: <1 minute after failure

## Breaking Changes Policy

- Semantic versioning strictly followed
- Breaking changes only in major versions
- Deprecation period: 1 month notice before removal
- Migration guides provided

## Documentation Roadmap

- [x] README (this quarter)
- [x] Codebase structure documentation
- [x] Code standards guide
- [x] System architecture
- [x] Deployment guide
- [ ] API reference (next quarter)
- [ ] Advanced configuration guide (next quarter)
- [ ] Performance tuning guide (next quarter)
- [ ] Troubleshooting guide (next quarter)

## Testing Roadmap

- [x] Manual testing (core features)
- [ ] Unit tests: 80% coverage (Phase 3)
- [ ] Integration tests: API endpoints (Phase 3)
- [ ] E2E tests: Critical flows (Phase 3)
- [ ] Performance tests: Load testing (Phase 4)
- [ ] Security tests: Penetration testing (Phase 4)

## Infrastructure Roadmap

- [x] GitHub Actions CI/CD
- [x] Docker multi-platform build
- [x] PyPI publishing
- [ ] HuggingFace Spaces deploy (current)
- [ ] Kubernetes Helm chart (Phase 4)
- [ ] Terraform AWS module (Phase 4)

## Known Issues & Limitations

### Current Issues
1. **No database**: Accounts stored as JSON (scales to ~1000 accounts)
2. **Single process**: One Uvicorn worker (consider Gunicorn for scaling)
3. **In-memory cache**: Lost on restart
4. **No audit logging**: Admin actions not tracked
5. **Limited metrics**: No Prometheus integration

### Planned Fixes
- Phase 3: Audit logging, improved monitoring
- Phase 4: Database integration, multi-worker
- Phase 5: Advanced observability

### Workarounds (Until Fixed)
- Backup `accounts.json` daily
- Run behind nginx with backup instance
- Monitor logs manually
- Use rate limiting middleware (external)

## Contributing Opportunities

Looking for help with:

1. **Testing** — Write unit/integration tests
2. **Documentation** — API docs, tutorials, FAQs
3. **Features** — WebSocket support, rate limiting
4. **Localization** — Translate to more languages
5. **DevOps** — Helm charts, Terraform modules
6. **Community** — Blog posts, demos, videos

## Support & Feedback

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: orange@freesia.ink
- **Twitter**: @mirrorange

## Acknowledgments

Special thanks to:
- Anthropic Claude team for the API
- Clewd/ClewdR projects for initial reference
- Community contributors and users
- Open source libraries (FastAPI, React, etc.)

---

**Last Updated**: February 24, 2026
**Maintained By**: mirrorange <orange@freesia.ink>
