import { NextRequest, NextResponse } from "next/server";

interface FormData {
    age: string;
    country: string;
    investmentExperience: string;
    incomeLevel: string;
    investmentTimeframe: string;
    riskTolerance: string;
    savingsAmount: string;
    investmentGoal: string;
    monthlyInvestment: string;
    existingInvestments: string;
}

function determineRiskProfile(data: FormData): string {
    let riskScore = 0;

    // Age scoring
    if (data.age === "18-25") riskScore += 5;
    else if (data.age === "26-35") riskScore += 4;
    else if (data.age === "36-45") riskScore += 3;
    else if (data.age === "46-55") riskScore += 2;
    else riskScore += 1;

    // Experience scoring
    if (data.investmentExperience === "beginner") riskScore -= 2;
    else if (data.investmentExperience === "novice") riskScore -= 1;
    else if (data.investmentExperience === "advanced") riskScore += 2;

    // Timeframe scoring
    if (data.investmentTimeframe === "20yr+") riskScore += 3;
    else if (data.investmentTimeframe === "10-20yr") riskScore += 2;
    else if (data.investmentTimeframe === "5-10yr") riskScore += 1;
    else riskScore -= 1;

    // Risk tolerance direct scoring
    if (data.riskTolerance === "very-low") riskScore -= 3;
    else if (data.riskTolerance === "low") riskScore -= 2;
    else if (data.riskTolerance === "very-high") riskScore += 3;
    else if (data.riskTolerance === "high") riskScore += 2;

    // Income scoring
    if (data.incomeLevel === "500k+") riskScore += 2;
    else if (data.incomeLevel === "under-50k") riskScore -= 1;

    // Monthly investment scoring
    if (data.monthlyInvestment === "5k+") riskScore += 1;
    else if (data.monthlyInvestment === "none") riskScore -= 1;

    if (riskScore <= 2) return "Conservative/Low Risk";
    else if (riskScore <= 8) return "Moderate/Medium Risk";
    else return "Aggressive/High Risk";
}

export async function POST(request: NextRequest) {
    try {
        const formData: FormData = await request.json();

        // Validate required fields
        if (!formData.country || !formData.age) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Determine risk profile
        const riskProfile = determineRiskProfile(formData);

        // Create detailed prompt for Mistral with all profile information
        const prompt = `You are a professional financial advisor. Based on the following investor profile, provide 3 personalized stock recommendations:

INVESTOR PROFILE:
- Age: ${formData.age}
- Country: ${formData.country}
- Investment Experience: ${formData.investmentExperience}
- Annual Income: ${formData.incomeLevel}
- Investment Timeframe: ${formData.investmentTimeframe}
- Risk Tolerance: ${formData.riskTolerance}
- Initial Investment Amount: ${formData.savingsAmount}
- Monthly Investment Capacity: ${formData.monthlyInvestment}
- Primary Investment Goal: ${formData.investmentGoal}
- Existing Investments: ${formData.existingInvestments}
- Calculated Risk Profile: ${riskProfile}

REQUIREMENTS:
1. Recommend 3 stocks that match their risk profile, timeframe, and investment goal
2. Ensure recommendations are accessible in their country (${formData.country})
3. Consider their experience level when selecting stocks
4. Provide practical reasoning for each recommendation

For each stock, provide:
- Stock symbol (ticker)
- Recommendation score (0-10)
- Risk level (Low/Medium/High)
- Growth potential (Low/Medium/High) 
- Clear reasoning specific to their profile

Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "recommendations": [
    {
      "symbol": "TICKER",
      "score": 8.5,
      "risk": "Medium",
      "growth": "High",
      "reasoning": "Why this stock matches their specific profile..."
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
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: 1500,
            }),
        });

        if (!mistralResponse.ok) {
            const errorData = await mistralResponse.json();
            console.error("Mistral API error:", errorData);
            return NextResponse.json(
                { error: "Failed to generate recommendations from Mistral" },
                { status: 500 }
            );
        }

        const mistralData = await mistralResponse.json();
        const content = mistralData.choices?.[0]?.message?.content || "";

        // Parse the response - try to extract JSON
        let recommendations = [];
        try {
            // Try direct JSON parse
            const parsed = JSON.parse(content);
            recommendations = parsed.recommendations || [];
        } catch (e) {
            // Try to extract JSON from the response text
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[0]);
                    recommendations = parsed.recommendations || [];
                } catch (parseError) {
                    console.error("Failed to parse Mistral response:", content);
                    return NextResponse.json(
                        { error: "Failed to parse recommendations" },
                        { status: 500 }
                    );
                }
            }
        }

        return NextResponse.json({
            recommendations: recommendations.slice(0, 3), // Ensure 3 recommendations
            riskProfile,
        });
    } catch (error) {
        console.error("Error processing questionnaire:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
