"use client";
import { Brain, Globe, Zap, Database, Shield, Code, Award } from "lucide-react";

const FAQS = [
    {
        q: "How does SmartStock Picks work?",
        a: "You type a query (e.g. 'Best tech growth stocks') or select a country. We fetch real stock data via Finnhub, send it to our FastAPI backend, which calls Mistral Large API to generate AI-powered recommendations with risk scores and detailed reasoning.",
    },
    {
        q: "Which markets are supported?",
        a: "15+ major stock exchanges: USA (NYSE, NASDAQ, AMEX), Canada (TSX), UK (LSE), Germany, France, Netherlands, Italy, Spain, Switzerland, Japan, Hong Kong, Australia, and Nordic countries.",
    },
    {
        q: "Can I query a specific stock symbol?",
        a: "Yes! Enter any ticker like 'AAPL' or 'MSFT' and get live prices from Finnhub plus AI analysis from Mistral showing comparable stocks and market insights.",
    },
    {
        q: "How does the AI work?",
        a: "We use Mistral Large API — a powerful, cost-effective LLM that excels at financial analysis. It generates structured recommendations with scores, risk levels, and growth potential for each stock pick.",
    },
    {
        q: "Is this financial advice?",
        a: "No. SmartStock Picks is an educational demo powered by AI. Stock recommendations are AI-generated and should NOT be treated as professional financial advice. Always consult a licensed financial advisor.",
    },
    {
        q: "How does the portfolio tracker work?",
        a: "Sign up or log in via Supabase Auth to create a user account. Your portfolio is stored in Postgres and synced across devices. Track your holdings, cost basis, and P&L in real-time.",
    },
    {
        q: "Can I deploy this?",
        a: "Yes! Frontend deploys to Vercel with auto-build from GitHub. Backend runs on any Python host (Railway, Render, AWS). Configure Supabase, Mistral, and Finnhub API keys in environment variables.",
    },
];

const STACK = [
    { icon: <Code size={20} />, name: "Next.js 14", desc: "App Router, Server/Client components, TypeScript" },
    { icon: <Database size={20} />, name: "Supabase", desc: "Postgres DB, Auth (email/password), Realtime" },
    { icon: <Brain size={20} />, name: "Mistral Large", desc: "AI recommendations via Mistral API" },
    { icon: <Globe size={20} />, name: "Finnhub", desc: "Real-time stock prices & market data" },
    { icon: <Zap size={20} />, name: "FastAPI + Python", desc: "Async backend, request handling" },
    { icon: <Shield size={20} />, name: "User Auth", desc: "Supabase Auth + multi-user portfolios" },
];

export default function AboutPage() {
    return (
        <>
            <div className="page-header hero-gradient">
                <h1><span className="gradient-text">SmartStock Picks</span></h1>
                <p>
                    🏆 <strong>Mistral Hackathon 2026</strong> Submission 🏆
                    <br />
                    <br />
                    AI-powered, multi-country stock recommendations powered by Mistral Large — 
                    with real-time pricing, user authentication, and portfolio tracking.
                </p>
            </div>

            <div className="container" style={{ paddingBottom: "4rem" }}>

                {/* Hackathon Features */}
                <div style={{ 
                    background: "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.1) 100%)",
                    border: "2px solid rgba(59,130,246,0.3)",
                    borderRadius: "var(--radius-md)",
                    padding: "1.5rem",
                    marginBottom: "3.5rem"
                }}>
                    <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", fontSize: "1.25rem" }}>
                        <Award size={24} style={{ color: "var(--accent)" }} />
                        Why This Wins
                    </h2>
                    <div style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}>
                        <p>✅ <strong>Multi-country intelligence:</strong> Supports 15+ global stock exchanges with Mistral-powered insights</p>
                        <p>✅ <strong>Real-world demo:</strong> Live stock prices from Finnhub + AI reasoning from Mistral Large</p>
                        <p>✅ <strong>User-specific:</strong> Full authentication & multi-user portfolio management via Supabase</p>
                        <p>✅ <strong>Production-ready:</strong> Deployable to Vercel + any Python host with zero vendor lock-in</p>
                        <p>✅ <strong>Mistral showcase:</strong> Perfect use case showing Mistral's financial reasoning capabilities</p>
                    </div>
                </div>

                {/* Tech Stack */}
                <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", marginTop: "1rem" }}>🛠 Tech Stack</h2>
                <div className="feature-grid" style={{ marginBottom: "3.5rem" }}>
                    {STACK.map((s) => (
                        <div className="card" key={s.name}>
                            <div className="feature-icon">{s.icon}</div>
                            <h3 style={{ fontSize: "1rem", marginBottom: "0.35rem" }}>{s.name}</h3>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>{s.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Architecture */}
                <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>🏗 Architecture</h2>
                <div
                    className="card"
                    style={{ background: "var(--bg-secondary)", fontFamily: "monospace", fontSize: "0.85rem", lineHeight: 1.9, color: "var(--text-secondary)", marginBottom: "3.5rem" }}
                >
                    <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{`
  Browser (Next.js)
     │
     ├─ /recommend  → User selects country or types query
     │               → FastAPI /recommend endpoint
     │
     ├─ /portfolio  → Supabase Auth required
     │               → User-specific holdings + P&L
     │
     └─ /           → Chat interface + stock lookup
  
  FastAPI Backend (Python)
     │
     ├─ /price/{symbol}  → Finnhub API → Real-time prices
     │
     └─ /recommend       → Mistral Large API
          └─ Returns JSON:
             { recommendations: [ 
               { symbol, score, risk, growth, reasoning } 
             ] }
  
  Mistral Large API
     └─ Reasoning model for stock recommendations
  
  Supabase
     ├─ Auth (email/password signups)
     ├─ Postgres (portfolio storage)
     └─ Realtime (live sync)
          `.trim()}</pre>
                </div>

                {/* FAQ */}
                <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>❓ FAQ</h2>
                <div>
                    {FAQS.map((f) => (
                        <div className="faq-item" key={f.q}>
                            <div className="faq-q">{f.q}</div>
                            <div className="faq-a">{f.a}</div>
                        </div>
                    ))}
                </div>

                {/* Disclaimer */}
                <div
                    style={{
                        marginTop: "3rem",
                        background: "rgba(245,158,11,0.08)",
                        border: "1px solid rgba(245,158,11,0.25)",
                        borderRadius: "var(--radius-md)",
                        padding: "1.25rem 1.5rem",
                        color: "#fcd34d",
                        fontSize: "0.875rem",
                        lineHeight: 1.7,
                    }}
                >
                    ⚠️ <strong>Disclaimer:</strong> SmartStock Picks is an educational demo built for the Mistral Hackathon 2026.
                    Stock recommendations are AI-generated by Mistral Large and should NOT be treated as professional 
                    financial advice. Past performance is not indicative of future results. Always do your own research 
                    and consult a licensed financial advisor before making investment decisions.
                </div>
            </div>
        </>
    );
}
