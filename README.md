# Aria — Voice Document RAG Agent

A real-time voice assistant that answers questions about uploaded documents using Google Gemini's Multimodal Live API.

- **Voice** — Gemini Multimodal Live API (configurable model, default `gemini-3.1-flash-live-preview`)
- **Embeddings** — Gemini Embedding API (`models/gemini-embedding-001`, 768-dim)
- **Database** — Neon Postgres with `pgvector` for metadata and vector search
- **Backend** — FastAPI + SQLAlchemy async ORM + WebSocket relay
- **Frontend** — Next.js 14, React Three Fiber orb, AudioWorklet mic pipeline

---

## Project layout

```
├── backend/
│   ├── main.py          # FastAPI: auth, uploads, WebSocket → Gemini relay
│   ├── auth.py          # JWT + bcrypt, one-time WebSocket tickets
│   ├── config.py        # pydantic-settings: all config from environment
│   ├── database.py      # SQLAlchemy async ORM models + engine
│   ├── tools.py         # search_documents(), list_documents()
│   ├── ingest.py        # CLI: file → Markdown → chunks → embeddings → Postgres
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── login/       # Login page
│   │   ├── admin/       # Document upload + management (admin only)
│   │   └── agent/       # Voice interface
│   ├── components/      # VoiceOrb, Waveform, TranscriptModal, SourcesPanel
│   ├── lib/             # audioCapture, audioPlayback, api client
│   └── public/worklets/pcm-processor.js
└── docs/                # Staging area for documents before ingestion
```

---

## Running locally

### 1. Postgres (Neon)

Create a free project at [neon.tech](https://neon.tech). Copy the connection string — it looks like:

```
postgresql://user:password@host/dbname?sslmode=require
```

### 2. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in required values
uvicorn main:app --reload --port 8000
```

The database schema (tables + pgvector extension + HNSW index) is created automatically on first startup.

### 3. Ingest documents

```bash
# activate the venv first, then from the backend/ directory:
python ingest.py ../docs/report.pdf      # single file
python ingest.py ../docs/               # entire folder (recursive)
```

Supported formats: PDF, DOCX, PPTX, XLSX, CSV, HTML, images, audio, and more (via `markitdown`).

Re-running ingest is safe — unchanged files are skipped; modified files are re-embedded automatically.

### 4. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # set backend URLs
npm run dev
```

Open `http://localhost:3000`. Log in with the credentials from your `.env`.

---

## Environment variables

### Backend — `backend/.env`

**Required** (server refuses to start without these):

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon connection string (`postgresql://...?sslmode=require`) |
| `GEMINI_API_KEY` | From [Google AI Studio](https://aistudio.google.com/) |
| `JWT_SECRET` | Long random string — `python3 -c "import secrets; print(secrets.token_hex(32))"` |
| `ADMIN_PASSWORD` | Admin account password |
| `USER_PASSWORD` | Standard user account password |

**Optional** (have sensible defaults — only set to override):

| Variable | Default | Description |
|---|---|---|
| `FRONTEND_URL` | `http://localhost:3000` | Comma-separated allowed CORS origins |
| `ENV` | `development` | Set to `production` to enforce secure cookies and strong-secret validation |
| `PORT` | `8000` | Set automatically by Render/Railway/Fly in production |
| `ADMIN_USERNAME` | `admin` | Admin account username |
| `USER_USERNAME` | `user` | Standard user username |
| `LIVE_MODEL` | `gemini-3.1-flash-live-preview` | Gemini Live model ID |
| `VOICE_NAME` | `Aoede` | Voice for audio responses |
| `EMBEDDING_MODEL` | `models/gemini-embedding-001` | Gemini embedding model |
| `HISTORY_CONTEXT_TURNS` | `12` | Conversation turns injected into system instruction on reconnect |
| `DB_POOL_SIZE` | `5` | SQLAlchemy async connection pool size |

See `backend/.env.example` for the full list.

### Frontend — `frontend/.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | HTTP(S) backend URL, e.g. `https://your-backend.onrender.com` |
| `NEXT_PUBLIC_BACKEND_WS_URL` | WebSocket URL, e.g. `wss://your-backend.onrender.com` |

---

## Accounts

There is no signup flow. Both accounts are seeded from environment variables on backend startup:

- **Admin** (`ADMIN_USERNAME` / `ADMIN_PASSWORD`): can upload documents and use the voice agent.
- **User** (`USER_USERNAME` / `USER_PASSWORD`): can only use the voice agent.

Accounts are created on first run. If a username already exists with the same role, it is left unchanged.

---

## Deploying

### Backend → Render

1. Push this repo to GitHub.
2. Create a **New Web Service**, set **Root Directory** to `backend`.
3. **Build command**: `pip install -r requirements.txt`
4. **Start command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add all required environment variables in the Render dashboard. Set `ENV=production`.

> **Free-tier note**: Render's free tier spins down after ~15 minutes of inactivity. Hit `GET /health` from an uptime monitor (e.g. UptimeRobot) to keep it warm.

### Frontend → Vercel

1. Import the GitHub repo, set **Root Directory** to `frontend`.
2. Add `NEXT_PUBLIC_BACKEND_URL` and `NEXT_PUBLIC_BACKEND_WS_URL` in Project Settings → Environment Variables.
3. Deploy.

> **Cross-origin cookies**: The auth cookie requires `SameSite=None; Secure`, which needs HTTPS on both ends (both platforms provide this). The most common failure is a `FRONTEND_URL` mismatch in CORS — make sure it exactly matches your Vercel URL with no trailing slash.

---

## Audio pipeline

```
Mic → AudioWorklet (pcm-processor.js)
      ↓  downsample to 16 kHz PCM16
      ↓  binary WebSocket frames
FastAPI WebSocket relay
      ↓  Gemini Live API (bidirectional)
      ↓  24 kHz PCM16 audio back from Gemini
      ↓  binary frames to browser
AudioBufferSourceNode chain (gapless 24 kHz playback)
AnalyserNode → VoiceOrb amplitude + Waveform FFT
```

---

## Tool calling flow

1. User asks a question → Gemini emits a `tool_call` for `search_documents`.
2. FastAPI embeds the query with `gemini-embedding-001` (`RETRIEVAL_QUERY` task type).
3. pgvector cosine similarity search returns the top matching chunks.
4. Results are sent back to Gemini as a `tool_response`.
5. Gemini continues speaking with the retrieved context.
6. The frontend receives a `source_cited` event and animates the sources panel.
