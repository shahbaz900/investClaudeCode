"use client";
import { useState, useEffect } from "react";
import { TrendingUp, Send, AlertCircle, X, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Recommendation {
    symbol: string;
    score: number;
    risk: string;
    rationale?: string;
    reasoning?: string;
    expectedCAGR?: string;
    expectedCagr?: string;
    dividendYield?: string;
}

interface ProjectionPoint {
    year: number;
    amount: number;
    growth: number;
}

interface ProfileData {
    [key: string]: any;
}

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function ResultsPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [projections, setProjections] = useState<any>(null);
    const [currency, setCurrency] = useState<string>("USD");
    const [currencySymbol, setCurrencySymbol] = useState<string>("$");
    const [isProfessional, setIsProfessional] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showChatbot, setShowChatbot] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [initialCapital, setInitialCapital] = useState(0);
    const [monthlyContribution, setMonthlyContribution] = useState(0);
    
    // Portfolio state
    const [showPortfolioModal, setShowPortfolioModal] = useState(false);
    const [portfolioStocks, setPortfolioStocks] = useState<{ symbol: string; shares: number; price: number }[]>([]);
    const [portfolioLoading, setPortfolioLoading] = useState(false);

    useEffect(() => {
        const stored = sessionStorage.getItem("recommendations");
        if (stored) {
            const data = JSON.parse(stored);
            setProfile(data.profile);
            setRecommendations(data.recommendations || []);
            setProjections(data.projections || null);
            setCurrency(data.currency || "USD");
            setCurrencySymbol(data.currencySymbol || "$");
            setInitialCapital(data.initialCapital || 0);
            setMonthlyContribution(data.monthlyContribution || 0);
            setIsProfessional(data.isProfessional || false);
            sessionStorage.removeItem("recommendations");
        }
        setLoading(false);
    }, []);

    function getRiskColor(risk: string): string {
        const riskLower = risk.toLowerCase();
        if (riskLower.includes("low") || riskLower.includes("conservative")) return "var(--accent)";
        if (riskLower.includes("medium") || riskLower.includes("moderate")) return "#f59e0b";
        if (riskLower.includes("high") || riskLower.includes("aggressive")) return "#ef4444";
        return "var(--text-secondary)";
    }

    function formatCurrency(value: number): string {
        return `${currencySymbol}${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }

    async function handleSendMessage() {
        if (!chatInput.trim()) return;

        const userMessage = chatInput;
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setChatInput("");
        setChatLoading(true);

        try {
            const response = await fetch("/api/stock-chatbot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    stocks: recommendations.map(r => r.symbol),
                }),
            });

            if (!response.ok) throw new Error("Failed to get response");

            const data = await response.json();
            setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process that question. Please ask about the recommended stocks." }]);
        } finally {
            setChatLoading(false);
        }
    }

    function openPortfolioModal() {
        // Initialize portfolio with equal distribution
        const capitalPerStock = initialCapital / recommendations.length;
        const stocks = recommendations.map(rec => ({
            symbol: rec.symbol,
            shares: Math.floor(capitalPerStock / 100), // Approximate shares (assuming $100 per share)
            price: 100, // Default price, will be updated with real price
        }));
        setPortfolioStocks(stocks);
        setShowPortfolioModal(true);
    }

    async function savePortfolioToSupabase() {
        try {
            setPortfolioLoading(true);
            
            // Get current user
            const { getCurrentUser } = await import("@/lib/supabase");
            const user = await getCurrentUser();
            
            if (!user) {
                alert("Please log in to add to portfolio");
                router.push("/login");
                return;
            }

            // Save each stock to portfolio
            for (const stock of portfolioStocks) {
                await fetch("/api/portfolio", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_id: user.id,
                        stock_symbol: stock.symbol,
                        shares: stock.shares,
                        bought_price: stock.price,
                    }),
                });
            }

            alert("Portfolio saved successfully!");
            setShowPortfolioModal(false);
            router.push("/portfolio");
        } catch (error) {
            alert("Error saving portfolio: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setPortfolioLoading(false);
        }
    }

    function updatePortfolioStock(index: number, shares: number) {
        const updated = [...portfolioStocks];
        updated[index].shares = shares;
        setPortfolioStocks(updated);
    }
    function ProjectionChart({ data, title, height = 400 }: { data: ProjectionPoint[] | undefined; title: string; height?: number }) {
        if (!data || data.length === 0) return null;

        const maxAmount = Math.max(...data.map((p) => p.amount));
        const padding = 100;
        const chartWidth = 600;
        const chartHeight = height;

        // Calculate total contributed at each year (initialCapital + monthlyContribution * 12 * year)
        const contributedPoints = data.map((p) => {
            const totalContributed = initialCapital + monthlyContribution * 12 * p.year;
            return { x: padding + (p.year / (data.length - 1)) * (chartWidth - padding * 2), year: p.year, amount: totalContributed };
        });

        // Calculate points for initial investment (flat line)
        const initialPoints = data.map((p) => ({
            x: padding + (p.year / (data.length - 1)) * (chartWidth - padding * 2),
            year: p.year,
            amount: initialCapital,
        }));

        // Calculate total amount points (which includes market gains)
        const totalPoints = data.map((p) => ({
            x: padding + (p.year / (data.length - 1)) * (chartWidth - padding * 2),
            year: p.year,
            amount: p.amount,
        }));

        const scaleY = (amount: number) => chartHeight - padding - ((amount - initialCapital) / (maxAmount - initialCapital)) * (chartHeight - padding * 2);

        const createPathData = (points: typeof initialPoints) =>
            points.map((p, i) => (i === 0 ? `M ${p.x} ${scaleY(p.amount)}` : `L ${p.x} ${scaleY(p.amount)}`)).join(" ");

        const initialPath = createPathData(initialPoints);
        const contributedPath = createPathData(contributedPoints);
        const totalPath = createPathData(totalPoints);

        return (
            <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "center" }}>
                <div style={{ 
                    width: "100%", 
                    maxWidth: "950px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderLeft: "4px solid var(--accent)",
                    borderRadius: "var(--radius-md)",
                    padding: "2.5rem",
                    boxShadow: "var(--shadow-sm)"
                }}>
                    <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-h)" }}>
                        {title}
                    </h4>
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: "100%", height: "280px", display: "block" }}>
                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                            const y = chartHeight - padding - ratio * (chartHeight - padding * 2);
                            const amount = initialCapital + ratio * (maxAmount - initialCapital);
                            return (
                                <g key={`grid-${ratio}`}>
                                    <line x1={padding} y1={y} x2={chartWidth} y2={y} stroke="var(--border)" strokeDasharray="4" opacity="0.5" />
                                    <text x={padding - 10} y={y + 4} fontSize="12" fill="var(--text-muted)" textAnchor="end">
                                        {formatCurrency(amount)}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Lines */}
                        <path d={initialPath} stroke="#8b5cf6" strokeWidth="2.5" fill="none" />
                        <path d={contributedPath} stroke="#f59e0b" strokeWidth="2.5" fill="none" />
                        <path d={totalPath} stroke="#10b981" strokeWidth="2.5" fill="none" />

                        {/* Points on total amount line */}
                        {totalPoints.map((p, i) => (
                            <g key={`point-${i}`}>
                                <circle cx={p.x} cy={scaleY(p.amount)} r="4" fill="#10b981" />
                                <text x={p.x} y={chartHeight - padding / 2} fontSize="12" fill="var(--text-muted)" textAnchor="middle">
                                    {p.year}y
                                </text>
                            </g>
                        ))}

                        {/* Axes */}
                        <line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} stroke="var(--border)" strokeWidth="1.5" />
                        <line x1={padding} y1={chartHeight - padding} x2={chartWidth} y2={chartHeight - padding} stroke="var(--border)" strokeWidth="1.5" />
                    </svg>

                    {/* Legend - Below chart */}
                    <div style={{ marginTop: "1rem", display: "flex", gap: "2rem", justifyContent: "center", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ width: "20px", height: "2px", background: "#8b5cf6" }}></div>
                            <span style={{ fontSize: "0.9rem", color: "var(--text-body)" }}>Starting Amount</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ width: "20px", height: "2px", background: "#f59e0b" }}></div>
                            <span style={{ fontSize: "0.9rem", color: "var(--text-body)" }}>Total Invested</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ width: "20px", height: "2px", background: "#10b981" }}></div>
                            <span style={{ fontSize: "0.9rem", color: "var(--text-body)" }}>Total Value</span>
                        </div>
                    </div>

                    {data[data.length - 1] && (
                        <div style={{ marginTop: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                            <div style={{ padding: "1rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }}>
                                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>Starting Amount</p>
                                <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "#8b5cf6", margin: "0.5rem 0 0 0" }}>
                                    {formatCurrency(initialCapital)}
                                </p>
                            </div>
                            <div style={{ padding: "1rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }}>
                                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>Monthly Investment ({data[data.length - 1].year} {data[data.length - 1].year === 1 ? "year" : "years"})</p>
                                <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "#f59e0b", margin: "0.5rem 0 0 0" }}>
                                    {formatCurrency(monthlyContribution * 12 * data[data.length - 1].year)}
                                </p>
                            </div>
                            <div style={{ padding: "1rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }}>
                                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>Investment Growth</p>
                                <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "#10b981", margin: "0.5rem 0 0 0" }}>
                                    {formatCurrency(data[data.length - 1].growth - (monthlyContribution * 12 * data[data.length - 1].year))}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (loading) {
        return <div className="container"><div className="spinner" /></div>;
    }

    if (!profile) {
        return (
            <div className="container" style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <p style={{ color: "var(--text-muted)" }}>No profile data found. Please complete the questionnaire first.</p>
                <button onClick={() => router.push("/")} style={{
                    marginTop: "1rem", padding: "0.75rem 1.5rem", background: "var(--accent)",
                    color: "white", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer",
                    fontSize: "0.95rem", fontWeight: 600,
                }}>
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="page-header" style={{ background: isProfessional ? "linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(59,130,246,0.1) 100%)" : "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.1) 100%)" }}>
                <h1>{isProfessional ? "Investment Projections & Recommended Stocks" : "Your Personalized Investment Profile"}</h1>
                <p>{isProfessional
                    ? `Invest ${formatCurrency(initialCapital)} with ${monthlyContribution > 0 ? formatCurrency(monthlyContribution) + "/month SIP" : "no monthly SIP"}`
                    : "Based on your answers, here are AI-powered stock recommendations tailored to your goals."
                }</p>
            </div>

            <div className="container" style={{ paddingBottom: "4rem" }}>
                {/* SIP Calculator Summary (Professional Only) */}
                {isProfessional && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
                        <div className="card" style={{ background: "var(--bg-secondary)" }}>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Initial Capital</p>
                            <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent)" }}>{formatCurrency(initialCapital)}</p>
                        </div>
                        <div className="card" style={{ background: "var(--bg-secondary)" }}>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Monthly SIP</p>
                            <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent)" }}>
                                {monthlyContribution > 0 ? formatCurrency(monthlyContribution) : "No SIP"}
                            </p>
                        </div>
                    </div>
                )}

                {/* Investment Projections (Professional Only) */}
                {isProfessional && projections && (
                    <div style={{ marginBottom: "3rem", padding: "2rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)" }}>
                        <h2 style={{ fontSize: "1.3rem", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            📊 Investment Growth Projections
                        </h2>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
                            {projections.year1 && (
                                <div className="card" style={{ borderLeft: "4px solid var(--accent)" }}>
                                    <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-muted)", margin: "0 0 1rem 0" }}>
                                        1-Year Projection
                                    </h4>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                                        <div>
                                            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0, textTransform: "uppercase" }}>Final Amount</p>
                                            <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--accent)", margin: "0.25rem 0 0 0" }}>
                                                {formatCurrency(projections.year1.amount)}
                                            </p>
                                        </div>
                                        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.8rem" }}>
                                            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0, marginBottom: "0.3rem" }}>Starting Amount</p>
                                            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: 0, fontWeight: 600 }}>
                                                {formatCurrency(initialCapital)}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0, marginBottom: "0.3rem" }}>Monthly Investment (12 months)</p>
                                            <p style={{ color: "#f59e0b", fontSize: "0.95rem", margin: 0, fontWeight: 600 }}>
                                                {formatCurrency(monthlyContribution * 12)}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0, marginBottom: "0.3rem" }}>Investment Growth</p>
                                            <p style={{ color: "#10b981", fontSize: "0.95rem", margin: 0, fontWeight: 600 }}>
                                                {formatCurrency(projections.year1.growth - (monthlyContribution * 12))}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {projections.year5 && (
                                <div className="card" style={{ borderLeft: "4px solid #8b5cf6" }}>
                                    <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-muted)", margin: "0 0 1rem 0" }}>
                                        5-Year Projection
                                    </h4>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                                        <div>
                                            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0, textTransform: "uppercase" }}>Final Amount</p>
                                            <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "#8b5cf6", margin: "0.25rem 0 0 0" }}>
                                                {formatCurrency(projections.year5.amount)}
                                            </p>
                                        </div>
                                        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.8rem" }}>
                                            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0, marginBottom: "0.3rem" }}>Starting Amount</p>
                                            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: 0, fontWeight: 600 }}>
                                                {formatCurrency(initialCapital)}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0, marginBottom: "0.3rem" }}>Monthly Investment (60 months)</p>
                                            <p style={{ color: "#f59e0b", fontSize: "0.95rem", margin: 0, fontWeight: 600 }}>
                                                {formatCurrency(monthlyContribution * 12 * 5)}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0, marginBottom: "0.3rem" }}>Investment Growth</p>
                                            <p style={{ color: "#10b981", fontSize: "0.95rem", margin: 0, fontWeight: 600 }}>
                                                {formatCurrency(projections.year5.growth - (monthlyContribution * 12 * 5))}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {projections.year10 && (
                                <div className="card" style={{ borderLeft: "4px solid #f59e0b" }}>
                                    <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-muted)", margin: "0 0 1rem 0" }}>
                                        10-Year Projection
                                    </h4>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                                        <div>
                                            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0, textTransform: "uppercase" }}>Final Amount</p>
                                            <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "#f59e0b", margin: "0.25rem 0 0 0" }}>
                                                {formatCurrency(projections.year10.amount)}
                                            </p>
                                        </div>
                                        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.8rem" }}>
                                            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0, marginBottom: "0.3rem" }}>Starting Amount</p>
                                            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: 0, fontWeight: 600 }}>
                                                {formatCurrency(initialCapital)}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0, marginBottom: "0.3rem" }}>Monthly Investment (120 months)</p>
                                            <p style={{ color: "#f59e0b", fontSize: "0.95rem", margin: 0, fontWeight: 600 }}>
                                                {formatCurrency(monthlyContribution * 12 * 10)}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0, marginBottom: "0.3rem" }}>Investment Growth</p>
                                            <p style={{ color: "#10b981", fontSize: "0.95rem", margin: 0, fontWeight: 600 }}>
                                                {formatCurrency(projections.year10.growth - (monthlyContribution * 12 * 10))}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {projections.year15 && (
                                <div className="card" style={{ borderLeft: "4px solid #10b981" }}>
                                    <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-muted)", margin: "0 0 1rem 0" }}>
                                        15-Year Projection
                                    </h4>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                                        <div>
                                            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0, textTransform: "uppercase" }}>Final Amount</p>
                                            <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "#10b981", margin: "0.25rem 0 0 0" }}>
                                                {formatCurrency(projections.year15.amount)}
                                            </p>
                                        </div>
                                        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.8rem" }}>
                                            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0, marginBottom: "0.3rem" }}>Starting Amount</p>
                                            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: 0, fontWeight: 600 }}>
                                                {formatCurrency(initialCapital)}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0, marginBottom: "0.3rem" }}>Monthly Investment (180 months)</p>
                                            <p style={{ color: "#f59e0b", fontSize: "0.95rem", margin: 0, fontWeight: 600 }}>
                                                {formatCurrency(monthlyContribution * 12 * 15)}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0, marginBottom: "0.3rem" }}>Investment Growth</p>
                                            <p style={{ color: "#10b981", fontSize: "0.95rem", margin: 0, fontWeight: 600 }}>
                                                {formatCurrency(projections.year15.growth - (monthlyContribution * 12 * 15))}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Charts */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
                            {projections.all1yr && <ProjectionChart data={projections.all1yr} title="1-Year Growth" height={250} />}
                            {projections.all5yr && <ProjectionChart data={projections.all5yr} title="5-Year Growth" height={250} />}
                            {projections.all10yr && <ProjectionChart data={projections.all10yr} title="10-Year Growth" height={250} />}
                            {projections.all15yr && <ProjectionChart data={projections.all15yr} title="15-Year Growth" height={250} />}
                        </div>
                    </div>
                )}

                {/* Recommendations */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <h2 style={{ fontSize: "1.3rem", marginBottom: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <TrendingUp size={24} style={{ color: "var(--accent)" }} />
                        {isProfessional ? "Recommended Stocks" : "AI-Powered Stock Picks"}
                    </h2>
                    {isProfessional && recommendations.length > 0 && (
                        <button 
                            onClick={openPortfolioModal}
                            style={{
                                padding: "0.75rem 1.5rem",
                                background: "var(--accent)",
                                color: "white",
                                border: "none",
                                borderRadius: "var(--radius-md)",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: "0.95rem",
                                whiteSpace: "nowrap"
                            }}
                        >
                            + Add to Portfolio
                        </button>
                    )}
                </div>

                {recommendations.length > 0 ? (
                    <div style={{ display: "grid", gap: "1.25rem", marginBottom: "2rem" }}>
                        {recommendations.map((rec, idx) => (
                            <div key={idx} className="card" style={{
                                borderLeft: `4px solid ${getRiskColor(rec.risk)}`,
                                borderRadius: "var(--radius-md)",
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                                    <div>
                                        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--blue)", marginBottom: "0.5rem" }}>
                                            {rec.symbol}
                                        </h3>
                                        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.85rem" }}>
                                            <span><strong>Score:</strong> <span style={{ marginLeft: "0.5rem", color: "var(--accent)", fontWeight: 600 }}>{rec.score}/10</span></span>
                                            <span><strong>Risk:</strong> <span style={{ marginLeft: "0.5rem", color: getRiskColor(rec.risk), fontWeight: 600 }}>{rec.risk}</span></span>
                                            {rec.expectedCAGR && <span><strong>CAGR:</strong> <span style={{ marginLeft: "0.5rem", color: "var(--accent)", fontWeight: 600 }}>{rec.expectedCAGR}</span></span>}
                                            {rec.dividendYield && <span><strong>Dividend:</strong> <span style={{ marginLeft: "0.5rem", color: "var(--accent)", fontWeight: 600 }}>{rec.dividendYield}</span></span>}
                                        </div>
                                    </div>
                                    <div style={{ padding: "0.5rem 1rem", background: "rgba(59, 130, 246, 0.1)", borderRadius: "var(--radius-md)" }}>
                                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Score</p>
                                        <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent)" }}>{Math.round(rec.score * 10)}%</p>
                                    </div>
                                </div>
                                <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                                    {rec.rationale || rec.reasoning}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: "var(--radius-md)", padding: "1.5rem", textAlign: "center", color: "var(--text-secondary)", marginBottom: "2rem" }}>
                        <AlertCircle size={24} style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
                        <p>Unable to generate recommendations. Please try again.</p>
                    </div>
                )}

                {/* Chatbot Section */}
                {isProfessional && (
                    <div style={{ marginBottom: "2rem", padding: "2rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)" }}>
                        <h2 style={{ fontSize: "1.3rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            💬 Stock Q&A Chatbot
                        </h2>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1rem" }}>
                            Ask questions about the recommended stocks. The chatbot will provide insights based on the recommended companies.
                        </p>

                        {/* Chat Messages */}
                        <div style={{
                            background: "var(--bg-primary)",
                            borderRadius: "var(--radius-md)",
                            padding: "1rem",
                            marginBottom: "1rem",
                            height: "300px",
                            overflowY: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: "1rem",
                            border: "1px solid var(--border)",
                        }}>
                            {messages.length === 0 ? (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)" }}>
                                    <p>Ask a question about {recommendations.length > 0 ? recommendations.map(r => r.symbol).join(", ") : "the recommended stocks"}</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div key={idx} style={{
                                        display: "flex",
                                        justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                                    }}>
                                        <div style={{
                                            maxWidth: "70%",
                                            padding: "0.75rem 1rem",
                                            borderRadius: "var(--radius-md)",
                                            background: msg.role === "user" ? "var(--accent)" : "var(--bg-secondary)",
                                            color: msg.role === "user" ? "white" : "var(--text-primary)",
                                        }}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))
                            )}
                            {chatLoading && <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Thinking...</div>}
                        </div>

                        {/* Chat Input */}
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                                placeholder="Ask about the recommended stocks..."
                                disabled={chatLoading}
                                style={{
                                    flex: 1,
                                    padding: "0.75rem",
                                    border: "2px solid var(--border)",
                                    borderRadius: "var(--radius-md)",
                                    background: "var(--bg-primary)",
                                    color: "var(--text-primary)",
                                    fontSize: "0.95rem",
                                }}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={chatLoading || !chatInput.trim()}
                                style={{
                                    padding: "0.75rem 1.5rem",
                                    background: chatLoading || !chatInput.trim() ? "var(--bg-secondary)" : "var(--accent)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "var(--radius-md)",
                                    cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer",
                                    fontWeight: 600,
                                }}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                    <button onClick={() => router.push("/")} style={{
                        padding: "0.75rem 1.5rem", background: "transparent", color: "var(--accent)",
                        border: "2px solid var(--accent)", borderRadius: "var(--radius-md)", cursor: "pointer",
                        fontSize: "0.95rem", fontWeight: 600,
                    }}>
                        Back to Home
                    </button>
                </div>
            </div>

            {/* Portfolio Modal */}
            {showPortfolioModal && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                    padding: "1rem"
                }}>
                    <div style={{
                        background: "var(--bg-card)",
                        borderRadius: "var(--radius-md)",
                        padding: "2rem",
                        maxWidth: "500px",
                        width: "100%",
                        maxHeight: "80vh",
                        overflowY: "auto",
                        border: "1px solid var(--border)"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                            <h3 style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0 }}>Configure Portfolio</h3>
                            <button
                                onClick={() => setShowPortfolioModal(false)}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    fontSize: "1.5rem",
                                    cursor: "pointer",
                                    color: "var(--text-muted)"
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                            Distribute {formatCurrency(initialCapital)} equally among {portfolioStocks.length} stocks. Edit quantities as needed:
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "1.5rem" }}>
                            {portfolioStocks.map((stock, idx) => (
                                <div key={idx} style={{ padding: "1rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }}>
                                    <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-h)", marginBottom: "0.5rem" }}>
                                        {stock.symbol}
                                    </p>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                        <label style={{ color: "var(--text-secondary)", fontSize: "0.9rem", minWidth: "60px" }}>
                                            Shares:
                                        </label>
                                        <input
                                            type="number"
                                            value={stock.shares}
                                            onChange={(e) => updatePortfolioStock(idx, parseInt(e.target.value) || 0)}
                                            style={{
                                                padding: "0.5rem",
                                                border: "1px solid var(--border)",
                                                borderRadius: "var(--radius-sm)",
                                                background: "var(--bg-card)",
                                                color: "var(--text-body)",
                                                fontSize: "0.95rem",
                                                flex: 1
                                            }}
                                        />
                                    </div>
                                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                                        Investment: {formatCurrency(stock.shares * stock.price)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                            <strong>Total Investment:</strong> {formatCurrency(portfolioStocks.reduce((sum, s) => sum + (s.shares * s.price), 0))}
                        </p>

                        <div style={{ display: "flex", gap: "1rem" }}>
                            <button
                                onClick={savePortfolioToSupabase}
                                disabled={portfolioLoading}
                                style={{
                                    flex: 1,
                                    padding: "0.75rem",
                                    background: "var(--accent)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "var(--radius-md)",
                                    cursor: portfolioLoading ? "not-allowed" : "pointer",
                                    fontWeight: 600,
                                    opacity: portfolioLoading ? 0.6 : 1
                                }}
                            >
                                {portfolioLoading ? "Saving..." : "Save to Portfolio"}
                            </button>
                            <button
                                onClick={() => setShowPortfolioModal(false)}
                                style={{
                                    flex: 1,
                                    padding: "0.75rem",
                                    background: "transparent",
                                    color: "var(--accent)",
                                    border: "2px solid var(--accent)",
                                    borderRadius: "var(--radius-md)",
                                    cursor: "pointer",
                                    fontWeight: 600
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
