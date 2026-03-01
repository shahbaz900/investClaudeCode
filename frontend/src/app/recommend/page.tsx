"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Send } from "lucide-react";
import {
    fetchRecommendations,
    fetchDiscussion,
    detectCountry,
    type Recommendation,
} from "@/lib/api";
import { getStocksByCountry, getCachedResponse, setCachedResponse } from "@/lib/supabase";
import { getDemoRecommendations, isSupabaseConfigured } from "@/lib/demo";

// ── Message type for chat ────────────────────────────────────────────────────
interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

// ── Score pill ─────────────────────────────────────────────────────────────────
function scorePillClass(score: number) {
    if (score >= 8.5) return "score-green";
    if (score >= 7.0) return "score-orange";
    return "score-red";
}

const BADGE_COLORS = ["", "green", "teal"];

// ── Stock Card ─────────────────────────────────────────────────────────────────
function StockCard({ rec, rank }: { rec: Recommendation; rank: number }) {
    return (
        <div className="rec-card fade-in" style={{ animationDelay: `${rank * 0.1}s` }}>
            <div className="rec-card-top">
                <span className={`ticker-badge ${BADGE_COLORS[rank] ?? ""}`}>{rec.symbol}</span>
                <span className="company-name">{rec.company}</span>
            </div>
            <ul className="rec-reasons">
                {rec.reasoning.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
            <div className="rec-footer">
                <span className={`score-pill ${scorePillClass(rec.score)}`}>
                    Score: {rec.score.toFixed(1)}
                </span>
                <span className="risk-label">{rec.risk_level} Risk</span>
            </div>
        </div>
    );
}

// ── Format chat message with markdown-like styling ────────────────────────────
function FormattedMessage({ text }: { text: string }) {
    return (
        <div style={{ lineHeight: "1.6", whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
            {text.split('\n').map((line, idx) => {
                // Bold text ** **
                const boldified = line.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return (
                            <strong key={i} style={{ color: "#2c3e50", fontWeight: 700 }}>
                                {part.slice(2, -2)}
                            </strong>
                        );
                    }
                    return part;
                });

                // Check if line is a header (emoji + bold text)
                const isHeader = /^[\s\S][\s\S]\s+\*\*/.test(line) && line.includes('**');
                
                if (isHeader) {
                    return (
                        <div
                            key={idx}
                            style={{
                                marginTop: idx === 0 ? "0" : "1rem",
                                marginBottom: "0.5rem",
                                fontSize: "1rem",
                                fontWeight: 600,
                            }}
                        >
                            {boldified}
                        </div>
                    );
                }

                // Check if line is a bullet point
                if (line.trim().startsWith('-')) {
                    return (
                        <div
                            key={idx}
                            style={{
                                marginLeft: "1.5rem",
                                marginBottom: "0.5rem",
                                display: "flex",
                            }}
                        >
                            <span style={{ marginRight: "0.5rem" }}>•</span>
                            <span>{boldified}</span>
                        </div>
                    );
                }

                // Regular paragraph
                if (line.trim()) {
                    return (
                        <p key={idx} style={{ margin: "0.5rem 0" }}>
                            {boldified}
                        </p>
                    );
                }

                return <div key={idx} style={{ height: "0.5rem" }} />;
            })}
        </div>
    );
}

// ── Inner page (uses useSearchParams) ─────────────────────────────────────────
function RecommendContent() {
    const params = useSearchParams();
    const initialQuery = params.get("q") ?? "";
    const initialCountry = params.get("country") ?? "";

    const [query, setQuery] = useState(initialQuery);
    const [country, setCountry] = useState(initialCountry);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<Recommendation[] | null>(null);
    const [fromCache, setFromCache] = useState(false);
    const [isDemo, setIsDemo] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);

    useEffect(() => {
        if (!country) detectCountry().then(setCountry);
    }, [country]);

    // Auto-load recommendations when country changes
    useEffect(() => {
        if (country && country.length === 2) {
            // Auto-fetch recommendations for the selected country (generic "best stocks" query)
            runQuery("Get me the best stocks", country);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [country]);

    // Auto-run on load
    useEffect(() => {
        if (initialQuery) runQuery(initialQuery, initialCountry || "US");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isSpecificSymbol = (q: string) =>
        /^[A-Z]{1,5}(\.[AB])?$/.test(q.trim().toUpperCase());

    async function runQuery(q: string, c: string) {
        // Allow empty query to get default recommendations by country
        const query = q.trim() || "Get the best stocks";
        setLoading(true);
        setError(null);
        setResults(null);
        setFromCache(false);
        setIsDemo(false);
        setChatMessages([]);
        setChatInput("");

        try {
            const specific = isSpecificSymbol(query);

            // ── Demo mode: no Supabase configured → skip cache/DB ─────────
            if (!isSupabaseConfigured()) {
                // Small artificial delay so it doesn't feel instant
                await new Promise((r) => setTimeout(r, 900));
                setResults(getDemoRecommendations(c));
                setIsDemo(true);
                setLoading(false);
                return;
            }

            // ── Check Supabase cache (general queries only) ────────────────
            if (!specific) {
                const cached = await getCachedResponse(c, query).catch(() => null);
                if (cached) {
                    const data = cached.ai_response as { recommendations: Recommendation[] };
                    setResults(data.recommendations ?? []);
                    setFromCache(true);
                    setLoading(false);
                    return;
                }
            }

            // ── Fetch pre-seeded stock data ────────────────────────────────
            let stocks = undefined;
            if (!specific) {
                stocks = await getStocksByCountry(c).catch(() => []);
            }

            const payload = {
                query: query,
                country: c,
                stocks: stocks?.length ? stocks : undefined,
                specific_symbol: specific ? query.trim().toUpperCase() : undefined,
            };

            // ── Call AI backend ────────────────────────────────────────────
            const res = await fetchRecommendations(payload).catch(async (err: Error) => {
                // If AI backend fails, fall back to demo data with a warning
                if (err.message.includes("fetch") || err.message.includes("ECONNREFUSED") || err.message.includes("Failed to fetch")) {
                    return null; // trigger demo fallback below
                }
                throw err;
            });

            if (!res) {
                // Backend unreachable → demo fallback
                setResults(getDemoRecommendations(c));
                setIsDemo(true);
                setLoading(false);
                return;
            }

            setResults(res.recommendations);

            // ── Cache general responses ────────────────────────────────────
            if (!specific) {
                setCachedResponse(c, query, res as unknown as Record<string, unknown>).catch(() => { });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    async function sendChatMessage() {
        if (!chatInput.trim() || !results || results.length === 0) return;
        
        const userMessage: ChatMessage = { role: "user", content: chatInput };
        setChatMessages(prev => [...prev, userMessage]);
        setChatInput("");
        setChatLoading(true);

        try {
            const response = await fetchDiscussion({
                recommendations: results,
                question: chatInput,
                country: country
            });

            const assistantMessage: ChatMessage = { 
                role: "assistant", 
                content: response.response 
            };
            setChatMessages(prev => [...prev, assistantMessage]);
        } catch (err) {
            const errorMessage: ChatMessage = {
                role: "assistant",
                content: `Error: ${err instanceof Error ? err.message : "Failed to get response"}`
            };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setChatLoading(false);
        }
    }

    return (
        <>
            {/* ── Page header ─────────────────────────────────────────────── */}
            <div className="page-header" style={{ paddingTop: "2.5rem" }}>
                <h1>AI-Driven Investment Intelligence</h1>
                <p>Curious where to invest? Ask your question and get the top 3 data-backed picks instantly.</p>
            </div>

            {/* ── Search bar ──────────────────────────────────────────────── */}
            <div className="container" style={{ maxWidth: 760, marginBottom: "0.25rem" }}>
                <div style={{ margin: "0 auto" }}>
                    <textarea
                        className="search-input"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                runQuery(query, country);
                            }
                        }}
                        placeholder="e.g. Best tech stocks in US or type NVDA... (Press Enter to search, Shift+Enter for new line)"
                        id="recommend-input"
                        style={{
                            width: "100%",
                            minHeight: "100px",
                            border: "1.5px solid var(--border)",
                            borderRadius: "8px",
                            padding: "0.85rem 1.1rem",
                            fontSize: "0.95rem",
                            color: "var(--text-body)",
                            fontFamily: "inherit",
                            outline: "none",
                            resize: "vertical",
                            boxSizing: "border-box",
                            background: "#fff"
                        }}
                    />
                    <div style={{ textAlign: "center", marginTop: "1rem" }}>
                        <button
                            className="search-btn"
                            onClick={() => runQuery(query, country)}
                            disabled={loading}
                            style={{
                                padding: "0.8rem 2rem",
                                borderRadius: "25px",
                                fontSize: "1rem",
                                fontWeight: 600,
                                cursor: loading ? "not-allowed" : "pointer",
                                opacity: loading ? 0.7 : 1,
                                transition: "all 0.3s ease"
                            }}
                        >
                            {loading ? "Analyzing…" : "Get Recommendations"}
                        </button>
                    </div>
                </div>

                {/* Country edit + badges */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                        🌍 Country:
                        <input
                            value={country}
                            onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))}
                            onKeyDown={(e) => {
                                if (e.key === "Backspace") setCountry("");
                            }}
                            style={{
                                border: "1px solid var(--accent)", borderRadius: 6, padding: "0.4rem 0.6rem",
                                fontSize: "0.85rem", fontWeight: 700, color: "var(--accent)",
                                width: 70, outline: "none", background: "#fff", textAlign: "center"
                            }}
                            maxLength={2}
                            placeholder="US"
                            title="ISO country code e.g. US, PK, GB, IN, DE"
                        />
                    </div>
                    {fromCache && <span className="score-pill score-green">⚡ Cached result</span>}
                    {isDemo && <span className="score-pill score-orange">🎭 Demo mode — add API keys for live results</span>}
                </div>

                {/* Demo banner */}
                {isDemo && (
                    <div className="demo-banner">
                        ⚠️ Running in demo mode. Set <code>NEXT_PUBLIC_AI_BACKEND_URL</code> and Supabase keys in <code>.env.local</code> to get live Claude recommendations.
                    </div>
                )}
            </div>

            {/* ── States ──────────────────────────────────────────────────── */}
            {loading && (
                <div style={{ textAlign: "center" }}>
                    <div className="spinner" />
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Analyzing the market…</p>
                </div>
            )}

            {error && <div className="error-banner container">❌ {error}</div>}

            {!loading && !error && !results && (
                <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
                    <Search size={40} style={{ margin: "0 auto 1rem", display: "block", opacity: 0.4 }} />
                    <p style={{ fontSize: "0.9rem" }}>Enter a query above to get stock recommendations.</p>
                </div>
            )}

            {/* ── Results ─────────────────────────────────────────────────── */}
            {results && !loading && (
                <div className="container" style={{ paddingBottom: "4rem" }}>
                    <div className="section-divider" style={{ margin: "1.5rem auto" }} />
                    <h2 className="section-title">Top Stocks in World to Invest as of Today</h2>
                    <p className="section-sub">Based on your query and country: <strong>{country}</strong></p>
                    <div className="rec-grid">
                        {results.map((rec, i) => (
                            <StockCard key={rec.symbol} rec={rec} rank={i} />
                        ))}
                    </div>

                    {/* ── Chat/Discussion Section ────────────────────────────── */}
                    <div className="section-divider" style={{ margin: "2rem auto" }} />
                    <h2 className="section-title">💬 Discuss These Stocks</h2>
                    <p className="section-sub">Ask our AI advisor any questions about these recommendations</p>
                    
                    <div style={{
                        maxWidth: "760px",
                        margin: "1.5rem auto",
                        border: "1.5px solid var(--border)",
                        borderRadius: "12px",
                        padding: "1.5rem",
                        background: "#fafafa",
                        minHeight: "300px",
                        display: "flex",
                        flexDirection: "column",
                    }}>
                        {/* Chat messages */}
                        <div style={{
                            flex: 1,
                            overflowY: "auto",
                            marginBottom: "1.5rem",
                            minHeight: "200px",
                            paddingRight: "0.5rem"
                        }}>
                            {chatMessages.length === 0 ? (
                                <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "2rem" }}>
                                    <p>🤖 Ask a question to get started!</p>
                                    <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
                                        E.g., "Why is AAPL ranked higher?", "What's the risk profile?", "Should I invest now?"
                                    </p>
                                </div>
                            ) : (
                                chatMessages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            marginBottom: "1rem",
                                            display: "flex",
                                            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                                        }}
                                    >
                                        <div
                                            style={{
                                                maxWidth: "75%",
                                                padding: "0.8rem 1rem",
                                                borderRadius: "8px",
                                                background: msg.role === "user" ? "var(--accent)" : "white",
                                                color: msg.role === "user" ? "white" : "var(--text-body)",
                                                fontSize: "0.9rem",
                                                wordWrap: "break-word",
                                                boxShadow: msg.role === "user" ? "none" : "0 2px 4px rgba(0,0,0,0.1)",
                                            }}
                                        >
                                            {msg.role === "assistant" ? (
                                                <FormattedMessage text={msg.content} />
                                            ) : (
                                                msg.content
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                            {chatLoading && (
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <div className="spinner" style={{ width: "20px", height: "20px" }} />
                                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Thinking…</span>
                                </div>
                            )}
                        </div>

                        {/* Chat input */}
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        sendChatMessage();
                                    }
                                }}
                                placeholder="Ask about these stocks... (Press Enter to send)"
                                disabled={chatLoading}
                                style={{
                                    flex: 1,
                                    padding: "0.75rem 1rem",
                                    border: "1.5px solid var(--border)",
                                    borderRadius: "8px",
                                    fontSize: "0.9rem",
                                    outline: "none",
                                    background: "white",
                                    color: "var(--text-body)",
                                    opacity: chatLoading ? 0.7 : 1,
                                    cursor: chatLoading ? "not-allowed" : "text",
                                }}
                            />
                            <button
                                onClick={sendChatMessage}
                                disabled={chatLoading || !chatInput.trim()}
                                style={{
                                    padding: "0.75rem 1.25rem",
                                    background: "var(--accent)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    fontSize: "1rem",
                                    opacity: chatLoading || !chatInput.trim() ? 0.6 : 1,
                                    transition: "all 0.3s ease",
                                }}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default function RecommendPage() {
    return (
        <Suspense fallback={<div className="spinner" style={{ marginTop: "5rem" }} />}>
            <RecommendContent />
        </Suspense>
    );
}
