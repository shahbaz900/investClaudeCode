/**
 * Mock/demo data — used when API keys are not configured.
 * The app will automatically fall back to this data.
 */

import type { Recommendation } from "./api";

export const DEMO_RECOMMENDATIONS: Recommendation[] = [
    {
        symbol: "AAPL",
        company: "Apple Inc.",
        score: 9.0,
        growth_score: 8.5,
        risk_level: "Low",
        reasoning: [
            "Strong revenue growth (8%)",
            "Low debt-to-equity ratio (1.8)",
            "PE ratio of 28 — reasonably valued",
        ],
    },
    {
        symbol: "MSFT",
        company: "Microsoft Corp.",
        score: 8.7,
        growth_score: 9.0,
        risk_level: "Low",
        reasoning: [
            "Solid earnings growth driven by Azure",
            "Diversified business model (cloud, Office, gaming)",
            "PE ratio of 34 — premium justified by growth",
        ],
    },
    {
        symbol: "NVDA",
        company: "NVIDIA Corporation",
        score: 8.2,
        growth_score: 9.5,
        risk_level: "Medium",
        reasoning: [
            "AI chip market leader — 122% revenue growth",
            "Strong data center demand outlook",
            "Higher PE reflects growth premium",
        ],
    },
];

export const DEMO_RECOMMENDATIONS_PK: Recommendation[] = [
    {
        symbol: "ENGRO",
        company: "Engro Corporation",
        score: 8.2,
        growth_score: 7.5,
        risk_level: "Medium",
        reasoning: ["Leading conglomerate in Pakistan", "Stable dividends", "Strong market position"],
    },
    {
        symbol: "HBL",
        company: "Habib Bank Limited",
        score: 7.8,
        growth_score: 7.0,
        risk_level: "Medium",
        reasoning: ["Largest bank in Pakistan by assets", "Growing retail banking segment", "Improving NIM"],
    },
    {
        symbol: "PSO",
        company: "Pakistan State Oil",
        score: 7.2,
        growth_score: 6.0,
        risk_level: "Medium",
        reasoning: ["Market leader in fuel distribution", "Consistent dividend history", "Defensive sector"],
    },
];

/** Pick demo recs based on country */
export function getDemoRecommendations(country: string): Recommendation[] {
    if (country === "PK") return DEMO_RECOMMENDATIONS_PK;
    return DEMO_RECOMMENDATIONS;
}

/** Check if Supabase env vars are set */
export function isSupabaseConfigured(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    return url.startsWith("https://") && key.length > 20;
}

/** Check if AI backend URL is set (non-localhost implies production) */
export function isAIBackendConfigured(): boolean {
    const url = process.env.NEXT_PUBLIC_AI_BACKEND_URL ?? "";
    // localhost is fine during dev, but if it returns an error we catch it
    return url.length > 0;
}
