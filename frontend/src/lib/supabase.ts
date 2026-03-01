import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ── Lazy client: only initializes when env vars are present ────────────────────
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
    if (_client) return _client;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    if (!url.startsWith("https://") || key.length < 20) return null;
    _client = createClient(url, key);
    return _client;
}

// ── Auth Helpers ────────────────────────────────────────────────────────────────

export async function getCurrentUser() {
    const client = getClient();
    if (!client) return null;

    try {
        const { data: { user }, error } = await client.auth.getUser();
        if (error) throw error;
        return user;
    } catch (err) {
        console.error("Failed to get current user:", err);
        return null;
    }
}

export async function signUp(email: string, password: string) {
    const client = getClient();
    if (!client) throw new Error("Supabase not configured");

    const { data, error } = await client.auth.signUp({
        email,
        password,
    });

    if (error) throw error;
    return data;
}

export async function signIn(email: string, password: string) {
    const client = getClient();
    if (!client) throw new Error("Supabase not configured");

    const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;
    return data;
}

export async function signOut() {
    const client = getClient();
    if (!client) throw new Error("Supabase not configured");

    const { error } = await client.auth.signOut();
    if (error) throw error;
}

// ── Database Types ──────────────────────────────────────────────────────────────

export interface Stock {
    id?: string;
    symbol: string;
    company?: string;
    country: string;
    sector?: string;
    pe_ratio?: number;
    revenue_growth?: number;
    debt_equity?: number;
    market_cap?: number;
    last_updated?: string;
}

export interface PortfolioEntry {
    id?: string;
    user_id: string;
    stock_symbol: string;
    shares: number;
    bought_price: number;
    created_at?: string;
    updated_at?: string;
}

export interface AiCacheEntry {
    id?: string;
    country: string;
    query: string;
    ai_response: Record<string, unknown>;
    hits?: number;
    last_updated?: string;
}

// ── Stock Helpers ───────────────────────────────────────────────────────────────

/** Fetch stocks for a given country code (e.g. "US", "PK") */
export async function getStocksByCountry(country: string): Promise<Stock[]> {
    const client = getClient();
    if (!client) return [];

    const { data, error } = await client
        .from("stocks")
        .select("*")
        .eq("country", country.toUpperCase())
        .order("market_cap", { ascending: false })
        .limit(20);

    if (error) throw error;
    return data ?? [];
}

// ── AI Cache Helpers ────────────────────────────────────────────────────────────

/** Check if a cached AI response exists (within 24h) */
export async function getCachedResponse(
    country: string,
    query: string
): Promise<AiCacheEntry | null> {
    const client = getClient();
    if (!client) return null;

    const normalizedQuery = query.toLowerCase().trim();
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await client
        .from("ai_cache")
        .select("*")
        .eq("country", country.toUpperCase())
        .eq("query", normalizedQuery)
        .gte("last_updated", cutoff)
        .single();

    if (error || !data) return null;

    // Increment hit counter in background
    client
        .from("ai_cache")
        .update({ hits: (data.hits ?? 1) + 1 })
        .eq("id", data.id)
        .then(() => { });

    return data;
}

/** Save an AI response to cache */
export async function setCachedResponse(
    country: string,
    query: string,
    aiResponse: Record<string, unknown>
): Promise<void> {
    const client = getClient();
    if (!client) return;

    const normalizedQuery = query.toLowerCase().trim();
    await client.from("ai_cache").upsert(
        {
            country: country.toUpperCase(),
            query: normalizedQuery,
            ai_response: aiResponse,
            last_updated: new Date().toISOString(),
            hits: 1,
        },
        { onConflict: "country,query" }
    );
}

// ── Portfolio Helpers ───────────────────────────────────────────────────────────

export async function getPortfolio(userId: string): Promise<PortfolioEntry[]> {
    const client = getClient();
    if (!client) return [];

    const { data, error } = await client
        .from("portfolio")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
}

export async function upsertPortfolioEntry(
    entry: Omit<PortfolioEntry, "id" | "created_at" | "updated_at">
): Promise<void> {
    const client = getClient();
    if (!client) return;

    const { error } = await client
        .from("portfolio")
        .upsert(entry, { onConflict: "user_id,stock_symbol" });
    if (error) throw error;
}

export async function deletePortfolioEntry(
    userId: string,
    symbol: string
): Promise<void> {
    const client = getClient();
    if (!client) return;

    const { error } = await client
        .from("portfolio")
        .delete()
        .eq("user_id", userId)
        .eq("stock_symbol", symbol);
    if (error) throw error;
}
