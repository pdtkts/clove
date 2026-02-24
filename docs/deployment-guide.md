# Deployment Guide

## Quick Start

### Local Development
```bash
# Install Python 3.11+
python --version

# Install Clove with optional dependencies
pip install "clove-proxy[rnet]"

# Run
clove
# Opens at http://localhost:5201
```

### Docker Compose (Recommended)
```bash
# Clone and build
git clone https://github.com/mirrorange/clove.git
cd clove

# Run
docker-compose up -d

# Access at http://localhost:5201
# Data persists in ./data directory
```

## Installation Methods

### 1. PyPI Package

**With rnet** (recommended, better performance)
```bash
pip install "clove-proxy[rnet]"
```

**With curl_cffi**
```bash
pip install "clove-proxy[curl]"
```

**Minimal** (OAuth only, no web proxy)
```bash
pip install clove-proxy
```

**From source**
```bash
git clone https://github.com/mirrorange/clove.git
cd clove
pip install -e ".[rnet]"
```

### 2. Docker Container

**Build locally**
```bash
docker build -t clove:latest .
```

**Run standalone**
```bash
docker run -d \
  --name clove \
  -p 5201:5201 \
  -v clove-data:/data \
  clove:latest
```

**With environment file**
```bash
docker run -d \
  --name clove \
  -p 5201:5201 \
  -v clove-data:/data \
  --env-file .env \
  clove:latest
```

### 3. Docker Compose

**Basic setup** (docker-compose.yml)
```yaml
version: "3.8"

services:
  clove:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: clove
    restart: unless-stopped
    ports:
      - "5201:5201"
    volumes:
      - ./data:/data
    environment:
      - HOST=0.0.0.0
      - PORT=5201
      - DATA_FOLDER=/data
      - LOG_LEVEL=INFO
```

**With configuration**
```yaml
version: "3.8"

services:
  clove:
    build: .
    container_name: clove
    restart: unless-stopped
    ports:
      - "5201:5201"
    volumes:
      - clove-data:/data
    environment:
      # Server
      - HOST=0.0.0.0
      - PORT=5201
      - DATA_FOLDER=/data

      # Admin & API keys
      - ADMIN_API_KEYS=your-secret-key
      - API_KEYS=key1,key2

      # Claude authentication
      - COOKIES=sessionKey=your-cookie-here

      # Logging
      - LOG_LEVEL=INFO
      - LOG_TO_FILE=true
      - LOG_FILE_PATH=/data/logs/app.log

      # Request handling
      - REQUEST_TIMEOUT=60
      - REQUEST_RETRIES=3

volumes:
  clove-data:
    driver: local
```

**Start/stop**
```bash
# Start
docker-compose up -d

# View logs
docker-compose logs -f clove

# Stop
docker-compose down

# Restart
docker-compose restart clove
```

## Configuration

### Environment Variables

**Server Settings**
```bash
HOST=0.0.0.0              # Bind address
PORT=5201                 # Server port
```

**Data Paths**
```bash
DATA_FOLDER=~/.clove/data           # Account storage
LOCALES_FOLDER=/app/locales          # i18n files
STATIC_FOLDER=/app/static            # Frontend files
```

**Authentication**
```bash
ADMIN_API_KEYS=key1,key2,key3       # Comma-separated admin keys
API_KEYS=api-key-1,api-key-2         # Comma-separated client keys
```

**Claude Access**
```bash
COOKIES=cookie1,cookie2              # Claude.ai session cookies
CLAUDE_AI_URL=https://claude.ai      # Claude.ai base URL
CLAUDE_API_BASEURL=https://api.anthropic.com  # Claude API base
```

**Request Handling**
```bash
REQUEST_TIMEOUT=60                   # Request timeout (seconds)
REQUEST_RETRIES=3                    # Retry attempts
REQUEST_RETRY_INTERVAL=1             # Delay between retries
PROXY_URL=http://proxy:8080          # HTTP/HTTPS proxy
```

**OAuth Settings**
```bash
OAUTH_CLIENT_ID=9d1c250a-...         # OAuth client ID
OAUTH_AUTHORIZE_URL=https://claude.ai/v1/oauth/{organization_uuid}/authorize
OAUTH_TOKEN_URL=https://console.anthropic.com/v1/oauth/token
OAUTH_REDIRECT_URI=https://console.anthropic.com/oauth/code/callback
```

**Session Management**
```bash
SESSION_TIMEOUT=300                  # Idle timeout (seconds)
SESSION_CLEANUP_INTERVAL=30          # Cleanup frequency
MAX_SESSIONS_PER_COOKIE=3            # Max concurrent sessions
```

**Logging**
```bash
LOG_LEVEL=INFO                       # DEBUG, INFO, WARNING, ERROR
LOG_TO_FILE=true                     # Enable file logging
LOG_FILE_PATH=logs/app.log           # Log file location
LOG_FILE_ROTATION=10 MB              # Rotation policy
LOG_FILE_RETENTION=7 days            # Retention period
```

**Language**
```bash
DEFAULT_LANGUAGE=en                  # en, zh
```

### Configuration Methods

**1. Environment Variables**
```bash
export ADMIN_API_KEYS=secret123
export COOKIES=sessionKey=abc123
clove
```

**2. .env File**
```bash
# Copy template
cp .env.example .env

# Edit configuration
nano .env

# Run
clove
```

**3. Docker Compose**
Edit `docker-compose.yml` environment section.

**4. Command Line** (PyPI installation)
No direct CLI args; use environment variables.

## Initial Setup

### Step 1: Launch Application
```bash
# PyPI
clove
# or
# Docker Compose
docker-compose up -d
```

### Step 2: Get Admin Key
Console output shows temporary admin key:
```
INFO: Starting Clove...
INFO: Temporary admin key: clv_xxx_xxxxxxxxxx
```

### Step 3: Access Admin Panel
Open browser: http://localhost:5201

### Step 4: Configure
1. **Login**: Enter temporary admin key
2. **Add Claude Account**:
   - Option A: OAuth (recommended)
   - Option B: Web proxy (paste Claude.ai cookie)
3. **Create API Keys**: Generate client API keys for applications
4. **Set Admin Key**: Change password via Settings

### Step 5: Test
```python
import anthropic

client = anthropic.Anthropic(
    base_url="http://localhost:5201",
    api_key="your-api-key"
)

response = client.messages.create(
    model="claude-opus-4-20250514",
    messages=[{"role": "user", "content": "Hello!"}],
    max_tokens=100
)

print(response.content[0].text)
```

## Persistence

### Data Storage

**Accounts**
- Location: `{DATA_FOLDER}/accounts.json`
- Format: JSON with OAuth tokens, cookies, settings
- Loaded on startup, saved on shutdown

**Sessions** (Web Proxy)
- Storage: In-memory
- Persistence: No (recreated per request)
- Timeout: 300s (configurable)

**Cache**
- Storage: In-memory
- Persistence: No
- TTL: Configurable per entry

### Backup & Recovery

**Backup Accounts**
```bash
# Copy accounts file
cp ~/.clove/data/accounts.json ~/.clove/data/accounts.json.backup

# Or with Docker
docker cp clove:/data/accounts.json ./backup/
```

**Restore Accounts**
```bash
# Replace accounts file
cp ~/.clove/data/accounts.json.backup ~/.clove/data/accounts.json

# Restart application
clove
# or
docker-compose restart clove
```

## Production Deployment

### Reverse Proxy (Nginx)

**Configuration**
```nginx
server {
    listen 80;
    server_name clove.example.com;

    location / {
        proxy_pass http://localhost:5201;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL/TLS with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d clove.example.com

# Update Nginx config
server {
    listen 443 ssl;
    server_name clove.example.com;

    ssl_certificate /etc/letsencrypt/live/clove.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/clove.example.com/privkey.pem;

    # ... rest of config
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name clove.example.com;
    return 301 https://$server_name$request_uri;
}
```

### Systemd Service

**Create service file** `/etc/systemd/system/clove.service`
```ini
[Unit]
Description=Clove Claude Reverse Proxy
After=network.target

[Service]
Type=simple
User=clove
WorkingDirectory=/opt/clove
EnvironmentFile=/opt/clove/.env
ExecStart=/usr/local/bin/clove
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Enable and start**
```bash
sudo systemctl daemon-reload
sudo systemctl enable clove
sudo systemctl start clove

# Check status
sudo systemctl status clove

# View logs
sudo journalctl -u clove -f
```

### Docker on VPS

**Setup**
```bash
# SSH to VPS
ssh user@your-vps

# Create app directory
mkdir -p /opt/clove
cd /opt/clove

# Download docker-compose.yml
wget https://raw.githubusercontent.com/mirrorange/clove/main/docker-compose.yml

# Create .env with production settings
cat > .env << 'EOF'
ADMIN_API_KEYS=your-secure-key
COOKIES=your-claude-cookie
LOG_LEVEL=WARNING
EOF

# Start
docker-compose up -d

# Check logs
docker-compose logs -f clove
```

## Monitoring

### Health Check

**Endpoint**
```bash
curl http://localhost:5201/health
# Response: {"status": "healthy"}
```

**Docker Health Check**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5201/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 10s
```

### Logs

**PyPI/Direct**
```bash
# View logs (if enabled)
tail -f logs/app.log

# Adjust log level
export LOG_LEVEL=DEBUG
clove
```

**Docker**
```bash
# View logs
docker-compose logs -f clove

# Specific time range
docker-compose logs --timestamps --since 2024-02-20

# Save logs
docker-compose logs > logs.txt
```

### Metrics

**Statistics Endpoint**
```bash
curl -H "Authorization: Bearer {ADMIN_KEY}" \
  http://localhost:5201/api/admin/statistics
```

**Output Example**
```json
{
  "total_accounts": 2,
  "valid_accounts": 2,
  "oauth_accounts": 1,
  "web_proxy_accounts": 1,
  "total_requests": 150,
  "total_tokens": 45000
}
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 5201
lsof -i :5201

# Kill process
kill -9 <PID>

# Or use different port
PORT=5202 clove
```

### Authentication Failures

**Issue**: Admin key doesn't work

**Solution**:
```bash
# Regenerate accounts.json
rm ~/.clove/data/accounts.json
clove
# New temporary key generated
```

### OAuth Not Working

**Issue**: "OAuth exchange failed"

**Check**:
1. Claude.ai cookie valid (test on claude.ai)
2. Organization UUID correct
3. OAuth client ID matches Claude Code

**Solution**:
```bash
# Manually set OAuth credentials
OAUTH_CLIENT_ID=9d1c250a-... \
OAUTH_AUTHORIZE_URL=... \
clove
```

### Web Proxy Connection Timeout

**Issue**: Claude.ai requests timeout

**Solutions**:
1. Increase timeout: `REQUEST_TIMEOUT=120`
2. Check proxy settings: `PROXY_URL=...`
3. Verify Claude.ai cookie: `curl -b "sessionKey=..." https://claude.ai`

### Docker Volume Permissions

**Issue**: Permission denied on /data

**Solution**:
```bash
# Fix ownership
sudo chown -R 1000:1000 ./data

# Or use different mount
docker run -v /tmp/clove:/data clove:latest
```

## Updating

### PyPI Package

```bash
# Check current version
pip show clove-proxy

# Update
pip install --upgrade clove-proxy

# Run new version
clove
```

### Docker Container

```bash
# Pull latest
docker pull mirrorange/clove:latest

# Rebuild
docker-compose build --pull

# Restart
docker-compose up -d
```

### From Source

```bash
cd clove
git pull origin main
pip install -e ".[rnet]"
clove
```

## Uninstallation

### PyPI

```bash
pip uninstall clove-proxy
```

### Docker

```bash
# Stop container
docker-compose down

# Remove image
docker rmi clove:latest

# Remove volumes (careful!)
docker volume rm clove_clove-data
```

### System Files

```bash
# Remove data directory
rm -rf ~/.clove/data

# Remove logs
rm -rf logs/
```

## Migration Guide

### From Clewd to Clove

1. **Export Clewd cookies**
   - Get cookies from Clewd config/browser

2. **Import to Clove**
   - Add accounts via admin panel (Accounts → New Account → Web Proxy)
   - Paste Claude.ai cookie

3. **Update client configuration**
   - Change base_url to Clove endpoint
   - Use API_KEY from Clove admin panel

4. **Test**
   ```bash
   # Original Clewd
   # curl -X POST http://clewd:8000/v1/messages ...

   # New Clove
   # curl -X POST http://clove:5201/v1/messages ...
   ```

### Multiple Instance Setup

**Use case**: Load balancing, isolation

```bash
# Instance 1 (port 5201)
docker-compose up -d

# Instance 2 (port 5202)
PORT=5202 docker-compose up -d

# Nginx upstream
upstream clove_backend {
    server localhost:5201;
    server localhost:5202;
}

# Use in location block
location / {
    proxy_pass http://clove_backend;
}
```

## Performance Tuning

### Request Timeout

- **Web proxy**: 120-300s (longer for complex requests)
- **OAuth**: 30-60s (typically faster)

```bash
export REQUEST_TIMEOUT=120
```

### Retry Strategy

```bash
export REQUEST_RETRIES=3
export REQUEST_RETRY_INTERVAL=1
```

### Connection Pool Size

For `rnet` (configured internally, ~100 connections).

### Logging Level

```bash
# Production: WARNING (minimal overhead)
export LOG_LEVEL=WARNING

# Debug: DEBUG (high overhead)
export LOG_LEVEL=DEBUG
```

## Security Hardening

### Admin Key

- Use strong random key: `python -c "import secrets; print(secrets.token_hex(32))"`
- Store in `.env`, not in git
- Rotate periodically

### API Keys

- Generate unique keys per application
- Use short-lived keys (rotate monthly)
- Monitor key usage via statistics

### Network

- Run behind reverse proxy with authentication
- Use HTTPS in production
- Restrict admin endpoints via firewall

### Secrets

Never commit to git:
```bash
# .gitignore
.env
.env.local
accounts.json
logs/
```

## Backup Strategy

**Daily backup**
```bash
#!/bin/bash
BACKUP_DIR="/backups/clove"
mkdir -p $BACKUP_DIR
cp ~/.clove/data/accounts.json $BACKUP_DIR/accounts-$(date +%Y%m%d).json
# Keep last 30 days
find $BACKUP_DIR -mtime +30 -delete
```

**Cloud backup**
```bash
# Sync to S3
aws s3 sync ~/.clove/data/ s3://my-bucket/clove-backup/
```
