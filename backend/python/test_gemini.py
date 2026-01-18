"""
Test Gemini-powered keyword extraction.
Run with: GEMINI_API_KEY=your_key python test_gemini.py
"""

import os
from search_recommender import SearchRecommender, extract_keywords_with_gemini

# Test cases
TEST_WATCHLISTS = {
    "NBA Basketball": [
        {"id": "1", "title": "Lakers win NBA Championship 2025?", "volume": 15000000},
        {"id": "2", "title": "Celtics vs Lakers NBA Finals matchup?", "volume": 8000000},
        {"id": "3", "title": "LeBron James NBA MVP 2025?", "volume": 12000000},
    ],
    "Crypto": [
        {"id": "1", "title": "Bitcoin price above $150k by June 2025?", "volume": 30000000},
        {"id": "2", "title": "Ethereum ETF approval by SEC?", "volume": 18000000},
        {"id": "3", "title": "Solana flips Ethereum in market cap?", "volume": 9000000},
    ],
    "US Politics": [
        {"id": "1", "title": "Republicans win Senate 2026 midterms?", "volume": 25000000},
        {"id": "2", "title": "Trump approval rating above 50%?", "volume": 18000000},
        {"id": "3", "title": "Democrats win House 2026?", "volume": 20000000},
    ],
    "Mixed - Tech + Entertainment": [
        {"id": "1", "title": "OpenAI releases GPT-5 in 2025?", "volume": 12000000},
        {"id": "2", "title": "Taylor Swift Grammy Album of the Year?", "volume": 8000000},
        {"id": "3", "title": "Apple stock reaches $250?", "volume": 10000000},
    ],
}


def test_gemini_extraction():
    """Test just the keyword extraction."""
    print("=" * 60)
    print("TESTING GEMINI KEYWORD EXTRACTION")
    print("=" * 60)

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("\n❌ No GEMINI_API_KEY found in environment.")
        print("   Set it with: export GEMINI_API_KEY=your_key")
        return False

    print(f"✓ API key found: {api_key[:10]}...")

    for name, watchlist in TEST_WATCHLISTS.items():
        print(f"\n--- {name} ---")
        titles = [m["title"] for m in watchlist]
        print(f"Titles: {titles}")

        keywords = extract_keywords_with_gemini(titles, num_keywords=5, api_key=api_key)
        if keywords:
            print(f"✓ Keywords: {keywords}")
        else:
            print("❌ Failed to extract keywords")

    return True


def test_full_recommendations():
    """Test full recommendation pipeline with Gemini."""
    print("\n" + "=" * 60)
    print("TESTING FULL RECOMMENDATION PIPELINE")
    print("=" * 60)

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Skipping - no API key")
        return

    rec = SearchRecommender(debug=True, use_gemini=True)

    for name, watchlist in TEST_WATCHLISTS.items():
        print(f"\n\n{'#' * 60}")
        print(f"# {name}")
        print("#" * 60)

        recommendations = rec.get_recommendations(watchlist, top_n=5)

        print(f"\n✓ Got {len(recommendations)} recommendations")
        if recommendations:
            print("\nTop 3:")
            for i, r in enumerate(recommendations[:3], 1):
                print(f"  {i}. {r['title'][:60]}...")
                print(f"     Score: {r['score']:.3f} | Volume: ${r['volume']:,}")


def compare_heuristic_vs_gemini():
    """Compare heuristic vs Gemini keyword extraction."""
    print("\n" + "=" * 60)
    print("COMPARING HEURISTIC VS GEMINI")
    print("=" * 60)

    api_key = os.environ.get("GEMINI_API_KEY")

    # Heuristic
    rec_heuristic = SearchRecommender(debug=False, use_gemini=False)

    # Gemini (if available)
    rec_gemini = SearchRecommender(debug=False, use_gemini=True) if api_key else None

    for name, watchlist in TEST_WATCHLISTS.items():
        print(f"\n--- {name} ---")
        titles = [m["title"] for m in watchlist]

        # Heuristic keywords
        heuristic_keywords = rec_heuristic._extract_keywords(titles, top_n=3)
        print(f"Heuristic: {heuristic_keywords}")

        # Gemini keywords
        if api_key:
            gemini_keywords = extract_keywords_with_gemini(titles, num_keywords=5, api_key=api_key)
            print(f"Gemini:    {gemini_keywords}")
        else:
            print("Gemini:    (no API key)")


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  POLYFLIX GEMINI INTEGRATION TEST")
    print("=" * 60)

    # Test 1: Keyword extraction only
    success = test_gemini_extraction()

    if success:
        # Test 2: Compare methods
        compare_heuristic_vs_gemini()

        # Test 3: Full pipeline
        test_full_recommendations()

    print("\n" + "=" * 60)
    print("  TESTS COMPLETE")
    print("=" * 60)
