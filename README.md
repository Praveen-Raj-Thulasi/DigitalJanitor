# 🧹 Digital Janitor

> **Your mess. Our mission. Zero digital drama.**

A local-first, privacy-respecting AI file cleanup assistant. Scan folders, detect duplicates, get AI-powered rename & organization suggestions, review everything, then apply approved changes — all without your files ever leaving your machine.

Built for the **Open-Source AI Challenge · Slow and Steady** theme.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Clutter Radar** | Deep folder scanning with file type detection, size analysis, and clutter scoring |
| 🤖 **AI Sorting Brain** | Local Ollama integration for filename suggestions and folder organization |
| ✅ **Safe Cleanup** | Every action requires explicit approval before execution — no auto-delete |
| 🔒 **Local-First Privacy** | File contents stay in your browser; only metadata goes to MongoDB |
| 🕵️ **Duplicate Detective** | SHA-256 hash-based exact duplicate detection with space savings calculation |
| 📊 **Live Dashboard** | Real metrics from actual scan data — no hardcoded statistics |
| 🏆 **Achievements** | Gamified cleanup milestones based on real completed actions |

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, React Router v6, Framer Motion, Recharts, Lucide React, Sonner
- **Backend**: Node.js, Express.js (ESM), Mongoose, JWT, bcryptjs
- **Database**: MongoDB 8+
- **AI**: Ollama (local open-weight models — no paid API required)
- **File Operations**: File System Access API (browser-native)

---

## 📋 Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- [Ollama](https://ollama.ai) (optional — app works without AI)

---

## 🚀 Quick Start

### 1. Clone & install

```bash
git clone <your-repo-url>
cd digital-janitor
npm run install:all
```

### 2. Configure environment

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env — set JWT_SECRET, MONGODB_URI

# Client
cp client/.env.example client/.env
# VITE_API_URL defaults to http://localhost:5001/api
```

### 3. Start MongoDB

```bash
# Local MongoDB
mongod --dbpath /var/lib/mongodb

# Or use MongoDB Atlas URI in server/.env
```

### 4. (Optional) Start Ollama

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start the service
ollama serve

# Pull a model
ollama pull llama3.2
```

### 5. Run the app

```bash
# Both server and client (requires concurrently)
npm install && npm run dev

# Or individually
npm run dev:server   # → http://localhost:5001
npm run dev:client   # → http://localhost:5173
```

---

## 🗂 Project Structure

```
digital-janitor/
├── client/              React + Vite frontend
│   └── src/
│       ├── components/  Reusable UI components
│       ├── context/     Auth & Theme contexts
│       ├── layouts/     AppLayout wrapper
│       ├── pages/       All page components
│       ├── services/    Axios API client
│       ├── styles/      Global CSS design system
│       └── utils/       Filesystem utilities (browser-only)
└── server/              Node.js + Express backend
    └── src/
        ├── config/      Database connection
        ├── controllers/ Route handlers
        ├── middleware/   Auth, error handling
        ├── models/      Mongoose schemas
        └── routes/      Express routers
```

---

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET  | `/api/auth/me` | Get current user |
| GET  | `/api/scans` | List scans |
| POST | `/api/scans` | Save scan results |
| GET  | `/api/scans/stats` | Dashboard statistics |
| GET  | `/api/cleanup-plans` | List plans |
| POST | `/api/cleanup-plans` | Create plan |
| PATCH| `/api/cleanup-plans/:id` | Approve/reject/execute actions |
| GET  | `/api/activity` | Activity feed |
| GET  | `/api/ai/status` | Ollama status |
| POST | `/api/ai/analyze` | AI filename suggestions |
| POST | `/api/ai/suggest-organization` | AI folder suggestions |
| GET  | `/api/settings` | Get preferences |
| PATCH| `/api/settings` | Update preferences |

---

## 🔒 Privacy & Security

### What stays on your machine
- File contents — never uploaded
- Directory handles — browser memory only
- Actual file operations — executed in the browser via File System Access API

### What's stored in MongoDB
- File metadata: names, sizes, paths, SHA-256 hashes
- Scan summaries and clutter scores
- Cleanup plans and action approval status
- Activity logs (what you approved/rejected)

### Security measures
- Passwords hashed with bcrypt (12 rounds)
- JWT authentication (7-day expiry)
- Rate limiting on auth and AI endpoints
- Server never derives userId from request body
- AI output validated before saving
- Strict action type allowlist (no shell commands)
- No automatic deletion of files

---

## 🤖 Open-Source AI

Digital Janitor uses **Ollama** to run open-weight language models locally:

- **No API key required** — runs entirely on your hardware
- **Configurable model** — set `OLLAMA_MODEL` to any Ollama-compatible model
- **Graceful degradation** — all core features work without AI
  - Duplicate detection uses SHA-256 hashing (deterministic)
  - File categorization uses extension mapping (deterministic)
  - Clutter scoring is calculated mathematically (deterministic)
  - AI adds: filename suggestions, folder organization recommendations

### Hardware requirements for local AI
- llama3.2 (3B): ~4GB RAM minimum, 8GB recommended
- Larger models need proportionally more resources
- CPU inference is slow; GPU highly recommended

---

## 🧪 Development

```bash
# Server
cd server && npm run dev

# Client
cd client && npm run dev

# Lint check
cd client && npx eslint src/

# Build for production
cd client && npm run build
```

---

## ⚠️ Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Full FSA (rename/move) | ✅ | Partial | ✅ | ✅ |
| Fallback (metadata only) | ✅ | ✅ | ✅ | ✅ |
| SHA-256 duplicate detection | ✅ | ✅ | ✅ | ✅ |

The **File System Access API** (`showDirectoryPicker`) enables direct file operations in Chromium-based browsers and Safari 15.2+. Firefox falls back to the `<input webkitdirectory>` mode which provides metadata but no direct file operations.

---

## 📝 License

MIT — see [LICENSE](LICENSE)
