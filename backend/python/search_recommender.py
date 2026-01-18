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
    'yes', 'no', 'over', 'under', 'reach', 'hit', 'end', 'year', 'week',
    # Months - explicitly exclude to prevent date-based clustering
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
    'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec',
    # Time-related words that don't add semantic meaning
    'today', 'tomorrow', 'yesterday', 'week', 'month', 'day', 'days', 'weeks', 'months',
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'
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

    def _extract_keywords_from_title(self, title: str, top_n: int = 3) -> List[str]:
        """
        Extract keywords from a single title.

        Args:
            title: A single market title to analyze.
            top_n: Number of keywords to extract from this title.

        Returns:
            List of keywords (bigrams preferred, fallback to unigrams).
        """
        generic_words = {
            'season', 'game', 'before', 'after', 'end', 'start',
            'dip', 'reach', 'hit', 'above', 'below', 'between', 'price'
        }

        # Clean and tokenize
        cleaned = title.lower().translate(
            str.maketrans('', '', string.punctuation)
        )
        words = cleaned.split()

        # Filter out stop words, short words, and words containing numbers
        meaningful_words = [
            word for word in words
            if word not in STOP_WORDS
            and word not in generic_words
            and len(word) > 2
            and not any(c.isdigit() for c in word)
        ]

        # If too aggressive, relax filters - keep words with length > 2 that aren't stop words
        if len(meaningful_words) < 2:
            meaningful_words = [
                word for word in words
                if word not in STOP_WORDS
                and len(word) > 2
                and not any(c.isdigit() for c in word)
            ]

        if not meaningful_words:
            return []

        keywords = []

        # Extract bigrams first (consecutive pairs), but skip if either word is a month/time word
        for i in range(len(meaningful_words) - 1):
            if len(keywords) >= top_n:
                break
            word1, word2 = meaningful_words[i], meaningful_words[i + 1]
            # Skip bigrams that contain time-related words
            if word1 not in STOP_WORDS and word2 not in STOP_WORDS:
                bigram = f"{word1} {word2}"
                keywords.append(bigram)

        # Fill remaining slots with single words if needed
        for word in meaningful_words:
            if len(keywords) >= top_n:
                break
            if word not in ' '.join(keywords):
                keywords.append(word)

        return keywords[:top_n]

    def _extract_keywords(self, titles: List[str], top_n: int = 6) -> List[str]:
        """
        Extract keywords using proportional allocation across all titles.

        Distributes keyword budget evenly across watchlist items to ensure
        diverse watchlists get representation from each item.

        Args:
            titles: List of market titles to analyze.
            top_n: Total keyword budget to distribute.

        Returns:
            List of keywords with representation from each title.
        """
        if not titles:
            return []

        # Calculate keywords per title (at least 1 each)
        keywords_per_title = max(1, top_n // len(titles))
        extra_slots = top_n - (keywords_per_title * len(titles))

        all_keywords = []
        seen_keywords = set()

        for i, title in enumerate(titles):
            # Give extra slots to first few titles if budget doesn't divide evenly
            n_keywords = keywords_per_title + (1 if i < extra_slots else 0)
            title_keywords = self._extract_keywords_from_title(title, top_n=n_keywords)

            for kw in title_keywords:
                if kw not in seen_keywords:
                    all_keywords.append(kw)
                    seen_keywords.add(kw)

        return all_keywords[:top_n]

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

    def _get_topic_signature(self, title: str) -> str:
        """
        Extract a topic signature from a market title to group similar markets.
        Removes dates, prices, and time-specific information.
        
        Args:
            title: Market title
            
        Returns:
            A simplified topic signature string
        """
        # Remove common price/date patterns
        import re
        # Remove dollar amounts like $85,000, $100k, etc.
        title = re.sub(r'\$[\d,]+[km]?\b', '', title, flags=re.IGNORECASE)
        # Remove date ranges like "January 12-18", "by 2025", etc.
        title = re.sub(r'\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d+[-\d]*', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\b\d{4}\b', '', title)  # Remove years
        title = re.sub(r'\b\d+[-\d]+\b', '', title)  # Remove number ranges
        
        # Extract key entities (capitalized words, common entities)
        words = title.lower().translate(str.maketrans('', '', string.punctuation)).split()
        key_words = [w for w in words if w not in STOP_WORDS and len(w) > 3 and not w.isdigit()]
        
        # Return first 2-3 key words as signature
        return ' '.join(sorted(set(key_words))[:3])
    
    def _select_diverse_results(
        self,
        scored_markets: List[Dict[str, Any]],
        keywords: List[str],
        top_n: int
    ) -> List[Dict[str, Any]]:
        """
        Select diverse results ensuring quota per source keyword and limiting similar topics.

        Distributes result slots across keywords to ensure each topic
        in the watchlist gets representation in the final recommendations.
        Also limits how many markets can come from the same topic cluster.

        Args:
            scored_markets: List of scored market dictionaries.
            keywords: List of keywords used for searching.
            top_n: Number of recommendations to return.

        Returns:
            List of diverse recommendations.
        """
        if not scored_markets or not keywords:
            return scored_markets[:top_n]

        # Group markets by their source keyword
        keyword_buckets = {kw: [] for kw in keywords}
        for market in scored_markets:
            source_kw = market.get("query_matched", "")
            if source_kw in keyword_buckets:
                keyword_buckets[source_kw].append(market)

        # Sort each bucket by score
        for kw in keyword_buckets:
            keyword_buckets[kw].sort(key=lambda x: x["score"], reverse=True)

        # Calculate quota per keyword (at least 1 each if possible)
        num_keywords = len(keywords)
        quota_per_keyword = max(1, top_n // num_keywords)
        extra_slots = top_n - (quota_per_keyword * num_keywords)

        if self.debug:
            print(f"\n{'='*60}")
            print("DIVERSE SELECTION")
            print(f"{'='*60}")
            print(f"Keywords: {num_keywords}, Quota per keyword: {quota_per_keyword}, Extra slots: {extra_slots}")

        # Track topic signatures to limit similar markets
        topic_counts = {}
        max_per_topic = max(2, top_n // 4)  # Max 2-3 markets per topic cluster

        # First pass: fill quota from each keyword, but limit similar topics
        selected = []
        selected_ids = set()

        for i, kw in enumerate(keywords):
            quota = quota_per_keyword + (1 if i < extra_slots else 0)
            bucket = keyword_buckets[kw]
            added = 0

            for market in bucket:
                if added >= quota:
                    break
                if market["id"] not in selected_ids:
                    # Check topic diversity
                    topic_sig = self._get_topic_signature(market["title"])
                    topic_count = topic_counts.get(topic_sig, 0)
                    
                    if topic_count < max_per_topic:
                        selected.append(market)
                        selected_ids.add(market["id"])
                        topic_counts[topic_sig] = topic_count + 1
                        added += 1

            if self.debug:
                print(f"  '{kw}': added {added}/{quota} (bucket size: {len(bucket)})")

        # Second pass: if we still have slots, fill with highest scoring remaining, respecting topic limits
        if len(selected) < top_n:
            remaining = [m for m in scored_markets if m["id"] not in selected_ids]
            remaining.sort(key=lambda x: x["score"], reverse=True)
            for market in remaining:
                if len(selected) >= top_n:
                    break
                # Check topic diversity
                topic_sig = self._get_topic_signature(market["title"])
                topic_count = topic_counts.get(topic_sig, 0)
                
                if topic_count < max_per_topic:
                    selected.append(market)
                    selected_ids.add(market["id"])
                    topic_counts[topic_sig] = topic_count + 1

        # Sort final selection by score
        selected.sort(key=lambda x: x["score"], reverse=True)

        if self.debug:
            print(f"Topic distribution: {dict(sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:5])}")

        return selected[:top_n]

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
            positive_keywords = self._extract_keywords(watchlist_titles, top_n=6)
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
        watchlist_titles = {m.get("title", "").lower().strip() for m in watchlist}

        for market_id, market in candidates.items():
            # Skip markets already in watchlist (check both ID and title)
            if market_id in watchlist_ids:
                if self.debug:
                    print(f"\n  SKIPPED (in watchlist by ID): '{market['title'][:40]}...'")
                continue

            if market["title"].lower().strip() in watchlist_titles:
                if self.debug:
                    print(f"\n  SKIPPED (in watchlist by title): '{market['title'][:40]}...'")
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

        # Step 5: Diverse selection with quota per keyword
        recommendations = self._select_diverse_results(
            scored_markets, positive_keywords, top_n
        )

        if self.debug:
            print(f"\n{'='*60}")
            print(f"TOP {top_n} RECOMMENDATIONS (diverse)")
            print(f"{'='*60}")
            for i, rec in enumerate(recommendations, 1):
                penalty_flag = " [PENALIZED]" if rec.get("penalized") else ""
                print(f"{i}. Score: {rec['score']:.4f}{penalty_flag} [from: {rec.get('query_matched', 'unknown')}]")
                print(f"   {rec['title']}")
                print(f"   Volume: ${rec['volume']:,} | Vol: {rec['volume_score']:.2f} | Nov: {rec['novelty_score']:.2f}")

        return recommendations
