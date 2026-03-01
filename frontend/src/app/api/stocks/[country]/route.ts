import { NextRequest, NextResponse } from "next/server";
import { getStocksByCountry } from "@/lib/supabase";

export async function GET(
    req: NextRequest,
    { params }: { params: { country: string } }
) {
    const country = params.country.toUpperCase();
    if (!/^[A-Z]{2}$/.test(country)) {
        return NextResponse.json({ error: "Invalid country code" }, { status: 400 });
    }

    try {
        const stocks = await getStocksByCountry(country);
        return NextResponse.json({ country, count: stocks.length, stocks });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Database error" },
            { status: 500 }
        );
    }
}
