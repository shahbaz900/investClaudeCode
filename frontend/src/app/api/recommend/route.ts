import { NextRequest, NextResponse } from "next/server";
import { getCachedResponse, setCachedResponse, getStocksByCountry } from "@/lib/supabase";
import { fetchRecommendations } from "@/lib/api";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { query, country, specific_symbol } = body as {
            query: string;
            country: string;
            specific_symbol?: string;
        };

        if (!query || !country) {
            return NextResponse.json({ error: "query and country are required" }, { status: 400 });
        }

        const isSpecific = !!specific_symbol || /^[A-Z]{1,5}$/.test(query.trim().toUpperCase());

        // Cache check for general queries
        if (!isSpecific) {
            const cached = await getCachedResponse(country, query);
            if (cached) {
                return NextResponse.json({ ...cached.ai_response, from_cache: true });
            }
        }

        // Fetch pre-seeded stocks for general queries
        let stocks = undefined;
        if (!isSpecific) {
            try { stocks = await getStocksByCountry(country); } catch { /* ignore */ }
        }

        const payload = {
            query,
            country,
            stocks: stocks?.length ? stocks : undefined,
            specific_symbol: isSpecific ? (specific_symbol ?? query.trim().toUpperCase()) : undefined,
        };

        const result = await fetchRecommendations(payload);

        // Cache general responses
        if (!isSpecific) {
            await setCachedResponse(country, query, result as unknown as Record<string, unknown>);
        }

        return NextResponse.json(result);
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Internal error" },
            { status: 500 }
        );
    }
}
