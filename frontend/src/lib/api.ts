/**
 * API client for the FastAPI AI backend.
 */

const AI_BACKEND_URL =
    process.env.NEXT_PUBLIC_AI_BACKEND_URL || "http://localhost:8000";

export interface StockInput {
    symbol: string;
    company?: string;
    sector?: string;
    pe_ratio?: number;
    revenue_growth?: number;
    debt_equity?: number;
    market_cap?: number;
    country?: string;
}

export interface Recommendation {
    symbol: string;
    company: string;
    score: number;
    reasoning: string[];
    risk_level: "Low" | "Medium" | "High";
    growth_score: number;
}

export interface RecommendResponse {
    recommendations: Recommendation[];
    query_type: "general" | "specific";
    country: string;
}

export interface RecommendPayload {
    query: string;
    country: string;
    stocks?: StockInput[];
    specific_symbol?: string;
}

export interface DiscussRequest {
    recommendations: Recommendation[];
    question: string;
    country: string;
}

export interface DiscussResponse {
    response: string;
    question: string;
}

export interface StockPriceResponse {
    symbol: string;
    current_price: number;
    currency: string;
    status: string;
}

export async function fetchRecommendations(
    payload: RecommendPayload
): Promise<RecommendResponse> {
    const res = await fetch(`${AI_BACKEND_URL}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`AI backend error (${res.status}): ${errText}`);
    }

    return res.json();
}

export async function fetchDiscussion(
    payload: DiscussRequest
): Promise<DiscussResponse> {
    const res = await fetch(`${AI_BACKEND_URL}/discuss`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`AI backend error (${res.status}): ${errText}`);
    }

    return res.json();
}

export async function fetchStockPrice(symbol: string): Promise<StockPriceResponse> {
    const res = await fetch(`${AI_BACKEND_URL}/price/${symbol}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to fetch price for ${symbol}: ${errText}`);
    }

    return res.json();
}

/** Detect the user's country code via browser geolocation + IP fallback */
export async function detectCountry(): Promise<string> {
    try {
        const res = await fetch("https://ipapi.co/json/");
        if (res.ok) {
            const data = await res.json();
            if (data.country_code) return data.country_code as string;
        }
    } catch {
        // Fallback to US
    }
    return "US";
}

/** Map a risk level string to a CSS badge class */
export function riskBadgeClass(risk: string): string {
    switch (risk) {
        case "Low": return "badge-green";
        case "Medium": return "badge-yellow";
        case "High": return "badge-red";
        default: return "badge-purple";
    }
}
