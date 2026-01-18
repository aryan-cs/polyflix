"""
SearchRecommender: A meta-search engine with weighted scoring for Polyflix.
Implements the "Search, Sieve, and Score" workflow.
"""

import os
import math
import string
import httpx
import json
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Set, Any, Optional
from datetime import datetime, timezone

# Gemini setup - uses free tier
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    genai = None

GAMMA_API_URL = "https://gamma-api.polymarket.com/public-search"


def extract_keywords_with_gemini(
    titles: List[str],
    num_keywords: int = 5,
    api_key: Optional[str] = None
) -> Optional[List[str]]:
    """
    Use Gemini to extract search keywords from watchlist titles.

    Args:
        titles: List of market titles from user's watchlist.
        num_keywords: Number of keywords to extract.
        api_key: Gemini API key (falls back to GEMINI_API_KEY env var).

    Returns:
        List of keywords, or None if Gemini is unavailable/fails.
    """
    if not GEMINI_AVAILABLE:
        print("Gemini SDK not available, falling back to heuristic extraction")
        return None

    api_key = api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("No GEMINI_API_KEY found, falling back to heuristic extraction")
        return None

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')

        prompt = f"""You are helping find prediction markets similar to a user's watchlist.

Given these prediction market titles from a user's watchlist:
{chr(10).join(f'- {title}' for title in titles)}

Extract {num_keywords} search keywords/phrases that would find SIMILAR prediction markets.

Rules:
- Focus on topics, entities, and themes (e.g., "NBA", "Bitcoin", "Trump", "Oscar")
- Include both broad categories and specific entities
- Do NOT include numbers, dates, prices, or years
- Do NOT include generic words like "win", "price", "above", "prediction"
- Each keyword should be 1-3 words

Return ONLY a JSON array of strings, nothing else. Example: ["NBA finals", "Lakers", "basketball championship"]"""

        response = model.generate_content(prompt)
        text = response.text.strip()

        # Parse JSON response
        # Handle markdown code blocks if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()

        keywords = json.loads(text)

        if isinstance(keywords, list) and all(isinstance(k, str) for k in keywords):
            print(f"Gemini extracted keywords: {keywords}")
            return keywords[:num_keywords]
        else:
            print(f"Gemini returned unexpected format: {text}")
            return None

    except Exception as e:
        print(f"Gemini extraction failed: {e}")
        return None


# Stop words to filter out non-meaningful words
STOP_WORDS = {
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
    'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
    'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here',
    'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or',
    'because', 'until', 'while', 'this', 'that', 'these', 'those', 'what',
    'which', 'who', 'whom', 'win', 'price', 'market', 'prediction', 'will',
    'yes', 'no', 'over', 'under', 'reach', 'hit', 'end', 'year', 'week'
}


def search_gamma_api(query: str) -> List[Dict[str, Any]]:
    """
    Search the Polymarket Gamma API for markets matching the query.

    Args:
        query: Search term to find markets.

    Returns:
        List of market dictionaries with id, title, and volume.
    """
    try:
        response = httpx.get(
            GAMMA_API_URL,
            params={
                "q": query,
                "limit_per_type": 20,
            },
            timeout=10.0
        )
        response.raise_for_status()
        data = response.json()

        markets = []

        # Extract markets from events
        for event in data.get("events", []):
            # Each event can have multiple markets
            for market in event.get("markets", []):
                markets.append({
                    "id": market.get("id", ""),
                    "title": market.get("question", event.get("title", "")),
                    "volume": int(float(market.get("volume", 0))),
                    "query_matched": query,
                    "image": event.get("image", ""),
                    "slug": event.get("slug", ""),
                    "created_at": market.get("createdAt") or event.get("createdAt"),
                    "end_date": market.get("endDate") or event.get("endDate"),
                })

            # If no markets array, treat the event itself as a market
            if not event.get("markets"):
                markets.append({
                    "id": event.get("id", ""),
                    "title": event.get("title", ""),
                    "volume": int(float(event.get("volume", 0))),
                    "query_matched": query,
                    "image": event.get("image", ""),
                    "slug": event.get("slug", ""),
                    "created_at": event.get("createdAt"),
                    "end_date": event.get("endDate"),
                })

        return markets

    except httpx.HTTPError as e:
        print(f"API request failed for query '{query}': {e}")
        return []
    except Exception as e:
        print(f"Error processing response for query '{query}': {e}")
        return []


class SearchRecommender:
    """
    A meta-search engine that implements the "Search, Sieve, and Score" workflow
    for recommending prediction markets based on user preferences.
    """

    def __init__(self, search_func=None, debug: bool = True, use_gemini: bool = False, gemini_api_key: Optional[str] = None):
        """
        Initialize the SearchRecommender.

        Args:
            search_func: Function to call for API searches. Defaults to Gamma API.
            debug: Whether to print debug information for score calculations.
            use_gemini: Whether to use Gemini for keyword extraction (falls back to heuristic if unavailable).
            gemini_api_key: Optional Gemini API key (falls back to GEMINI_API_KEY env var).
        """
        self.search_func = search_func or search_gamma_api
        self.debug = debug
        self.use_gemini = use_gemini
        self.gemini_api_key = gemini_api_key
        self.negative_penalty = 0.2  # 80% penalty for negative keyword matches

        # Scoring weights (must sum to 1.0)
        self.weight_volume = 0.4
        self.weight_novelty = 0.3
        self.weight_relevance = 0.3

    def _calculate_novelty_score(self, market: Dict[str, Any]) -> float:
        """
        Calculate novelty score based on creation recency and upcoming end date.

        Combines two factors:
        - Creation recency: newer markets score higher (decays over 90 days)
        - End date proximity: markets ending soon score higher (within 30 days)

        Returns:
            Novelty score between 0 and 1.
        """
        now = datetime.now(timezone.utc)
        creation_score = 0.5  # default if no date
        end_date_score = 0.5  # default if no date

        # Creation recency score (newer = higher)
        created_at = market.get("created_at")
        if created_at:
            try:
                if isinstance(created_at, str):
                    # Handle ISO format with or without Z
                    created_at = created_at.replace("Z", "+00:00")
                    created = datetime.fromisoformat(created_at)
                else:
                    created = created_at

                days_old = (now - created).days
                # Score decays over 90 days: 1.0 for today, 0.0 for 90+ days old
                creation_score = max(0, 1 - (days_old / 90))
            except (ValueError, TypeError):
                pass

        # End date proximity score (ending soon = higher)
        end_date = market.get("end_date")
        if end_date:
            try:
                if isinstance(end_date, str):
                    end_date = end_date.replace("Z", "+00:00")
                    end = datetime.fromisoformat(end_date)
                else:
                    end = end_date

                days_until_end = (end - now).days
                if days_until_end < 0:
                    # Already ended
                    end_date_score = 0
                elif days_until_end <= 30:
                    # Ending within 30 days: higher score for sooner
                    end_date_score = 1 - (days_until_end / 30)
                else:
                    # More than 30 days out: flat low score
                    end_date_score = 0.2
            except (ValueError, TypeError):
                pass

        # Combine: 50% creation recency, 50% end date proximity
        return (creation_score * 0.5) + (end_date_score * 0.5)

    def _extract_keywords(self, titles: List[str], top_n: int = 3) -> List[str]:
        """
        Extract compound keywords (bigrams) from titles for more precise searching.

        Uses a two-pass approach:
        1. Find the most common single meaningful word (the "anchor")
        2. Find bigrams containing that anchor word
        3. Return compound phrases like "NBA championship" instead of just "championship"

        Args:
            titles: List of market titles to analyze.
            top_n: Number of top keywords to return.

        Returns:
            List of top N compound keywords (bigrams preferred, fallback to unigrams).
        """
        # First pass: count single words to find anchors
        word_counter = Counter()
        # Second pass: count bigrams
        bigram_counter = Counter()

        for title in titles:
            # Clean and tokenize
            cleaned = title.lower().translate(
                str.maketrans('', '', string.punctuation)
            )
            words = cleaned.split()

            # Filter out stop words, short words, and words containing numbers
            meaningful_words = [
                word for word in words
                if word not in STOP_WORDS
                and len(word) > 2
                and not any(c.isdigit() for c in word)  # Filter words with ANY digits
            ]
            word_counter.update(meaningful_words)

            # Extract bigrams (consecutive pairs of meaningful words)
            for i in range(len(meaningful_words) - 1):
                bigram = f"{meaningful_words[i]} {meaningful_words[i + 1]}"
                bigram_counter[bigram] += 1

        # Get top anchor words (these define the "topic")
        top_words = [word for word, _ in word_counter.most_common(top_n * 2)]

        if not top_words:
            return []

        # The #1 most common word is the primary anchor (e.g., "nba", "bitcoin")
        primary_anchor = top_words[0] if top_words else None

        # Build compound keywords: prioritize bigrams with the primary anchor
        compound_keywords = []
        used_words = set()

        # First priority: bigrams containing the primary anchor
        if primary_anchor:
            for bigram, count in bigram_counter.most_common(top_n * 5):
                if len(compound_keywords) >= top_n:
                    break
                if primary_anchor in bigram.split():
                    compound_keywords.append(bigram)
                    used_words.update(bigram.split())

        # Second priority: other bigrams with top words (but not generic ones)
        generic_words = {
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december',
            'season', 'game',
        }

        for bigram, count in bigram_counter.most_common(top_n * 5):
            if len(compound_keywords) >= top_n:
                break
            words_in_bigram = set(bigram.split())
            # Skip if bigram is just generic words
            if words_in_bigram <= generic_words:
                continue
            # Must contain a top word
            if words_in_bigram & set(top_words[:3]) and bigram not in compound_keywords:
                compound_keywords.append(bigram)
                used_words.update(words_in_bigram)

        # Fill remaining slots with the primary anchor alone if not enough bigrams
        if len(compound_keywords) < top_n and primary_anchor and primary_anchor not in compound_keywords:
            compound_keywords.append(primary_anchor)

        return compound_keywords[:top_n]

    def _extract_negative_keywords(self, titles: List[str]) -> Set[str]:
        """
        Extract all meaningful keywords from disliked items as negative keywords.

        Args:
            titles: List of disliked market titles.

        Returns:
            Set of negative keywords to penalize.
        """
        # Generic words that shouldn't be used as negative keywords
        generic_words = {
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december',
            'season', 'game', 'win', 'wins', 'winner', 'price', 'above', 'below',
            'before', 'after', 'first', 'last', 'next', 'today', 'tomorrow',
        }

        negative_keywords = set()

        for title in titles:
            cleaned = title.lower().translate(
                str.maketrans('', '', string.punctuation)
            )
            words = cleaned.split()

            meaningful_words = {
                word for word in words
                if word not in STOP_WORDS
                and word not in generic_words
                and len(word) > 2
                and not any(c.isdigit() for c in word)  # Filter words with ANY digits
            }
            negative_keywords.update(meaningful_words)

        return negative_keywords

    def _scattershot_search(self, keywords: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Fire off parallel queries for each keyword and aggregate unique results.

        Args:
            keywords: List of keywords to search for.

        Returns:
            Dictionary of unique markets keyed by market ID.
        """
        candidates = {}

        if self.debug:
            print(f"\n{'='*60}")
            print("SCATTERSHOT SEARCH")
            print(f"{'='*60}")
            print(f"Searching with keywords: {keywords}")

        # Execute searches in parallel
        with ThreadPoolExecutor(max_workers=len(keywords)) as executor:
            future_to_keyword = {
                executor.submit(self.search_func, keyword): keyword
                for keyword in keywords
            }

            for future in as_completed(future_to_keyword):
                keyword = future_to_keyword[future]
                try:
                    results = future.result()
                    if self.debug:
                        print(f"  '{keyword}' returned {len(results)} results")

                    for market in results:
                        market_id = market["id"]
                        # Keep the market if not seen, or update if higher volume
                        if market_id not in candidates or market["volume"] > candidates[market_id]["volume"]:
                            candidates[market_id] = market

                except Exception as e:
                    if self.debug:
                        print(f"  '{keyword}' search failed: {e}")

        if self.debug:
            print(f"Total unique candidates: {len(candidates)}")

        return candidates

    def _calculate_score(
        self,
        market: Dict[str, Any],
        negative_keywords: Set[str],
        max_log_volume: float
    ) -> Dict[str, Any]:
        """
        Calculate the final score for a market using weighted scoring algorithm.

        Score = (volume_score * w1 + novelty_score * w2 + relevance_score * w3) * penalty

        Args:
            market: Market dictionary with title, volume, and dates.
            negative_keywords: Set of keywords that trigger penalty.
            max_log_volume: Maximum log volume for normalization.

        Returns:
            Dict with final score and component scores for debugging.
        """
        title = market["title"]
        volume = market["volume"]

        # 1. Volume score: log-normalized (0-1)
        log_volume = math.log(volume + 1)  # +1 to handle volume=0
        volume_score = log_volume / max_log_volume if max_log_volume > 0 else 0

        # 2. Novelty score: based on creation date and end date (0-1)
        novelty_score = self._calculate_novelty_score(market)

        # 3. Relevance score: 1.0 for now (matched via keyword search)
        # Could be enhanced with semantic similarity later
        relevance_score = 1.0

        # Weighted combination
        combined_score = (
            volume_score * self.weight_volume +
            novelty_score * self.weight_novelty +
            relevance_score * self.weight_relevance
        )

        # Check for negative keyword matches
        title_lower = title.lower()
        title_words = set(title_lower.translate(
            str.maketrans('', '', string.punctuation)
        ).split())

        matching_negative = title_words & negative_keywords
        penalized = bool(matching_negative)

        if penalized:
            penalty_multiplier = self.negative_penalty
        else:
            penalty_multiplier = 1.0

        final_score = combined_score * penalty_multiplier

        if self.debug:
            if penalized:
                print(f"\n  PENALTY APPLIED: '{title[:50]}...'")
                print(f"    Matched negative keywords: {matching_negative}")
            else:
                print(f"\n  '{title[:50]}...'")
            print(f"    Volume: {volume_score:.3f} | Novelty: {novelty_score:.3f} | Relevance: {relevance_score:.3f}")
            print(f"    Combined: {combined_score:.4f} -> Final: {final_score:.4f}" +
                  (f" (penalized {(1 - penalty_multiplier) * 100:.0f}%)" if penalized else ""))

        return {
            "final_score": final_score,
            "volume_score": volume_score,
            "novelty_score": novelty_score,
            "relevance_score": relevance_score,
            "penalized": penalized,
            "matching_negative": list(matching_negative) if matching_negative else []
        }

    def get_recommendations(
        self,
        watchlist: List[Dict[str, Any]],
        disliked_items: List[Dict[str, Any]] = None,
        top_n: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get personalized market recommendations based on watchlist and dislikes.

        Args:
            watchlist: List of market objects the user has saved.
            disliked_items: List of market objects the user has dismissed.
            top_n: Number of recommendations to return.

        Returns:
            List of top N recommended markets with scores.
        """
        disliked_items = disliked_items or []

        if self.debug:
            print("\n" + "="*60)
            print("POLYFLIX SEARCH RECOMMENDER")
            print("="*60)
            print(f"Watchlist size: {len(watchlist)}")
            print(f"Disliked items: {len(disliked_items)}")

        # Handle empty watchlist
        if not watchlist:
            if self.debug:
                print("WARNING: Empty watchlist, cannot generate recommendations")
            return []

        # Step 1: Extract positive keywords from watchlist
        watchlist_titles = [m.get("title", "") for m in watchlist]

        # Try Gemini first, fall back to heuristic extraction
        positive_keywords = None
        if self.use_gemini:
            positive_keywords = extract_keywords_with_gemini(
                watchlist_titles,
                num_keywords=5,
                api_key=self.gemini_api_key
            )

        if positive_keywords is None:
            # Fallback to heuristic extraction
            positive_keywords = self._extract_keywords(watchlist_titles, top_n=3)
            if self.debug:
                print(f"\nKeywords (heuristic): {positive_keywords}")
        else:
            if self.debug:
                print(f"\nKeywords (Gemini): {positive_keywords}")

        # Step 2: Extract negative keywords from disliked items
        disliked_titles = [m.get("title", "") for m in disliked_items]
        negative_keywords = self._extract_negative_keywords(disliked_titles)

        if self.debug:
            print(f"Negative keywords extracted: {negative_keywords}")

        # Step 3: Scattershot search with positive keywords
        candidates = self._scattershot_search(positive_keywords)

        if not candidates:
            if self.debug:
                print("WARNING: No candidates found from search")
            return []

        # Step 4: Calculate scores
        if self.debug:
            print(f"\n{'='*60}")
            print("SCORE CALCULATIONS")
            print(f"{'='*60}")

        # Find max log volume for normalization
        max_log_volume = max(
            math.log(m["volume"] + 1) for m in candidates.values()
        )

        scored_markets = []
        watchlist_ids = {m.get("id") for m in watchlist}

        for market_id, market in candidates.items():
            # Skip markets already in watchlist
            if market_id in watchlist_ids:
                if self.debug:
                    print(f"\n  SKIPPED (in watchlist): '{market['title'][:40]}...'")
                continue

            score_result = self._calculate_score(market, negative_keywords, max_log_volume)
            scored_markets.append({
                **market,
                "score": score_result["final_score"],
                "volume_score": score_result["volume_score"],
                "novelty_score": score_result["novelty_score"],
                "relevance_score": score_result["relevance_score"],
                "penalized": score_result["penalized"],
            })

        # Step 5: Sort by score descending and return top N
        scored_markets.sort(key=lambda x: x["score"], reverse=True)
        recommendations = scored_markets[:top_n]

        if self.debug:
            print(f"\n{'='*60}")
            print(f"TOP {top_n} RECOMMENDATIONS")
            print(f"{'='*60}")
            for i, rec in enumerate(recommendations, 1):
                penalty_flag = " [PENALIZED]" if rec.get("penalized") else ""
                print(f"{i}. Score: {rec['score']:.4f}{penalty_flag}")
                print(f"   {rec['title']}")
                print(f"   Volume: ${rec['volume']:,} | Vol: {rec['volume_score']:.2f} | Nov: {rec['novelty_score']:.2f}")

        return recommendations
