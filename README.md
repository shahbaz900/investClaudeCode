# 🚀 SmartStockPicker — AI Stock Recommendation Platform

> **Mistral Worldwide Hackathon 2026** submission: **Next.js 14** + **Supabase** + **FastAPI + Mistral Large 3**

A personalized AI stock recommendation platform powered by **Mistral Large 3** that works **globally**, is **cost-efficient** (24h caching), and handles both general country-based queries and specific stock symbol lookups.

---

## 📁 Project Structure

```
investClaudeCode/
├── frontend/              ← Next.js 14 (App Router)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           ← Home + search
│   │   │   ├── recommend/page.tsx ← AI recommendations
│   │   │   ├── portfolio/page.tsx ← Portfolio tracker
│   │   │   ├── about/page.tsx     ← About / FAQ
│   │   │   ├── globals.css        ← Premium dark theme
│   │   │   ├── layout.tsx
│   │   │   └── api/
│   │   │       ├── stocks/[country]/route.ts
│   │   │       ├── recommend/route.ts
│   │   │       └── portfolio/route.ts
│   │   ├── components/
│   │   │   └── Navbar.tsx
│   │   └── lib/
│   │       ├── supabase.ts        ← Supabase client + helpers
│   │       └── api.ts             ← FastAPI client + utils
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   └── .env.local.example
│
├── ai-backend/            ← FastAPI + Mistral Large 3 (Python)
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
│
└── supabase/
    └── schema.sql         ← Run in Supabase SQL Editor
```

---

## ⚡ Quick Start

### 1. Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run the contents of `supabase/schema.sql`
3. This creates: `users`, `stocks` (with seed data), `portfolio`, `ai_cache` tables

### 2. FastAPI AI Backend

```bash
cd ai-backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env and add your Mistral API key (get from https://console.mistral.ai/)

# Run
uvicorn main:app --reload --port 8000
```

API docs available at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Next.js Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
copy .env.local.example .env.local
# Edit .env.local with your Supabase URL, anon key, and backend URL

# Run dev server
npm run dev
```

App available at: [http://localhost:3000](http://localhost:3000)

---

## 🔑 Environment Variables

### `frontend/.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_AI_BACKEND_URL=http://localhost:8000
```

### `ai-backend/.env`
```env
MISTRAL_API_KEY=your-mistral-api-key
```

---

## 🗂 Database Schema

| Table       | Purpose                                              |
|-------------|------------------------------------------------------|
| `users`     | User profiles with country                           |
| `stocks`    | Pre-seeded stock data (US, UK, PK, IN, DE)          |
| `portfolio` | User holdings with shares + buy price                |
| `ai_cache`  | 24h cache of Mistral responses to minimize API costs |

---

## 🌐 API Endpoints

### Next.js API Routes (via frontend)
| Method | Endpoint                  | Description                    |
|--------|---------------------------|--------------------------------|
| GET    | `/api/stocks/:country`    | Fetch stocks by country code   |
| POST   | `/api/recommend`          | Get AI recommendations         |
| GET    | `/api/portfolio`          | Fetch user portfolio           |
| POST   | `/api/portfolio`          | Add/update portfolio entry     |
| DELETE | `/api/portfolio`          | Remove portfolio entry         |

### FastAPI Endpoints
| Method | Endpoint     | Description                    |
|--------|--------------|--------------------------------|
| GET    | `/`          | Health / info                  |
| GET    | `/health`    | Health check                   |
| POST   | `/recommend` | Mistral AI recommendations     |

---

## 💡 Cost Optimization

- **Mistral Large 3** — high-quality reasoning for stock analysis
- **24h Supabase cache** — country-level queries cached, eliminating repeat API calls
- **Pre-fetched stock data** — Supabase stores fundamentals; Mistral only scores them
- **Max 1024 tokens** per response — keeps latency and cost low

---

## 🚀 Deployment

| Service      | Recommended Host              |
|--------------|-------------------------------|
| Frontend     | [Vercel](https://vercel.com)  |
| AI Backend   | [Railway](https://railway.app) or [Render](https://render.com) |
| Database     | [Supabase](https://supabase.com) |

---

## ⚠️ Disclaimer

SmartStockPicker is an educational demo. AI-generated stock recommendations are **not financial advice**. Always consult a licensed financial advisor before investing.
