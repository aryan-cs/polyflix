#!/usr/bin/env python3
"""
Test script to verify the API endpoint works with the same format
that the frontend sends.
"""

import requests
import json

def test_api_endpoint():
    """Test the /api/recommendations endpoint with frontend-like data."""
    
    # Sample data similar to what frontend sends
    test_data = {
        "watchlist": [
            {
                "id": "w1",
                "title": "Will Bitcoin reach $150,000 in 2025?",
                "volume": 5000000
            },
            {
                "id": "w2",
                "title": "Ethereum ETF approval by SEC?",
                "volume": 3000000
            },
            {
                "id": "w3",
                "title": "Bitcoin dominance above 60%?",
                "volume": 1500000
            },
            {
                "id": "w4",
                "title": "Will Bitcoin price hit $100k by end of 2024?",
                "volume": 8000000
            },
            {
                "id": "w5",
                "title": "Ethereum price above $5000 in 2025?",
                "volume": 2000000
            }
        ],
        "disliked_items": [
            {
                "id": "d1",
                "title": "Super Bowl winner 2025?",
                "volume": 2000000
            },
            {
                "id": "d2",
                "title": "NBA Finals MVP prediction",
                "volume": 1000000
            }
        ]
    }
    
    print("="*70)
    print("TESTING API ENDPOINT: /api/recommendations")
    print("="*70)
    print(f"\nSending request with:")
    print(f"  - Watchlist: {len(test_data['watchlist'])} markets")
    print(f"  - Disliked items: {len(test_data['disliked_items'])} markets")
    print(f"\nRequest body:")
    print(json.dumps(test_data, indent=2))
    
    try:
        response = requests.post(
            'http://localhost:8000/api/recommendations',
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"\n{'='*70}")
        print(f"Response Status: {response.status_code}")
        print(f"{'='*70}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ Success! Received {len(data.get('recommendations', []))} recommendations")
            print(f"\nKeywords used: {data.get('keywords_used', [])}")
            print(f"Negative keywords: {data.get('negative_keywords', [])}")
            print(f"\nTop 3 recommendations:")
            for i, rec in enumerate(data.get('recommendations', [])[:3], 1):
                print(f"  {i}. {rec.get('title', 'N/A')[:60]}...")
                print(f"     Score: {rec.get('score', 0):.4f}, Volume: ${rec.get('volume', 0):,}")
        else:
            print(f"\n❌ Error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {json.dumps(error_data, indent=2)}")
            except:
                print(f"Error text: {response.text}")
                
    except requests.exceptions.ConnectionError:
        print("\n❌ Connection Error: Make sure the Python backend is running on port 8000")
        print("   Start it with: python main.py")
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    test_api_endpoint()
