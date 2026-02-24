# Code Standards & Conventions

## Overview

Clove codebase follows pragmatic coding standards prioritizing readability, maintainability, and performance. This guide documents conventions observed throughout the project.

## Python Backend Standards

### File Organization

**Module Structure**
- Keep modules under 400 LOC when possible
- Group related functionality together
- Use meaningful module names (e.g., `account_manager.py` not `mgr.py`)

**Import Order**
```python
# 1. Standard library
import json
from pathlib import Path

# 2. Third-party
from fastapi import FastAPI
from pydantic import BaseModel

# 3. Local application
from app.core.config import settings
from app.services.account import account_manager
```

**Module Template**
```python
"""Module description - one line summary."""

from typing import Optional
from loguru import logger

# Public API
__all__ = ["PublicClass", "public_function"]


class PublicClass:
    """Class description."""
    pass


def public_function() -> str:
    """Function description."""
    pass
```

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Packages | lowercase | `app.services` |
| Modules | snake_case | `account_manager.py` |
| Classes | PascalCase | `AccountManager`, `ClaudeSession` |
| Functions | snake_case | `get_account`, `process_message` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_TIMEOUT`, `MAX_RETRIES` |
| Private | leading underscore | `_internal_method` |
| Protected | single underscore | `_protected_attr` |
| Booleans | is_/has_/can_ prefix | `is_authenticated`, `has_quota` |

### Type Hints

**Required**
- All function parameters
- All function return types
- Class attributes (with type annotation)

**Examples**
```python
from typing import Optional, List
from app.models import Account

def get_account(account_id: str) -> Optional[Account]:
    """Get account by ID."""
    pass

def load_accounts() -> List[Account]:
    """Load all accounts."""
    pass

async def process_message(
    content: str,
    model: str,
    timeout: int = 60
) -> dict:
    """Process message with timeout."""
    pass
```

### Docstrings

**Style**: Google-style docstrings

```python
def calculate_tokens(text: str, model: str) -> int:
    """Calculate token count for text.

    Args:
        text: The text to count tokens for.
        model: Claude model name (e.g., 'claude-opus').

    Returns:
        Token count as integer.

    Raises:
        ValueError: If model not supported.

    Example:
        >>> calculate_tokens("Hello", "claude-opus")
        2
    """
    pass
```

**Requirements**
- One-line summary
- Detailed description (if needed)
- Args section
- Returns section
- Raises section (if applicable)
- Example section (for complex functions)

### Error Handling

**Exception Hierarchy** (in app/core/exceptions.py)
```python
class AppError(Exception):
    """Base application error."""
    pass

class AuthenticationError(AppError):
    """Authentication failed."""
    pass

class ConfigurationError(AppError):
    """Invalid configuration."""
    pass

class ExternalServiceError(AppError):
    """External service unavailable."""
    pass
```

**Usage Pattern**
```python
try:
    response = await http_client.get(url, timeout=30)
except httpx.TimeoutException as e:
    logger.error(f"Request timeout: {e}")
    raise ExternalServiceError("Claude.ai request timeout") from e
except httpx.HTTPError as e:
    logger.error(f"HTTP error: {e}")
    raise ExternalServiceError(f"HTTP {e.response.status_code}") from e
```

### Logging

**Tool**: loguru

**Level Usage**
```python
logger.debug("Detailed flow information")      # Dev debugging
logger.info("Important state changes")          # Normal operation
logger.warning("Degraded but functional")       # Config issues, fallbacks
logger.error("Failure that affects users")      # OAuth failure, timeout
logger.critical("System failure")                # Database down, app crash
```

**Format Convention**
```python
logger.info(f"Processing message for account {account_id}")
logger.error(f"Failed to authenticate account {account_id}: {error}")
logger.debug(f"Response status: {response.status_code}, size: {len(response.content)}")
```

### Async/Await

**Requirements**
- All I/O operations must be async
- Avoid blocking calls in async functions
- Use `await` for async calls
- Use `asyncio.gather()` for concurrent operations

**Pattern**
```python
async def process_accounts() -> List[Account]:
    """Process multiple accounts concurrently."""
    tasks = [
        process_account(account_id)
        for account_id in account_ids
    ]
    return await asyncio.gather(*tasks)
```

### Pydantic Models

**Structure**
```python
from pydantic import BaseModel, Field

class AccountCreate(BaseModel):
    """Account creation request."""

    cookie_value: str = Field(..., description="Claude.ai session cookie")
    name: Optional[str] = Field(None, description="Account display name")

    class Config:
        json_schema_extra = {
            "example": {
                "cookie_value": "sessionKey=...",
                "name": "Production Account"
            }
        }
```

**Validation**
```python
from pydantic import BaseModel, field_validator

class Settings(BaseModel):
    port: int = 5201

    @field_validator("port")
    @classmethod
    def validate_port(cls, v: int) -> int:
        if not 1 <= v <= 65535:
            raise ValueError("Port must be 1-65535")
        return v
```

### Testing (When Present)

**File Naming**
- `test_*.py` or `*_test.py`
- Located in same directory as module

**Pattern**
```python
import pytest
from app.services.account import AccountManager

@pytest.fixture
async def account_manager():
    """Account manager fixture."""
    manager = AccountManager()
    await manager.initialize()
    yield manager
    await manager.cleanup()

@pytest.mark.asyncio
async def test_add_account(account_manager):
    """Test adding account."""
    account = await account_manager.add_account(cookie="test")
    assert account is not None
```

## TypeScript/React Frontend Standards

### File Organization

**Component Structure**
```
components/
├── AccountModal.tsx          # Component + related logic
├── ui/                       # Shadcn UI components
│   ├── button.tsx
│   ├── dialog.tsx
│   └── sidebar.tsx
└── hooks/                    # Custom hooks
    └── useIsMobile.tsx
```

**File Size**
- Components: 200-400 lines
- Split larger components into sub-components

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `AccountModal`, `Dashboard` |
| Hooks | camelCase, use prefix | `useIsMobile`, `useAuth` |
| Utils | camelCase | `formatDate`, `parseError` |
| Types | PascalCase | `Account`, `ApiResponse` |
| Constants | UPPER_SNAKE_CASE | `MAX_ACCOUNTS`, `DEFAULT_TIMEOUT` |
| CSS classes | kebab-case (Tailwind) | `flex`, `gap-4`, `text-center` |

### React Patterns

**Functional Components**
```typescript
interface AccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (account: Account) => Promise<void>
}

export function AccountModal({
  isOpen,
  onClose,
  onSave
}: AccountModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: AccountFormData) => {
    setIsLoading(true)
    try {
      await onSave(data as Account)
      onClose()
    } catch (error) {
      // Error handling
    } finally {
      setIsLoading(false)
    }
  }

  return <Dialog open={isOpen} onOpenChange={onClose}>
    {/* Content */}
  </Dialog>
}
```

**Custom Hooks**
```typescript
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [breakpoint])

  return isMobile
}
```

### TypeScript Standards

**Type Definitions**
```typescript
// ✅ GOOD: Specific types
interface Account {
  id: string
  name: string
  status: "active" | "disabled"
  quotaRemaining: number
}

// ❌ AVOID: any type
let account: any

// ❌ AVOID: implicit any
function processAccount(account) {}

// ✅ GOOD: Explicit types
function processAccount(account: Account): Promise<void> {}
```

**Union Types**
```typescript
type AuthMethod = "oauth" | "web"
type RequestStatus = "pending" | "success" | "error"

const status: RequestStatus = "success" // ✅ Good
const method: AuthMethod = "invalid"    // ❌ Error: not in union
```

### API Integration

**Axios Configuration** (lib/api.ts)
```typescript
import axios from "axios"

const api = axios.create({
  baseURL: "/api",
  timeout: 30000
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminKey")
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle auth error
    }
    return Promise.reject(error)
  }
)

export default api
```

**API Call Pattern**
```typescript
export async function getAccounts(): Promise<Account[]> {
  try {
    const response = await api.get<Account[]>("/accounts")
    return response.data
  } catch (error) {
    logger.error("Failed to fetch accounts:", error)
    throw new Error("Failed to load accounts")
  }
}
```

### Styling

**Tailwind CSS**
- Use utility classes over custom CSS
- Responsive design: mobile-first
- Colors from config: `bg-blue-500`, `text-gray-700`

```typescript
return (
  <div className="flex flex-col gap-4 p-4 md:flex-row md:p-8">
    <div className="flex-1">
      <h1 className="text-2xl font-bold text-gray-900">Title</h1>
    </div>
  </div>
)
```

**Shadcn UI**
- Import from `@/components/ui`
- Use as-is without modification
- Compose with Tailwind for customization

### i18n Integration

**Translation Keys** (locales/en.json)
```json
{
  "nav.accounts": "Accounts",
  "nav.settings": "Settings",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "account.create": "Create Account"
}
```

**Usage in Components**
```typescript
import { useTranslation } from "react-i18next"

export function AccountModal() {
  const { t } = useTranslation()

  return <Button>{t("common.save")}</Button>
}
```

## Git & Commit Standards

### Branch Naming

```
main                    # Production branch
feat/                   # New features
fix/                    # Bug fixes
refactor/              # Code refactoring
docs/                  # Documentation
```

### Commit Messages

**Format**: Conventional Commits

```
<type>: <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`

**Examples**
```
feat: add OAuth account authentication

Implements OAuth token exchange for Claude API access.
Adds automatic token refresh and fallback to web proxy.

Closes #42
```

```
fix: handle session timeout in web proxy

Previously failed on long-running requests.
Now automatically refreshes connection.
```

## Configuration Standards

### Environment Variables (app/core/config.py)

**Naming**: UPPER_SNAKE_CASE, prefixed logically

```
# Server
HOST=0.0.0.0
PORT=5201

# Data
DATA_FOLDER=~/.clove/data

# Auth
ADMIN_API_KEYS=key1,key2
API_KEYS=key1,key2

# Claude
COOKIES=session1,session2
CLAUDE_AI_URL=https://claude.ai
```

### Frontend Environment (.env)

```
VITE_API_BASE_URL=http://localhost:5201
VITE_APP_NAME=Clove
```

Used as: `import.meta.env.VITE_API_BASE_URL`

## Documentation Standards

### README Sections
1. Project name and badges
2. Quick start (3-4 steps)
3. Core features
4. Limitations
5. Configuration
6. API examples
7. Contributing
8. License

### Code Comments

**When to Comment**
- Complex algorithms (explain why, not what)
- Non-obvious design decisions
- Edge cases and workarounds

**When Not to Comment**
- Obvious code: `x = x + 1`
- Self-documenting: good function names
- Replaced by docstrings

**Good Comments**
```python
# Retry failed requests with exponential backoff.
# Start with 1s, double each attempt (1s, 2s, 4s, 8s)
for attempt in range(max_retries):
    try:
        return await make_request()
    except RequestError:
        if attempt < max_retries - 1:
            delay = 2 ** attempt
            await asyncio.sleep(delay)
```

## Code Review Checklist

- [ ] Follows naming conventions
- [ ] Type hints present (Python/TypeScript)
- [ ] Docstrings for public APIs
- [ ] Error handling comprehensive
- [ ] No hardcoded secrets or URLs
- [ ] Logging at appropriate levels
- [ ] Async operations use await
- [ ] Tests present (if applicable)
- [ ] No dead code or console.log
- [ ] Performance acceptable

## Performance Guidelines

### Python
- Use async for I/O
- Connection pooling for HTTP
- Streaming responses (no buffer all)
- Efficient string formatting (f-strings)

### TypeScript/React
- Code splitting at route level
- Lazy load modals and complex components
- Memoize expensive computations
- Debounce input handlers
- Unsubscribe from observables

## Security Checklist

- [ ] No hardcoded API keys
- [ ] Input validation (Pydantic)
- [ ] Output escaping (React, HTML)
- [ ] Auth headers on protected routes
- [ ] CORS properly configured
- [ ] Environment variables for secrets
- [ ] Error messages don't leak info
- [ ] SQL injection protection (N/A, no DB)
- [ ] CSRF protection (if needed)
