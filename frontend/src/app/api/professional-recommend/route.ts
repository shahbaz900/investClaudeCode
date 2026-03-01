import { NextRequest, NextResponse } from "next/server";

interface FormData {
    country: string;
    capitalMin: number;
    capitalMax: number;
    monthlyMin: number;
    monthlyMax: number;
    investmentExperience: string;
    investmentTimeframe: string;
    riskTolerance: string;
    investmentStrategy: string;
    currency: string;
    currencySymbol: string;
}

interface Projection {
    year: number;
    amount: number;
    growth: number;
}

// Historical annual returns for different risk profiles
const HISTORICAL_RETURNS = {
    "capital-preservation": 4.5,
    "moderate-growth": 7.5,
    "aggressive-growth": 10.5,
};

// Monthly return from annual return
function getMonthlyReturn(annualReturn: number): number {
    return Math.pow(1 + annualReturn / 100, 1 / 12) - 1;
}

// SIP calculator: calculates future value with regular monthly contributions
function calculateSIPProjections(
    initialCapital: number,
    monthlyContribution: number,
    annualReturn: number,
    years: number
): Projection[] {
    const projections: Projection[] = [];
    const monthlyReturn = getMonthlyReturn(annualReturn);
    let balance = initialCapital;

    for (let year = 0; year <= years; year++) {
        if (year === 0) {
            projections.push({ year: 0, amount: initialCapital, growth: 0 });
        } else {
            // Compound for 12 months in a year
            for (let month = 0; month < 12; month++) {
                balance = balance * (1 + monthlyReturn) + monthlyContribution;
            }
            const growth = balance - initialCapital;
            projections.push({ year, amount: balance, growth });
        }
    }

    return projections;
}

function getRiskProfile(riskTolerance: string): { risk: string; expectedReturn: number } {
    if (riskTolerance === "capital-preservation") {
        return { risk: "Conservative", expectedReturn: 4.5 };
    } else if (riskTolerance === "moderate-growth") {
        return { risk: "Moderate", expectedReturn: 7.5 };
    } else {
        return { risk: "Aggressive", expectedReturn: 10.5 };
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData: FormData = await request.json();
        
        console.log("[PROFESSIONAL-RECOMMEND] Received formData:", formData);
        
        if (!process.env.MISTRAL_API_KEY) {
            console.error("MISTRAL_API_KEY is not set in environment");
            return NextResponse.json(
                { error: "API key not configured. Please set MISTRAL_API_KEY in .env.local" },
                { status: 500 }
            );
        }

        if (!formData.country || formData.capitalMin === undefined || formData.capitalMin === null) {
            console.error("[PROFESSIONAL-RECOMMEND] Missing required fields:", { country: formData.country, capitalMin: formData.capitalMin });
            return NextResponse.json({ error: "Missing required fields: country and capitalMin" }, { status: 400 });
        }
        
        if (formData.capitalMin === 0 && formData.capitalMax === 0) {
            console.warn("[PROFESSIONAL-RECOMMEND] WARNING: Capital values are 0 - form may not have been filled properly");
        }

        // Use average of capital range or just the minimum if only one value given
        const initialCapital = formData.capitalMax > 0
            ? (formData.capitalMin + formData.capitalMax) / 2
            : formData.capitalMin;

        // Use average monthly contribution if range given
        const monthlyContribution = formData.monthlyMax > 0
            ? (formData.monthlyMin + formData.monthlyMax) / 2
            : formData.monthlyMin;

        // Get risk profile and expected returns
        const riskProfile = getRiskProfile(formData.riskTolerance);

        // Calculate SIP projections for 1, 5, 10, and 15 years
        const projections1yr = calculateSIPProjections(initialCapital, monthlyContribution, riskProfile.expectedReturn, 1);
        const projections5yr = calculateSIPProjections(initialCapital, monthlyContribution, riskProfile.expectedReturn, 5);
        const projections10yr = calculateSIPProjections(initialCapital, monthlyContribution, riskProfile.expectedReturn, 10);
        const projections15yr = calculateSIPProjections(initialCapital, monthlyContribution, riskProfile.expectedReturn, 15);

        // Create sophisticated prompt for Mistral
        const prompt = `You are an expert investment advisor. Based on this investor profile, recommend 3 stocks suitable for their market (${formData.country}):

INVESTOR PROFILE:
- Country: ${formData.country}
- Initial Capital: ${formData.currencySymbol}${initialCapital.toLocaleString()}
- Monthly SIP: ${formData.currencySymbol}${monthlyContribution.toLocaleString()} (0 if not investing monthly)
- Experience Level: ${formData.investmentExperience}
- Time Horizon: ${formData.investmentTimeframe}
- Risk Profile: ${formData.riskTolerance} (Expected Annual Return: ${riskProfile.expectedReturn}%)
- Strategy: ${formData.investmentStrategy}

REQUIREMENTS:
1. Recommend 3 stocks that match their risk profile and strategy
2. Consider the investor's country and local market conditions
3. Stocks should be suitable for long-term wealth building via SIP

For each stock, provide:
- Stock symbol/ticker (use local exchange symbols if in ${formData.country})
- Recommendation score (0-10)
- Risk level (Low/Medium/High)
- Expected 5-year CAGR
- Dividend yield (if applicable)
- Key investment rationale (2-3 sentences)

Return ONLY valid JSON (no markdown, no code blocks):
{
  "recommendations": [
    {
      "symbol": "TICKER",
      "score": 8.5,
      "risk": "Medium",
      "expectedCAGR": "12.5%",
      "dividendYield": "2.1%",
      "rationale": "Explanation..."
    }
  ]
}`;

        // Call Mistral API
        const mistralResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "mistral-large-latest",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 1500,
            }),
        });

        if (!mistralResponse.ok) {
            const errorText = await mistralResponse.text();
            console.error("Mistral API error:", mistralResponse.status, errorText);
            return NextResponse.json(
                { error: `Mistral API error: ${mistralResponse.status}` },
                { status: 500 }
            );
        }

        const mistralData = await mistralResponse.json();
        const content = mistralData.choices?.[0]?.message?.content || "";

        let recommendations = [];
        try {
            const parsed = JSON.parse(content);
            recommendations = parsed.recommendations || [];
        } catch (e) {
            // Try to extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[0]);
                    recommendations = parsed.recommendations || [];
                } catch {
                    console.error("Failed to parse Mistral response:", e);
                }
            }
        }

        return NextResponse.json({
            recommendations: recommendations.slice(0, 3),
            projections: {
                year1: projections1yr[1],
                year5: projections5yr[5],
                year10: projections10yr[10],
                year15: projections15yr[15],
                all1yr: projections1yr,
                all5yr: projections5yr,
                all10yr: projections10yr,
                all15yr: projections15yr,
            },
            riskProfile: riskProfile.risk,
            expectedReturn: riskProfile.expectedReturn,
            initialCapital,
            monthlyContribution,
            currency: formData.currency,
            currencySymbol: formData.currencySymbol,
        });
    } catch (error) {
        console.error("Error processing professional questionnaire:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
