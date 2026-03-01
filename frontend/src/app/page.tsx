"use client";
import Link from "next/link";

export default function HomePage() {
    return (
        <>
            {/* ── Hero Section ─────────────────────────────────────────────── */}
            <section className="hero">
                <div className="hero-content">
                    <h1>Find the Best Stocks for You</h1>
                    <p>Personalized AI-powered recommendations based on your profile and goals.</p>

                    {/* ── AI Investment Planner ─────────────────────────── */}
                    <div style={{
                        display: "flex",
                        maxWidth: "500px",
                        margin: "2.5rem auto 0",
                    }}>
                        {/* AI Investment Planner */}
                        <Link href="/questionnaire/professional" style={{ textDecoration: "none", width: "100%" }}>
                            <div style={{
                                background: "linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(139,92,246,0.05) 100%)",
                                border: "2px solid rgba(59, 130, 246, 0.3)",
                                borderRadius: "var(--radius-lg)",
                                padding: "2rem",
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                gap: "1rem",
                                position: "relative",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "var(--accent)";
                                e.currentTarget.style.boxShadow = "0 8px 24px rgba(59, 130, 246, 0.25)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.3)";
                                e.currentTarget.style.boxShadow = "none";
                            }}>
                                <div style={{ fontSize: "2.5rem" }}>🤖</div>
                                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-h)", margin: 0 }}>
                                    AI Investment Planner
                                </h3>
                                <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.95rem", flex: 1 }}>
                                    Whether you're just starting or have experience, get personalized investment plans and see your potential returns.
                                </p>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    color: "var(--accent)",
                                    fontWeight: 600,
                                    fontSize: "0.95rem",
                                }}>
                                    Start Now →
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* City skyline SVG */}
                <svg className="city-bg" viewBox="0 0 1440 200" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
                    <g fill="#b3d4e8" opacity="0.6">
                        {/* Buildings */}
                        <rect x="0" y="120" width="60" height="80" />
                        <rect x="70" y="90" width="40" height="110" />
                        <rect x="80" y="70" width="20" height="20" />
                        <rect x="120" y="110" width="55" height="90" />
                        <rect x="185" y="80" width="30" height="120" />
                        <rect x="185" y="60" width="10" height="20" />
                        <rect x="225" y="100" width="50" height="100" />
                        <rect x="285" y="130" width="70" height="70" />
                        <rect x="365" y="85" width="35" height="115" />
                        <rect x="365" y="65" width="12" height="20" />
                        <rect x="410" y="110" width="60" height="90" />
                        <rect x="480" y="95" width="40" height="105" />
                        <rect x="530" y="120" width="80" height="80" />
                        <rect x="620" y="75" width="45" height="125" />
                        <rect x="620" y="50" width="15" height="25" />
                        <rect x="675" y="100" width="55" height="100" />
                        <rect x="740" y="130" width="70" height="70" />
                        <rect x="820" y="85" width="40" height="115" />
                        <rect x="870" y="105" width="60" height="95" />
                        <rect x="940" y="70" width="35" height="130" />
                        <rect x="940" y="48" width="12" height="22" />
                        <rect x="985" y="110" width="55" height="90" />
                        <rect x="1050" y="90" width="45" height="110" />
                        <rect x="1105" y="125" width="65" height="75" />
                        <rect x="1180" y="80" width="40" height="120" />
                        <rect x="1230" y="100" width="55" height="100" />
                        <rect x="1295" y="60" width="50" height="140" />
                        <rect x="1295" y="40" width="18" height="20" />
                        <rect x="1355" y="110" width="85" height="90" />
                    </g>
                    {/* Ground */}
                    <rect x="0" y="195" width="1440" height="5" fill="#b3d4e8" opacity="0.5" />
                </svg>

                {/* Stock chart arrow (left) */}
                <svg className="chart-bg" width="140" height="130" viewBox="0 0 140 130" fill="none">
                    <polyline points="10,110 35,80 60,90 85,50 110,30 135,10"
                        stroke="#27ae60" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <polygon points="125,5 140,20 130,8" fill="#27ae60" />
                    {/* Bars below */}
                    <rect x="10" y="115" width="14" height="10" fill="#27ae60" opacity="0.4" />
                    <rect x="28" y="105" width="14" height="20" fill="#27ae60" opacity="0.4" />
                    <rect x="46" y="100" width="14" height="25" fill="#27ae60" opacity="0.4" />
                    <rect x="64" y="90" width="14" height="35" fill="#27ae60" opacity="0.4" />
                    <rect x="82" y="80" width="14" height="45" fill="#27ae60" opacity="0.4" />
                </svg>
            </section>

            {/* ── Info Cards ─────────────────────────────────────────────── */}
            <div className="container" style={{ paddingBottom: "4rem", marginTop: "3rem" }}>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "1.5rem",
                    marginBottom: "3rem",
                }}>
                    <div className="card">
                        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📊</div>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>AI-Powered Analysis</h3>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Get personalized recommendations powered by Mistral Large</p>
                    </div>
                    <div className="card">
                        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💰</div>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Real-Time Pricing</h3>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Live stock prices from Finnhub across 15+ countries</p>
                    </div>
                    <div className="card">
                        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📈</div>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Projections</h3>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>See how your investments could grow over time</p>
                    </div>
                </div>

                {/* Portfolio CTA */}
                <div style={{
                    background: "var(--bg-secondary)",
                    borderRadius: "var(--radius-lg)",
                    padding: "2rem",
                    textAlign: "center",
                }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.75rem" }}>Track Your Portfolio</h3>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
                        Manage and monitor all your investments in one place.
                    </p>
                    <Link href="/portfolio" style={{
                        display: "inline-block",
                        padding: "0.75rem 1.5rem",
                        background: "var(--accent)",
                        color: "white",
                        borderRadius: "var(--radius-md)",
                        textDecoration: "none",
                        fontWeight: 600,
                        cursor: "pointer",
                    }}>
                        View Portfolio
                    </Link>
                </div>
            </div>
        </>
    );
}
