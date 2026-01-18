#!/usr/bin/env python3
"""
Test script for the Polyflix SearchRecommender.
Uses dummy watchlist data to test the recommendation system against the real Gamma API.
"""

from search_recommender import SearchRecommender, search_gamma_api


def test_with_crypto_watchlist():
    """Test with a user who likes crypto/Bitcoin markets."""
    print("\n" + "="*70)
    print("TEST 1: Crypto Enthusiast")
    print("="*70)

    recommender = SearchRecommender(debug=True)

    # Dummy watchlist - user is interested in crypto
    watchlist = [
        {"id": "w1", "title": "Will Bitcoin reach $150,000 in 2025?", "volume": 5000000},
        {"id": "w2", "title": "Ethereum ETF approval by SEC?", "volume": 3000000},
        {"id": "w3", "title": "Bitcoin dominance above 60%?", "volume": 1500000},
    ]

    # User dislikes sports markets
    disliked = [
        {"id": "d1", "title": "Super Bowl winner 2025?", "volume": 2000000},
        {"id": "d2", "title": "NBA Finals MVP prediction", "volume": 1000000},
    ]

    results = recommender.get_recommendations(watchlist, disliked, top_n=10)
    return results


def test_with_politics_watchlist():
    """Test with a user who likes political markets."""
    print("\n" + "="*70)
    print("TEST 2: Politics Watcher")
    print("="*70)

    recommender = SearchRecommender(debug=True)

    # Dummy watchlist - user is interested in politics
    watchlist = [
        {"id": "w1", "title": "Trump wins 2028 presidential election?", "volume": 10000000},
        {"id": "w2", "title": "Democrats control Senate 2026?", "volume": 4000000},
        {"id": "w3", "title": "Trump approval rating above 55%?", "volume": 2000000},
    ]

    # User dislikes crypto markets
    disliked = [
        {"id": "d1", "title": "Bitcoin price prediction 2025", "volume": 5000000},
        {"id": "d2", "title": "Solana flips Ethereum?", "volume": 800000},
    ]

    results = recommender.get_recommendations(watchlist, disliked, top_n=10)
    return results


def test_with_ai_tech_watchlist():
    """Test with a user who likes AI/tech markets."""
    print("\n" + "="*70)
    print("TEST 3: AI/Tech Enthusiast")
    print("="*70)

    recommender = SearchRecommender(debug=True)

    # Dummy watchlist - user is interested in AI and tech
    watchlist = [
        {"id": "w1", "title": "OpenAI releases GPT-5 in 2025?", "volume": 3000000},
        {"id": "w2", "title": "Tesla stock above $500?", "volume": 2500000},
        {"id": "w3", "title": "Apple announces AI hardware?", "volume": 1800000},
    ]

    # User dislikes entertainment/celebrity markets
    disliked = [
        {"id": "d1", "title": "Taylor Swift Grammy wins 2025?", "volume": 1500000},
        {"id": "d2", "title": "Oscar best picture winner?", "volume": 900000},
    ]

    results = recommender.get_recommendations(watchlist, disliked, top_n=10)
    return results


def test_api_directly():
    """Quick test to verify the Gamma API is working."""
    print("\n" + "="*70)
    print("API CONNECTION TEST")
    print("="*70)

    test_queries = ["bitcoin", "trump", "ai"]

    for query in test_queries:
        results = search_gamma_api(query)
        print(f"\nQuery '{query}': {len(results)} results")
        for r in results[:3]:  # Show first 3
            print(f"  - {r['title'][:60]}... (vol: ${r['volume']:,})")


if __name__ == "__main__":
    # First verify API is working
    test_api_directly()

    # Run recommendation tests
    test_with_crypto_watchlist()
    test_with_politics_watchlist()
    test_with_ai_tech_watchlist()

    print("\n" + "="*70)
    print("ALL TESTS COMPLETE")
    print("="*70)
