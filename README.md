# 🚀 SmartStockPicker — AI Stock Recommendation Platform

> **Mistral Worldwide Hackathon 2026** submission: **Next.js 14** + **Supabase** + **FastAPI + Mistral Large 3**

A personalized AI stock recommendation platform powered by **Mistral Large 3** that works **globally**, is **cost-efficient** (24h caching), and handles both general country-based queries and specific stock symbol lookups.

## 🌍 Live Demo

- **Frontend**: [https://invest-claude-code.vercel.app](https://invest-claude-code.vercel.app)
- **Backend API**: [https://investclaudecode-production.up.railway.app](https://investclaudecode-production.up.railway.app)

## ✨ Key Features

- **AI-Powered Recommendations**: Mistral Large 3 analyzes market data and provides personalized stock picks
- **Investment Goal Planning**: 1, 5, 10, and 15-year SIP (Systematic Investment Plan) projections with visual charts
- **Global Multi-Country Support**: Works with stocks from US, UK, Pakistan, India, Germany, and more
- **Smart Questionnaire**: Simplifies complex investment concepts for beginner-friendly experience
- **Portfolio Management**: Track your recommended stocks, shares, and real-time P&L
- **Cost-Efficient Caching**: 24h cache eliminates redundant API calls to Mistral
- **Authentication**: Secure Supabase auth for portfolio persistence
- **Responsive Design**: Beautiful dark theme UI optimized for desktop and mobile

## 🛠 Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **Backend** | FastAPI (Python 3.11), Mistral Large 3 API |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Deployment** | Vercel (frontend), Railway (backend) |
| **External APIs** | Mistral AI, FinnHub (stock pricing) |

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

## ⚡ Quick Start (Local Development)

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

---

## 🎯 How to Test

1. **Visit the live demo**: [https://invest-claude-code.vercel.app](https://invest-claude-code.vercel.app)
2. Click "**AI Investment Planner**"
3. Fill out the questionnaire with your investment details
4. View AI-generated stock recommendations + 15-year projections
5. (Optional) Sign up and add stocks to your portfolio

### Test Data
- **Country**: United States, United Kingdom, Pakistan, India, Germany
- **Risk Levels**: Conservative (4.5% return), Moderate (7.5%), Aggressive (10.5%)
- **Investment Horizons**: 1yr, 5yr, 10yr, 15yr projections

---

## ⚠️ Disclaimer

SmartStockPicker is an educational demo. AI-generated stock recommendations are **not financial advice**. Always consult a licensed financial advisor before investing.

---

## 📝 Notes for Judges

### Why Mistral Large 3?
We chose **Mistral Large 3** because:
- **Superior reasoning** for financial analysis and stock evaluation
- **Cost-effective** with high token limits for detailed recommendations
- **Fast inference** for real-time user experience
- **Global context understanding** for international stock markets

### Architecture Highlights
- **SSE (Server-Side Events) caching** dramatically reduces API costs
- **Separation of concerns**: Frontend handles UI, backend handles AI
- **Scalable database schema** supports unlimited users and portfolios
- **Type-safe with TypeScript** across entire stack

### How We Built This
- Integrated Mistral AI Chat API into a FastAPI backend
- Built interactive investment charts with SVG (no external charting libs)
- Implemented 24h smart caching to minimize costs
- Deployed across Vercel + Railway for production-grade infrastructure

---

## 🚀 Deployment

| Service      | URL | Status |
|--------------|-----|--------|
| **Frontend** | [invest-claude-code.vercel.app](https://invest-claude-code.vercel.app) | ✅ Live |
| **Backend** | [investclaudecode-production.up.railway.app](https://investclaudecode-production.up.railway.app) | ✅ Live |
| **Database** | Supabase | ✅ Live |

### Deploy Your Own

**Frontend (Vercel):**
```bash
cd frontend
npm install
# Push to GitHub and connect to Vercel
```

**Backend (Railway):**
```bash
# Railway auto-detects Dockerfile
# Just connect your GitHub repo
```

Set environment variables in each platform's dashboard (see `.env.example` files).

---

## 📚 Additional Resources

- [Mistral AI Documentation](https://docs.mistral.ai)
- [Next.js App Router](https://nextjs.org/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [FastAPI Docs](https://fastapi.tiangolo.com)
