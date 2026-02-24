# Clove 🍀

<div align="center">

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green.svg)](https://fastapi.tiangolo.com)

**The all-in-one Claude reverse proxy ✨**

[English](#) | [简体中文](./README_zh.md)

</div>

## 🌟 What is this?

Clove is a reverse proxy that lets you access Claude.ai through a standard Claude API interface. It bridges Claude.ai and various AI applications, making them compatible with Claude API clients.

**Key highlight**: Clove is the first reverse proxy supporting OAuth authentication for Claude's official API (the same method Claude Code uses). This means full access to Claude API features, including native system messages and prefilling.

## 🚀 Quick Start

### 1. Install Python

Ensure you have Python 3.11 or higher:

```bash
python --version  # Should be 3.11+
```

### 2. Install Clove

```bash
pip install "clove-proxy[rnet]"
```

### 3. Launch

```bash
clove
```

You'll see a randomly generated temporary admin key in the console. Save it—you'll need it to log in.

### 4. Configure Accounts

Open http://localhost:5201 in your browser. Log in with the admin key, then add your Claude accounts.

## ✨ Core Features

### 🔐 Dual Authentication Modes

- **OAuth Mode** (Preferred): Direct access to Claude API. Full feature support, better performance.
- **Web Proxy Mode**: Emulates Claude.ai web interface. Automatic fallback when OAuth unavailable.

### 🌐 i18n Support

- **Frontend**: English and Simplified Chinese UI
- **Automatic language detection**: Uses browser locale
- **Persistent settings**: Language choice saved in localStorage

### 🎯 Outstanding Compatibility

- ✅ SillyTavern
- ✅ Most Claude API-compatible applications
- ✅ Claude Code itself
- ✅ Anthropic SDK clients

### 🛠️ Enhanced Features

**OAuth Mode:**
- Full Claude API feature access
- Native system messages
- Prefilling support
- Prompt caching affinity
- Better performance and stability

**Web Proxy Mode:**
- Image upload support
- Extended thinking (chain-of-thought)
- Function calling (through adaptation)
- Stop sequences (through adaptation)
- Token counting (estimated)
- Non-streaming responses

### 🎨 Modern Admin Interface

- Clean, intuitive web dashboard
- Account management (add/edit/delete)
- OAuth setup and authentication
- API key management
- System statistics and monitoring
- Responsive design (desktop and mobile)

### 🔄 Intelligent Features

- **Automatic OAuth**: Complete authentication via cookies—no manual Claude Code login needed
- **Smart Switching**: Auto-switches between OAuth and web proxy based on account availability
- **Quota Management**: Tracks usage, auto-restores on quota reset
- **Load Balancing**: Distributes requests across multiple accounts
- **Session Management**: Maintains persistent cookie sessions

## ⚠️ Limitations

### Android Termux Users

Clove depends on `curl_cffi` for Claude.ai requests, which doesn't work on Termux.

**Options:**
- Use without curl_cffi: `pip install clove-proxy` (OAuth only, no web proxy)
- Use a reverse proxy mirror (e.g., fuclaude)

### Parallel Tool Calls

Avoid applications that execute many parallel tool calls in web proxy mode. Clove maintains Claude.ai connections while waiting for results—too many parallel calls will exhaust connections.

OAuth mode is not affected.

### Prompt Structure

When using web proxy, Claude.ai adds extra system prompts and file structures. Prompts with strict structural requirements (e.g., roleplay presets) may behave differently:

- Free accounts: Web proxy only
- Pro accounts: Sonnet via API, Opus via web proxy
- Max accounts: API for all models
- Choose prompts compatible with your request method

## 🔧 Advanced Configuration

### Environment Variables

Most settings are configurable in the admin panel. For advanced setup:

```bash
# Server
PORT=5201
HOST=0.0.0.0

# Admin authentication
ADMIN_API_KEYS=your-secret-key

# Claude.ai cookies
COOKIES=sessionKey=your-session-key

# Proxy
PROXY_URL=http://proxy.example.com:8080

# Logging
LOG_LEVEL=INFO
LOG_TO_FILE=true
LOG_FILE_PATH=./logs/app.log
```

See `.env.example` for complete options.

### API Usage Example

Once set up, use like standard Claude API:

```python
import anthropic

client = anthropic.Anthropic(
    base_url="http://localhost:5201",
    api_key="your-api-key"  # Create in admin panel
)

response = client.messages.create(
    model="claude-opus-4-20250514",
    messages=[{"role": "user", "content": "Hello Claude!"}],
    max_tokens=1024,
)

print(response.content[0].text)
```

## 🐳 Docker Deployment

### Using docker-compose (Recommended)

```bash
docker-compose up -d
```

This starts Clove with persistent data storage. Configure via environment variables in `docker-compose.yml`.

### Manual Docker

```bash
docker build -t clove:latest .
docker run -d --name clove \
  -p 5201:5201 \
  -v clove-data:/data \
  clove:latest
```

### Environment Setup

Set these in `docker-compose.yml` or via `-e`:

```yaml
environment:
  - ADMIN_API_KEYS=your-admin-key
  - COOKIES=your-claude-cookie
  - LOG_TO_FILE=true
  - LOG_FILE_PATH=/data/logs/app.log
```

## 📦 PyPI Installation

```bash
# With rnet support (recommended)
pip install "clove-proxy[rnet]"

# With curl_cffi support
pip install "clove-proxy[curl]"

# Minimal (OAuth only, no web proxy)
pip install clove-proxy
```

## 🤝 Contributing

Contributions welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/YourFeature`
3. Commit changes: `git commit -m 'Add YourFeature'`
4. Push to branch: `git push origin feature/YourFeature`
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

## 🙏 Acknowledgments

- [Anthropic Claude](https://www.anthropic.com/claude) - The AI powering this project
- [Clewd](https://github.com/teralomaniac/clewd/) - Original Claude.ai reverse proxy
- [ClewdR](https://github.com/Xerxes-2/clewdr) - High-performance reverse proxy reference
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://reactjs.org/) - Frontend library
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS
- [Shadcn UI](https://ui.shadcn.com/) - Modern UI components
- [Vite](https://vitejs.dev/) - Fast frontend build tool

## ⚠️ Disclaimer

This project is for learning and research purposes only. Comply with service terms when using. The author is not responsible for misuse or violations.

## 📮 Contact

Issues, PRs, or email: orange@freesia.ink

## 🌸 About Clove

Clove is a spice from the Myrtaceae family, used in cooking and medicine. The project name blends "Claude" and "love"—capturing the spirit of this Claude API bridge.

---

<div align="center">
Made with ❤️ by 🍊
</div>
