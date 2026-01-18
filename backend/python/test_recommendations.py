"""
Comprehensive test suite for the Polyflix recommendation system.
Tests various watchlist types to evaluate recommendation quality.
"""

import json
from search_recommender import SearchRecommender

# Test cases with different types of watchlists
TEST_CASES = [
    {
        "name": "Sports - NBA Focus",
        "description": "User interested in NBA basketball markets",
        "watchlist": [
            {"id": "nba-1", "title": "Lakers win NBA Championship 2025?", "volume": 15000000},
            {"id": "nba-2", "title": "Celtics vs Lakers NBA Finals matchup?", "volume": 8000000},
            {"id": "nba-3", "title": "LeBron James NBA MVP 2025?", "volume": 12000000},
        ],
        "disliked": [
            {"id": "golf-1", "title": "Tiger Woods wins Masters 2025?", "volume": 5000000},
        ]
    },
    {
        "name": "Sports - NFL Focus",
        "description": "User interested in NFL football markets",
        "watchlist": [
            {"id": "nfl-1", "title": "Chiefs win Super Bowl 2025?", "volume": 20000000},
            {"id": "nfl-2", "title": "Patrick Mahomes NFL MVP?", "volume": 10000000},
            {"id": "nfl-3", "title": "Cowboys make NFL playoffs 2025?", "volume": 7000000},
        ],
        "disliked": []
    },
    {
        "name": "Crypto - Bitcoin Focus",
        "description": "User interested in Bitcoin price markets",
        "watchlist": [
            {"id": "btc-1", "title": "Bitcoin price above $150k by June 2025?", "volume": 30000000},
            {"id": "btc-2", "title": "Bitcoin ETF inflows exceed $50 billion?", "volume": 18000000},
            {"id": "btc-3", "title": "Bitcoin dominance above 60% in 2025?", "volume": 9000000},
        ],
        "disliked": [
            {"id": "eth-1", "title": "Ethereum price above $5000?", "volume": 12000000},
        ]
    },
    {
        "name": "Crypto - Ethereum & Altcoins",
        "description": "User interested in Ethereum and altcoin markets",
        "watchlist": [
            {"id": "eth-1", "title": "Ethereum price above $10k in 2025?", "volume": 15000000},
            {"id": "eth-2", "title": "Ethereum ETF approval by SEC?", "volume": 12000000},
            {"id": "sol-1", "title": "Solana price above $500 in 2025?", "volume": 8000000},
        ],
        "disliked": []
    },
    {
        "name": "Politics - US Elections",
        "description": "User interested in US political markets",
        "watchlist": [
            {"id": "pol-1", "title": "Republicans win Senate 2026 midterms?", "volume": 25000000},
            {"id": "pol-2", "title": "Trump approval rating above 50%?", "volume": 18000000},
            {"id": "pol-3", "title": "Democrats win House 2026?", "volume": 20000000},
        ],
        "disliked": []
    },
    {
        "name": "Politics - International",
        "description": "User interested in international political markets",
        "watchlist": [
            {"id": "intl-1", "title": "UK general election called in 2025?", "volume": 8000000},
            {"id": "intl-2", "title": "France Le Pen wins presidency?", "volume": 10000000},
            {"id": "intl-3", "title": "Germany coalition government collapses?", "volume": 6000000},
        ],
        "disliked": []
    },
    {
        "name": "Tech - AI Companies",
        "description": "User interested in AI and tech company markets",
        "watchlist": [
            {"id": "ai-1", "title": "OpenAI valuation above $200 billion?", "volume": 12000000},
            {"id": "ai-2", "title": "Nvidia stock price above $200?", "volume": 15000000},
            {"id": "ai-3", "title": "Google launches GPT-5 competitor?", "volume": 8000000},
        ],
        "disliked": []
    },
    {
        "name": "Pop Culture - Entertainment",
        "description": "User interested in entertainment and awards",
        "watchlist": [
            {"id": "ent-1", "title": "Oppenheimer wins Best Picture Oscar?", "volume": 10000000},
            {"id": "ent-2", "title": "Taylor Swift Grammy Album of the Year?", "volume": 8000000},
            {"id": "ent-3", "title": "Marvel movie crosses $1 billion?", "volume": 6000000},
        ],
        "disliked": []
    },
    {
        "name": "Mixed - Crypto + Politics",
        "description": "User with diverse interests in crypto and politics",
        "watchlist": [
            {"id": "mix-1", "title": "Bitcoin price above $100k by end of 2025?", "volume": 25000000},
            {"id": "mix-2", "title": "Democrats retain White House 2028?", "volume": 15000000},
            {"id": "mix-3", "title": "Ethereum staking regulation passed?", "volume": 8000000},
        ],
        "disliked": [
            {"id": "sports-1", "title": "Lakers win NBA Championship?", "volume": 12000000},
        ]
    },
    {
        "name": "Niche - Soccer/Football",
        "description": "User interested in European soccer markets",
        "watchlist": [
            {"id": "soccer-1", "title": "Manchester City win Premier League 2025?", "volume": 12000000},
            {"id": "soccer-2", "title": "Real Madrid Champions League winner?", "volume": 15000000},
            {"id": "soccer-3", "title": "Messi wins Ballon d'Or 2025?", "volume": 8000000},
        ],
        "disliked": []
    },
    {
        "name": "Niche - Tennis",
        "description": "User interested in tennis markets",
        "watchlist": [
            {"id": "tennis-1", "title": "Djokovic wins Wimbledon 2025?", "volume": 8000000},
            {"id": "tennis-2", "title": "Alcaraz world number 1 ranking?", "volume": 5000000},
            {"id": "tennis-3", "title": "US Open women's singles winner American?", "volume": 4000000},
        ],
        "disliked": []
    },
    {
        "name": "Finance - Markets",
        "description": "User interested in traditional finance markets",
        "watchlist": [
            {"id": "fin-1", "title": "S&P 500 above 6000 by end of 2025?", "volume": 20000000},
            {"id": "fin-2", "title": "Federal Reserve cuts rates in 2025?", "volume": 18000000},
            {"id": "fin-3", "title": "US recession in 2025?", "volume": 15000000},
        ],
        "disliked": []
    },
    {
        "name": "Edge Case - Single Item Watchlist",
        "description": "User with only one item in watchlist",
        "watchlist": [
            {"id": "single-1", "title": "Bitcoin price prediction 2025", "volume": 10000000},
        ],
        "disliked": []
    },
    {
        "name": "Edge Case - Heavy Dislikes",
        "description": "User with many dislikes to test penalty system",
        "watchlist": [
            {"id": "like-1", "title": "Bitcoin price above $100k?", "volume": 20000000},
            {"id": "like-2", "title": "Ethereum ETF approved?", "volume": 15000000},
        ],
        "disliked": [
            {"id": "dis-1", "title": "Lakers NBA Championship", "volume": 10000000},
            {"id": "dis-2", "title": "Chiefs Super Bowl winner", "volume": 12000000},
            {"id": "dis-3", "title": "Trump election prediction", "volume": 18000000},
            {"id": "dis-4", "title": "Taylor Swift Grammy winner", "volume": 5000000},
        ]
    },
]


def print_separator(char="=", length=80):
    print(char * length)


def print_header(text):
    print_separator()
    print(f"  {text}")
    print_separator()


def evaluate_recommendations(test_case, recommendations):
    """Evaluate the quality of recommendations for a test case."""
    evaluation = {
        "has_recommendations": len(recommendations) > 0,
        "count": len(recommendations),
        "avg_score": 0,
        "penalized_count": 0,
        "volume_range": (0, 0),
        "top_3_titles": [],
    }

    if recommendations:
        scores = [r["score"] for r in recommendations]
        volumes = [r["volume"] for r in recommendations]
        evaluation["avg_score"] = sum(scores) / len(scores)
        evaluation["penalized_count"] = sum(1 for r in recommendations if r.get("penalized"))
        evaluation["volume_range"] = (min(volumes), max(volumes))
        evaluation["top_3_titles"] = [r["title"][:60] for r in recommendations[:3]]

    return evaluation


def run_test(test_case, recommender):
    """Run a single test case and return results."""
    print(f"\n\n{'#'*80}")
    print(f"# TEST: {test_case['name']}")
    print(f"# {test_case['description']}")
    print(f"{'#'*80}")

    print("\nWATCHLIST:")
    for item in test_case["watchlist"]:
        print(f"  • {item['title']}")

    if test_case["disliked"]:
        print("\nDISLIKED:")
        for item in test_case["disliked"]:
            print(f"  ✗ {item['title']}")

    print("\n" + "-"*60)
    print("Running recommendation engine...")
    print("-"*60)

    recommendations = recommender.get_recommendations(
        watchlist=test_case["watchlist"],
        disliked_items=test_case["disliked"],
        top_n=10
    )

    evaluation = evaluate_recommendations(test_case, recommendations)

    print("\n" + "="*60)
    print("EVALUATION SUMMARY")
    print("="*60)
    print(f"  Recommendations returned: {evaluation['count']}")
    print(f"  Average score: {evaluation['avg_score']:.4f}")
    print(f"  Penalized recommendations: {evaluation['penalized_count']}")
    print(f"  Volume range: ${evaluation['volume_range'][0]:,} - ${evaluation['volume_range'][1]:,}")

    if evaluation['top_3_titles']:
        print("\n  Top 3 Recommendations:")
        for i, title in enumerate(evaluation['top_3_titles'], 1):
            print(f"    {i}. {title}...")

    return {
        "name": test_case["name"],
        "evaluation": evaluation,
        "recommendations": recommendations
    }


def run_all_tests():
    """Run all test cases and generate a summary report."""
    print_header("POLYFLIX RECOMMENDATION SYSTEM - COMPREHENSIVE TEST SUITE")
    print(f"\nRunning {len(TEST_CASES)} test cases...\n")

    recommender = SearchRecommender(debug=True)
    results = []

    for test_case in TEST_CASES:
        try:
            result = run_test(test_case, recommender)
            results.append(result)
        except Exception as e:
            print(f"\n❌ ERROR in test '{test_case['name']}': {e}")
            results.append({
                "name": test_case["name"],
                "error": str(e),
                "evaluation": {"has_recommendations": False, "count": 0}
            })

    # Final summary
    print("\n\n")
    print_header("FINAL TEST SUMMARY")

    total_tests = len(results)
    successful_tests = sum(1 for r in results if r["evaluation"]["has_recommendations"])
    total_recommendations = sum(r["evaluation"]["count"] for r in results)

    print(f"\nTests run: {total_tests}")
    print(f"Tests with recommendations: {successful_tests}/{total_tests}")
    print(f"Total recommendations generated: {total_recommendations}")

    print("\n" + "-"*60)
    print("RESULTS BY TEST CASE:")
    print("-"*60)

    for result in results:
        status = "✓" if result["evaluation"]["has_recommendations"] else "✗"
        count = result["evaluation"]["count"]
        avg_score = result["evaluation"].get("avg_score", 0)
        print(f"  {status} {result['name']}: {count} recs (avg score: {avg_score:.3f})")

    # Quality analysis
    print("\n" + "-"*60)
    print("QUALITY ANALYSIS:")
    print("-"*60)

    avg_scores = [r["evaluation"]["avg_score"] for r in results if r["evaluation"]["count"] > 0]
    if avg_scores:
        print(f"  Overall average score: {sum(avg_scores)/len(avg_scores):.4f}")
        print(f"  Highest avg score: {max(avg_scores):.4f}")
        print(f"  Lowest avg score: {min(avg_scores):.4f}")

    penalized_total = sum(r["evaluation"].get("penalized_count", 0) for r in results)
    print(f"  Total penalized recommendations: {penalized_total}")

    return results


if __name__ == "__main__":
    results = run_all_tests()
