const express = require('express');
const router = express.Router();

const GEMINI_API_KEY = 'AIzaSyB7OuQ0g_DO_79ucovAYqoi6f0SluuA1Lo';

router.post('/ask', async (req, res) => {
  try {
    const { question, marketContext } = req.body;

    if (!question || !marketContext) {
      return res.status(400).json({ error: 'Missing question or market context' });
    }

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a helpful assistant analyzing prediction markets. Here is the market context:\n${marketContext}\n\nUser question: ${question}\n\nProvide a concise, informative response about this market or the user's question.`
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      return res.status(response.status).json({ 
        error: errorData.error?.message || 'Failed to generate response' 
      });
    }

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

    res.json({ response: aiText });
  } catch (error) {
    console.error('❌ Server Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
