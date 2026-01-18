"""
Polyflix Backend API - FastAPI Application
Netflix for Prediction Markets - Search & Scoring Engine
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from search_recommender import SearchRecommender, search_gamma_api

app = FastAPI(
    title="Polyflix API",
    description="Search-Based Recommendation Engine for Prediction Markets",
    version="1.0.0"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the recommender with debug mode on (uses real Gamma API by default)
recommender = SearchRecommender(debug=True)


# Request/Response Models
class Market(BaseModel):
    id: str
    title: str
    volume: Optional[float] = None  # Accept float/int/null, will be converted to int

    class Config:
        extra = "allow"  # Allow additional fields

    def get_volume_int(self) -> int:
        """Get volume as integer, defaulting to 0."""
        if self.volume is None:
            return 0
        return int(self.volume)


class RecommendationRequest(BaseModel):
    watchlist: List[Market]
    disliked_items: Optional[List[Market]] = []


class ScoredMarket(BaseModel):
    id: str
    title: str
    volume: int
    score: float
    volume_score: Optional[float] = None
    novelty_score: Optional[float] = None
    relevance_score: Optional[float] = None
    penalized: bool
    query_matched: Optional[str] = None

    class Config:
        extra = "allow"


class RecommendationResponse(BaseModel):
    recommendations: List[ScoredMarket]
    keywords_used: List[str]
    negative_keywords: List[str]
    total_candidates: int


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Polyflix Recommendation Engine",
        "version": "1.0.0"
    }


@app.post("/api/recommendations", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """
    Get personalized market recommendations based on user's watchlist and dislikes.

    The algorithm:
    1. Extracts top 3 keywords from watchlist titles
    2. Extracts negative keywords from disliked items
    3. Searches for markets using positive keywords (parallel queries)
    4. Scores each candidate: Base_Score = log(volume) normalized to 0-1
    5. Applies 80% penalty if title contains negative keywords
    6. Returns top 10 sorted by final score
    """
    if not request.watchlist:
        raise HTTPException(
            status_code=400,
            detail="Watchlist cannot be empty. Add some markets to get recommendations."
        )

    # Convert Pydantic models to dicts
    watchlist = [m.model_dump() for m in request.watchlist]
    disliked_items = [m.model_dump() for m in request.disliked_items] if request.disliked_items else []

    # Get recommendations
    recommendations = recommender.get_recommendations(
        watchlist=watchlist,
        disliked_items=disliked_items,
        top_n=10
    )

    # Extract keywords for response metadata
    from search_recommender import STOP_WORDS
    import string
    from collections import Counter

    # Recalculate keywords for response (could cache this)
    watchlist_titles = [m["title"] for m in watchlist]
    word_counter = Counter()
    for title in watchlist_titles:
        cleaned = title.lower().translate(str.maketrans('', '', string.punctuation))
        words = [w for w in cleaned.split() if w not in STOP_WORDS and len(w) > 2]
        word_counter.update(words)
    positive_keywords = [word for word, _ in word_counter.most_common(3)]

    # Negative keywords
    negative_keywords = set()
    for item in disliked_items:
        cleaned = item["title"].lower().translate(str.maketrans('', '', string.punctuation))
        words = {w for w in cleaned.split() if w not in STOP_WORDS and len(w) > 2}
        negative_keywords.update(words)

    return RecommendationResponse(
        recommendations=recommendations,
        keywords_used=positive_keywords,
        negative_keywords=list(negative_keywords),
        total_candidates=len(recommendations)
    )


@app.get("/api/search/{query}")
async def search_markets(query: str):
    """
    Direct search endpoint using the Gamma API.
    Useful for testing and debugging.
    """
    results = search_gamma_api(query)
    return {
        "query": query,
        "results": results,
        "count": len(results)
    }


class SimilarMarketsRequest(BaseModel):
    market: Market
    limit: Optional[int] = 3


@app.post("/api/similar")
async def get_similar_markets(request: SimilarMarketsRequest):
    """
    Get similar markets based on a single market.
    Uses the market title to extract keywords and find related markets.
    """
    market_data = request.market.model_dump()
    market_data["volume"] = request.market.get_volume_int()  # Ensure volume is int
    limit = request.limit or 3
    title = market_data.get("title", "")

    # For a single market, extract more keywords directly from the title
    # to ensure we have enough search terms
    keywords = recommender._extract_keywords_from_title(title, top_n=4)

    if recommender.debug:
        print(f"\n{'='*60}")
        print(f"SIMILAR MARKETS for: {title[:50]}...")
        print(f"Extracted keywords: {keywords}")
        print(f"{'='*60}")

    if not keywords:
        # Fallback: use the full title as a search query
        keywords = [title.split()[0]] if title else []
        if recommender.debug:
            print(f"No keywords extracted, using fallback: {keywords}")

    if not keywords:
        return {
            "similar": [],
            "source_market": title,
            "count": 0,
            "keywords_used": []
        }

    # Search using extracted keywords
    candidates = recommender._scattershot_search(keywords)

    if not candidates:
        return {
            "similar": [],
            "source_market": title,
            "count": 0,
            "keywords_used": keywords
        }

    # Score and filter candidates (exclude the source market)
    import math
    max_log_volume = max(math.log(m["volume"] + 1) for m in candidates.values())
    source_id = market_data.get("id", "")
    source_title_lower = title.lower().strip()

    scored_markets = []
    for market_id, candidate in candidates.items():
        # Skip the source market itself
        if market_id == source_id or candidate["title"].lower().strip() == source_title_lower:
            continue

        score_result = recommender._calculate_score(candidate, set(), max_log_volume)
        scored_markets.append({
            **candidate,
            "score": score_result["final_score"],
            "volume_score": score_result["volume_score"],
            "novelty_score": score_result["novelty_score"],
            "penalized": False,
        })

    # Sort by score and return top results
    scored_markets.sort(key=lambda x: x["score"], reverse=True)
    similar = scored_markets[:limit]

    return {
        "similar": similar,
        "source_market": title,
        "count": len(similar),
        "keywords_used": keywords
    }


@app.get("/api/test")
async def test_recommendations():
    """
    Test endpoint with sample data to verify the scoring algorithm.
    """
    # Sample watchlist - user likes crypto and politics
    sample_watchlist = [
        {"id": "test-1", "title": "Bitcoin price above $100k by end of 2024?", "volume": 25000000},
        {"id": "test-2", "title": "Bitcoin ETF approval in January?", "volume": 12000000},
        {"id": "test-3", "title": "Democrats retain Senate in 2024?", "volume": 18000000},
    ]

    # Sample dislikes - user doesn't like sports
    sample_dislikes = [
        {"id": "dislike-1", "title": "Lakers win NBA Championship 2024?", "volume": 9000000},
        {"id": "dislike-2", "title": "LeBron Lakers MVP of the season?", "volume": 1500000},
    ]

    print("\n" + "="*60)
    print("RUNNING TEST WITH SAMPLE DATA")
    print("="*60)
    print("\nSample Watchlist:")
    for item in sample_watchlist:
        print(f"  - {item['title']}")
    print("\nSample Dislikes:")
    for item in sample_dislikes:
        print(f"  - {item['title']}")

    recommendations = recommender.get_recommendations(
        watchlist=sample_watchlist,
        disliked_items=sample_dislikes,
        top_n=10
    )

    return {
        "test_watchlist": sample_watchlist,
        "test_dislikes": sample_dislikes,
        "recommendations": recommendations,
        "note": "Check server console for detailed score calculations"
    }


if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*60)
    print("POLYFLIX RECOMMENDATION ENGINE")
    print("="*60)
    print("Starting server on http://localhost:8000")
    print("API docs available at http://localhost:8000/docs")
    print("="*60 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
