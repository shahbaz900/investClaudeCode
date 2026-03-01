"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Trash2, TrendingUp, TrendingDown, LogOut, MessageCircle } from "lucide-react";
import { getCurrentUser, signOut } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/demo";
import { fetchStockPrice } from "@/lib/api";

// Helpers
let supabaseHelpers: typeof import("@/lib/supabase") | null = null;

const PORTFOLIOKEY = "smartstockpicker_portfolio";

interface PortfolioEntry {
    id?: string;
    user_id: string;
    stock_symbol: string;
    shares: number;
    bought_price: number;
    currentPrice?: number;
    pnl?: number;
    pnlPct?: number;
}

const DEMO_ENTRIES: PortfolioEntry[] = [];

function fmtUSD(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

// ── Local Storage Helpers ─────────────────────────────────────────────────────
function loadFromLocal(): PortfolioEntry[] {
    if (typeof window === "undefined") return DEMO_ENTRIES;
    const stored = localStorage.getItem(PORTFOLIOKEY);
    return stored ? JSON.parse(stored) : DEMO_ENTRIES;
}

function saveToLocal(entries: PortfolioEntry[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(PORTFOLIOKEY, JSON.stringify(entries));
}

export default function PortfolioPage() {
    const router = useRouter();
    const [entries, setEntries] = useState<PortfolioEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    const [symbol, setSymbol] = useState("");
    const [shares, setShares] = useState("");
    const [price, setPrice] = useState("");
    const [formError, setFormError] = useState("");

    // Check authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            const supabaseConfigured = isSupabaseConfigured();
            
            if (!supabaseConfigured) {
                setIsDemoMode(true);
                setLoading(false);
                return;
            }

            try {
                const user = await getCurrentUser();
                if (!user) {
                    // Not logged in - redirect to login
                    router.push("/login");
                    return;
                }

                setUserId(user.id);
                setUserEmail(user.email || "User");
                setIsDemoMode(false);

                // Load user's portfolio from Supabase
                import("@/lib/supabase").then(async (mod) => {
                    supabaseHelpers = mod;
                    const data = await mod.getPortfolio(user.id).catch(() => []);
                    
                    // Fetch real prices for each stock
                    const updated = await Promise.all(data.map(async (e) => {
                        try {
                            const priceData = await fetchStockPrice(e.stock_symbol);
                            const currentPrice = priceData.current_price;
                            return { 
                                ...e, 
                                currentPrice, 
                                pnl: (currentPrice - e.bought_price) * e.shares, 
                                pnlPct: ((currentPrice - e.bought_price) / e.bought_price) * 100 
                            };
                        } catch (err) {
                            const cp = e.currentPrice || e.bought_price * 1.1;
                            return { 
                                ...e, 
                                currentPrice: cp, 
                                pnl: (cp - e.bought_price) * e.shares, 
                                pnlPct: ((cp - e.bought_price) / e.bought_price) * 100 
                            };
                        }
                    }));
                    
                    setEntries(updated);
                    setLoading(false);
                });
            } catch (err) {
                console.error("Auth check failed:", err);
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    async function addEntry() {
        setFormError("");
        if (!symbol || !shares || !price) { setFormError("All fields are required."); return; }
        if (isNaN(+shares) || isNaN(+price)) { setFormError("Shares and price must be numbers."); return; }

        setSaving(true);
        try {
            const upperSymbol = symbol.toUpperCase();
            const numShares = +shares;
            const numPrice = +price;
            
            // Fetch real current price from backend
            let currentPrice = numPrice;
            try {
                const priceData = await fetchStockPrice(upperSymbol);
                currentPrice = priceData.current_price;
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : String(err);
                console.error(`Failed to fetch price for ${upperSymbol}:`, err);
                
                // Extract backend error message if available
                if (errMsg.includes("not available in our currently supported markets")) {
                    setFormError(`❌ ${upperSymbol} is not available in our currently supported markets. We support: USA (NYSE, NASDAQ, AMEX), Canada, UK, Europe, Japan, Hong Kong, and Australia.`);
                    setSaving(false);
                    return;
                }
                
                setFormError(`⚠️ Could not fetch live price for ${upperSymbol}. Using your entry price. (${errMsg})`);
                currentPrice = numPrice;
            }
            
            const pnl = (currentPrice - numPrice) * numShares;
            const newEntry: PortfolioEntry = {
                user_id: userId || "", 
                stock_symbol: upperSymbol,
                shares: numShares, 
                bought_price: numPrice,
                currentPrice: currentPrice,
                pnl,
                pnlPct: ((currentPrice - numPrice) / numPrice) * 100
            };
            
            const updated = entries.filter(e => e.stock_symbol !== upperSymbol);
            updated.push(newEntry);
            setEntries(updated);
            saveToLocal(updated);
            
            // Try Supabase in background (optional)
            if (supabaseHelpers && userId) {
                try {
                    await supabaseHelpers.upsertPortfolioEntry({ 
                        user_id: userId, 
                        stock_symbol: upperSymbol, 
                        shares: numShares, 
                        bought_price: numPrice 
                    });
                } catch (e) {
                    // Supabase failed but local save succeeded
                    console.error("Supabase save failed:", e);
                }
            }
            
            setSymbol(""); 
            setShares(""); 
            setPrice("");
        } catch (e) { 
            const errMsg = e instanceof Error ? e.message : "Save failed";
            setFormError(errMsg);
        }
        finally { setSaving(false); }
    }

    async function removeEntry(sym: string) {
        const updated = entries.filter((e) => e.stock_symbol !== sym);
        setEntries(updated);
        saveToLocal(updated);
        
        // Try Supabase in background
        if (supabaseHelpers && userId) {
            try {
                await supabaseHelpers.deletePortfolioEntry(userId, sym);
            } catch {
                // Silent fail - local storage already updated
            }
        }
    }

    const totalValue = entries.reduce((s, e) => s + (e.currentPrice ?? e.bought_price) * e.shares, 0);
    const totalCost = entries.reduce((s, e) => s + e.bought_price * e.shares, 0);
    const totalPnL = totalValue - totalCost;
    const totalPnLPct = totalCost ? (totalPnL / totalCost) * 100 : 0;

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
                <div style={{ textAlign: "center" }}>
                    <div className="spinner" style={{ margin: "0 auto 1rem" }} />
                    <p>Loading portfolio...</p>
                </div>
            </div>
        );
    }

    async function handleLogout() {
        try {
            await signOut();
            router.push("/");
        } catch (err) {
            console.error("Logout failed:", err);
        }
    }

    return (
        <>
            <div className="page-header">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <div>
                        <h1>My Portfolio</h1>
                        <p>Track your holdings, cost basis, and P&amp;L — all in one place.</p>
                        {userEmail && <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>Logged in as: <strong>{userEmail}</strong></p>}
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                        <button
                            onClick={() => router.push("/")}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                padding: "0.5rem 1rem",
                                background: "var(--accent)",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "0.9rem",
                                fontWeight: 600
                            }}
                        >
                            <MessageCircle size={18} />
                            Chat
                        </button>
                        {!isDemoMode && (
                            <button
                                onClick={handleLogout}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    padding: "0.5rem 1rem",
                                    background: "#ff6b6b",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "0.9rem",
                                    fontWeight: 600
                                }}
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        )}
                    </div>
                </div>
                {isDemoMode && (
                    <div className="demo-banner" style={{ margin: "0.75rem auto 0" }}>
                        🎭 Demo mode — portfolio is not saved. Add Supabase keys to <code>.env.local</code> to persist data.
                    </div>
                )}
            </div>

            <div className="container" style={{ paddingBottom: "4rem", maxWidth: 1000 }}>
                {/* Stats */}
                <div className="stats-grid" style={{ marginBottom: "1.75rem" }}>
                    {[
                        { label: "Portfolio Value", value: fmtUSD(totalValue), color: "var(--accent)" },
                        { label: "Total Invested", value: fmtUSD(totalCost), color: "var(--text-h)" },
                        { label: "Total P&L", value: (totalPnL >= 0 ? "+" : "") + fmtUSD(totalPnL), color: totalPnL >= 0 ? "var(--accent)" : "var(--red)" },
                        { label: "Return", value: (totalPnLPct >= 0 ? "+" : "") + totalPnLPct.toFixed(2) + "%", color: totalPnLPct >= 0 ? "var(--accent)" : "var(--red)" },
                    ].map((s) => (
                        <div className="stat-card" key={s.label}>
                            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Add form */}
                <div className="card" style={{ marginBottom: "1.5rem" }}>
                    <h2 style={{ fontSize: "1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <PlusCircle size={17} color="var(--accent)" /> Add Position
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "0.75rem", alignItems: "end" }}>
                        {[
                            { label: "SYMBOL", value: symbol, setter: setSymbol, placeholder: "AAPL", id: "p-symbol" },
                            { label: "SHARES", value: shares, setter: setShares, placeholder: "10", id: "p-shares" },
                            { label: "BUY PRICE $", value: price, setter: setPrice, placeholder: "175.00", id: "p-price" },
                        ].map(({ label, value, setter, placeholder, id }) => (
                            <div key={id}>
                                <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem", fontWeight: 600 }}>{label}</label>
                                <input className="input" value={value} placeholder={placeholder} id={id}
                                    onChange={(e) => setter(e.target.value)} />
                            </div>
                        ))}
                        <button className="btn btn-primary" onClick={addEntry} disabled={saving} style={{ height: 42 }}>
                            {saving ? "…" : "Add"}
                        </button>
                    </div>
                    {formError && <p style={{ color: "var(--red)", fontSize: "0.82rem", marginTop: "0.5rem" }}>{formError}</p>}
                </div>

                {/* Table */}
                {loading ? <div className="spinner" /> : entries.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
                        No positions yet. Add your first holding above.
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead><tr>
                                <th>Symbol</th><th>Shares</th><th>Avg Cost</th>
                                <th>Curr Price</th><th>Value</th><th>P&amp;L</th><th>Return</th><th></th>
                            </tr></thead>
                            <tbody>
                                {entries.map((e) => {
                                    const pos = (e.pnl ?? 0) >= 0;
                                    return (
                                        <tr key={e.stock_symbol}>
                                            <td style={{ fontWeight: 700, color: "var(--blue)" }}>{e.stock_symbol}</td>
                                            <td>{e.shares}</td>
                                            <td>{fmtUSD(e.bought_price)}</td>
                                            <td>{fmtUSD(e.currentPrice ?? e.bought_price)}</td>
                                            <td>{fmtUSD((e.currentPrice ?? e.bought_price) * e.shares)}</td>
                                            <td style={{ color: pos ? "var(--accent)" : "var(--red)", fontWeight: 600 }}>
                                                {pos ? <TrendingUp size={13} style={{ verticalAlign: "middle", marginRight: 3 }} /> : <TrendingDown size={13} style={{ verticalAlign: "middle", marginRight: 3 }} />}
                                                {pos ? "+" : ""}{fmtUSD(e.pnl ?? 0)}
                                            </td>
                                            <td style={{ color: pos ? "var(--accent)" : "var(--red)", fontWeight: 600 }}>
                                                {pos ? "+" : ""}{(e.pnlPct ?? 0).toFixed(2)}%
                                            </td>
                                            <td>
                                                <button onClick={() => removeEntry(e.stock_symbol)}
                                                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                                                    id={`rm-${e.stock_symbol}`}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
