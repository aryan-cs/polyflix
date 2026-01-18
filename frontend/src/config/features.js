// Feature flags - easily toggle between Gemini and non-Gemini modes
// 
// USE_GEMINI_MODE:
//   - true: Uses Gemini AI API for generating interests, categories, and summaries
//   - false: Uses keyword-based algorithms (no API calls, works offline)
//
// This flag affects:
//   - ProfilePage: interests, category breakdown, AI summary
//   - ForYou: interest-based recommendations
//
// To switch modes, simply change the value below:
export const USE_GEMINI_MODE = false; // Change to true to enable Gemini API calls
