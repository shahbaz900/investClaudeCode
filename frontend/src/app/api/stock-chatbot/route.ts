import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { message, stocks } = await request.json();

        if (!process.env.MISTRAL_API_KEY) {
            return NextResponse.json(
                { error: "API key not configured" },
                { status: 500 }
            );
        }

        if (!message || !Array.isArray(stocks)) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check if the message is asking about stocks or off-topic
        const stockSymbols = stocks.join(", ");
        
        const prompt = `You are a knowledgeable investment advisor chatbot. You ONLY answer questions about the recommended stocks: ${stockSymbols}.

User Question: "${message}"

IMPORTANT RULES:
1. ONLY answer questions directly related to these stocks: ${stockSymbols}
2. If the question is about something else (weather, politics, sports, general knowledge, etc.), politely decline and say you can only help with questions about the recommended stocks.
3. Provide concise, helpful answers about stock fundamentals, performance, investment strategy, etc.
4. Be respectful and professional.

If the question is NOT about the stocks, respond with: "I can only help with questions about the recommended stocks: ${stockSymbols}. Please ask about one of these companies."

Provide a brief, helpful response (1-2 sentences).`;

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
                max_tokens: 500,
            }),
        });

        if (!mistralResponse.ok) {
            const errorText = await mistralResponse.text();
            console.error("Mistral API error:", mistralResponse.status, errorText);
            return NextResponse.json(
                { error: "Failed to process question" },
                { status: 500 }
            );
        }

        const mistralData = await mistralResponse.json();
        const response = mistralData.choices?.[0]?.message?.content || "I couldn't process your question. Please try again.";

        return NextResponse.json({ response });
    } catch (error) {
        console.error("Error in stock chatbot:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
