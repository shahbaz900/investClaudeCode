import { NextRequest, NextResponse } from "next/server";
import { getPortfolio, upsertPortfolioEntry, deletePortfolioEntry } from "@/lib/supabase";

export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get("user_id");
    if (!userId) return NextResponse.json({ error: "user_id required" }, { status: 400 });
    try {
        const data = await getPortfolio(userId);
        return NextResponse.json({ portfolio: data });
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "DB error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { user_id, stock_symbol, shares, bought_price } = body;
        if (!user_id || !stock_symbol || shares == null || bought_price == null) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        await upsertPortfolioEntry({ user_id, stock_symbol, shares: +shares, bought_price: +bought_price });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "DB error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { user_id, stock_symbol } = await req.json();
        if (!user_id || !stock_symbol) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        await deletePortfolioEntry(user_id, stock_symbol);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "DB error" }, { status: 500 });
    }
}
