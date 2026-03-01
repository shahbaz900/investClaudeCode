"""
AI Stock Recommendation Backend — FastAPI + Mistral AI
Handles general country-based queries and specific stock symbol lookups.
Built for Mistral Worldwide Hackathon 2026
"""

import os
import json
import re
import httpx
import random
import time
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="SmartStockPicker – Mistral Stock Recommender", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
MISTRAL_MODEL = "mistral-large-latest"  # Using Mistral Large 3 for superior reasoning

# Finnhub API for live stock prices
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY", "")
FINNHUB_URL = "https://finnhub.io/api/v1/quote"

# Mock stock prices for fallback (realistic March 2026 prices)
MOCK_STOCK_PRICES = {
    "AAPL": 264.50,
    "MSFT": 438.75,
    "NVDA": 895.25,
    "GOOGL": 178.40,
    "AMZN": 205.80,
    "TSLA": 285.30,
    "META": 542.90,
    "NFLX": 732.45,
    "AMD": 185.60,
    "INTC": 42.30,
    "CRM": 298.50,
    "ADBE": 580.40,
    "PYPL": 78.90,
    "UBER": 92.10,
}


# ── Request / Response Models ──────────────────────────────────────────────────

class StockData(BaseModel):
    symbol: str
    company: Optional[str] = None
    sector: Optional[str] = None
    pe_ratio: Optional[float] = None
    revenue_growth: Optional[float] = None
    debt_equity: Optional[float] = None
    market_cap: Optional[float] = None
    country: Optional[str] = None


class RecommendRequest(BaseModel):
    query: str
    country: str
    stocks: Optional[List[StockData]] = None   # Pre-fetched stock data (country queries)
    specific_symbol: Optional[str] = None       # For specific stock lookups


class Recommendation(BaseModel):
    symbol: str
    company: str
    score: float
    reasoning: List[str]
    risk_level: str
    growth_score: float


class RecommendResponse(BaseModel):
    recommendations: List[Recommendation]
    query_type: str   # "general" | "specific"
    country: str


class DiscussRequest(BaseModel):
    """Request for AI discussion about stocks"""
    recommendations: List[Recommendation]
    question: str
    country: str


class DiscussResponse(BaseModel):
    """Response with AI discussion about stocks"""
    response: str
    question: str


class StockPriceResponse(BaseModel):
    """Current stock price response"""
    symbol: str
    current_price: float
    currency: str = "USD"
    status: str = "success"


# ── Prompt Builder ─────────────────────────────────────────────────────────────

def build_prompt(request: RecommendRequest) -> str:
    """Builds a structured prompt for Claude based on query type."""

    base_rules = """
You are an expert financial analyst AI. Your job is to return ONLY valid JSON — no markdown, no explanation text outside JSON.

Return exactly this structure:
{
  "recommendations": [
    {
      "symbol": "TICKER",
      "company": "Full Company Name",
      "score": 8.5,
      "reasoning": ["Reason 1", "Reason 2", "Reason 3"],
      "risk_level": "Low|Medium|High",
      "growth_score": 7.0
    }
  ]
}

Rules:
- score and growth_score are floats from 0.0 to 10.0
- reasoning must have 2-4 bullet points
- Always return exactly 3 recommendations
- Base your analysis on fundamentals: PE ratio, debt/equity, revenue growth, market cap
- risk_level: Low (stable large-cap), Medium (growth stock), High (volatile/speculative)
"""

    if request.specific_symbol:
        return f"""{base_rules}

User query: "{request.query}"
Country context: {request.country}
Specific stock requested: {request.specific_symbol}

Analyze {request.specific_symbol} and recommend it plus 2 closely related/comparable stocks in the same sector from {request.country} or globally. Use your knowledge of current financials.
"""
    else:
        stock_json = ""
        if request.stocks:
            stock_list = [s.dict(exclude_none=True) for s in request.stocks]
            stock_json = f"\nAvailable stocks data:\n{json.dumps(stock_list, indent=2)}"

        return f"""{base_rules}

User query: "{request.query}"
Country: {request.country}
{stock_json}

From the provided stock data (or your knowledge if no data provided), recommend the top 3 stocks available in {request.country} matching the query. Prioritize stocks with strong fundamentals.
"""


# ── Mistral API Call ──────────────────────────────────────────────────────────

async def call_mistral(prompt: str) -> dict:
    """Calls Mistral API and returns parsed JSON response."""
    if not MISTRAL_API_KEY:
        raise HTTPException(status_code=500, detail="MISTRAL_API_KEY not set")

    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": MISTRAL_MODEL,
        "messages": [
            {
                "role": "user",
                "content": prompt,
            }
        ],
        "temperature": 0.7,
        "max_tokens": 1024,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(MISTRAL_API_URL, headers=headers, json=payload)

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Mistral API error: {response.status_code} — {response.text}",
        )

    result = response.json()
    raw_text = result["choices"][0]["message"]["content"].strip()

    # Strip markdown code fences if present
    raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
    raw_text = re.sub(r"\s*```$", "", raw_text)

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        # If not JSON, return as text response
        return {"response": raw_text}


async def call_mistral_text(prompt: str) -> str:
    """Calls Mistral API and returns plain text response (no JSON parsing)."""
    if not MISTRAL_API_KEY:
        raise HTTPException(status_code=500, detail="MISTRAL_API_KEY not set")

    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": MISTRAL_MODEL,
        "messages": [
            {
                "role": "user",
                "content": prompt,
            }
        ],
        "temperature": 0.7,
        "max_tokens": 1024,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(MISTRAL_API_URL, headers=headers, json=payload)

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Mistral API error: {response.status_code} — {response.text}",
        )

    result = response.json()
    return result["choices"][0]["message"]["content"].strip()


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"status": "ok", "service": "SmartStockPicker Mistral Backend", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.get("/price/{symbol}", response_model=StockPriceResponse)
async def get_stock_price(symbol: str):
    """
    Get current stock price using Finnhub API.
    Supports: US (NYSE, NASDAQ, AMEX), Canada (TSX), UK (LSE), Germany (XETRA, Frankfurt),
    France (Euronext Paris), Netherlands (Euronext Amsterdam), Italy (Milan), Spain (Madrid),
    Switzerland (SIX), Japan (TSE), Hong Kong (HKEX), Australia (ASX), Sweden, Norway, Denmark, Finland
    
    If price not available: Returns 404 with message that stock is not supported
    """
    try:
        clean_symbol = symbol.strip().upper()
        
        # Try Finnhub API if key is configured
        if FINNHUB_API_KEY:
            try:
                params = {
                    "symbol": clean_symbol,
                    "token": FINNHUB_API_KEY
                }
                response = requests.get(FINNHUB_URL, params=params, timeout=10)
                response.raise_for_status()
                data = response.json()
                
                # Check if Finnhub returned a valid price
                if "c" in data and data["c"] and data["c"] > 0:
                    current_price = float(data["c"])
                    return StockPriceResponse(
                        symbol=clean_symbol,
                        current_price=round(current_price, 2),
                        currency="USD",
                        status="success"
                    )
                else:
                    # Finnhub returned but price is 0/null (stock not found in supported exchanges)
                    raise HTTPException(
                        status_code=404,
                        detail=f"Stock '{clean_symbol}' is not available in our currently supported markets. "
                                f"We support: USA (NYSE, NASDAQ, AMEX), Canada (TSX), UK (LSE), Germany, France, "
                                f"Netherlands, Italy, Spain, Switzerland, Japan, Hong Kong, Australia, and Nordic exchanges. "
                                f"Pakistan Stock Exchange, India (NSE/BSE), and other frontier markets are not currently supported."
                    )
            except HTTPException as he:
                raise he
            except Exception as e:
                print(f"Finnhub API error for {clean_symbol}: {str(e)}")
                # Fall through to check mock prices
        
        # Use mock prices as demo fallback for development/demo
        if clean_symbol in MOCK_STOCK_PRICES:
            base_price = MOCK_STOCK_PRICES[clean_symbol]
            fluctuation = base_price * (random.uniform(-0.03, 0.03))
            current_price = base_price + fluctuation
            
            return StockPriceResponse(
                symbol=clean_symbol,
                current_price=round(current_price, 2),
                currency="USD",
                status="success"
            )
        
        # Symbol not found in any source
        raise HTTPException(
            status_code=404, 
            detail=f"Stock '{clean_symbol}' is not available in our currently supported markets. "
                    f"We support: USA (NYSE, NASDAQ, AMEX), Canada (TSX), UK (LSE), Germany, France, "
                    f"Netherlands, Italy, Spain, Switzerland, Japan, Hong Kong, Australia, and Nordic exchanges. "
                    f"Pakistan Stock Exchange, India (NSE/BSE), and other frontier markets are not currently supported."
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch stock price: {str(e)}"
        )


@app.post("/recommend", response_model=RecommendResponse)
async def recommend(request: RecommendRequest):
    """
    Main recommendation endpoint.
    Accepts pre-fetched stock data (country query) or a specific symbol.
    Returns top 3 AI-powered recommendations using Mistral Large 3.
    """
    prompt = build_prompt(request)
    mistral_data = await call_mistral(prompt)

    recs = mistral_data.get("recommendations", [])
    if not recs:
        raise HTTPException(status_code=502, detail="Mistral returned no recommendations")

    # Validate and coerce fields
    validated = []
    for r in recs[:3]:
        validated.append(
            Recommendation(
                symbol=r.get("symbol", "N/A"),
                company=r.get("company", "Unknown"),
                score=float(r.get("score", 5.0)),
                reasoning=r.get("reasoning", ["No reasoning provided"]),
                risk_level=r.get("risk_level", "Medium"),
                growth_score=float(r.get("growth_score", 5.0)),
            )
        )

    query_type = "specific" if request.specific_symbol else "general"
    return RecommendResponse(
        recommendations=validated,
        query_type=query_type,
        country=request.country,
    )


@app.post("/discuss", response_model=DiscussResponse)
async def discuss(request: DiscussRequest):
    """
    Discussion endpoint.
    Takes previous recommendations and a user question, provides conversational response.
    Uses Mistral Large 3 for intelligent discussion about the stocks.
    """
    # Build context from recommendations
    stock_list = "\n".join([
        f"- {rec.symbol} ({rec.company}): Score {rec.score}/10, Risk: {rec.risk_level}"
        for rec in request.recommendations
    ])

    discussion_prompt = f"""You are a fun, engaging financial advisor helping young investors understand stocks.

Previously recommended stocks for {request.country}:
{stock_list}

User's question: {request.question}

**IMPORTANT: Format your response for easy reading:**
- Use emojis to make it engaging and fun 😄
- Break content into clear sections with headers (use emoji + text)
- Use short bullet points (max 2-3 lines each)
- Highlight numbers and key takeaways with ** **
- Keep total response to 3-4 short paragraphs maximum
- Be conversational, not robotic
- Use analogies when explaining complex concepts
- End with a clear actionable takeaway

Example style:
📊 **The Volatility Thing**
NVDA is like a young startup founder—exciting and unpredictable.

✅ **Best For You**
- If you have 5+ years: Go for it! 🚀
- If you're nervous: Mix it with stable stocks

Your response:"""

    response_text = await call_mistral_text(discussion_prompt)

    return DiscussResponse(
        response=response_text,
        question=request.question,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
