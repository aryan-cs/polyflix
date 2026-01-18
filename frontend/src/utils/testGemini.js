// Test file for Gemini API
const testGeminiAPI = async () => {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyB7OuQ0g_DO_79ucovAYqoi6f0SluuA1Lo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Hello, what is 2+2?'
          }]
        }]
      })
    });

    console.log('Response Status:', response.status);
    const data = await response.json();
    console.log('Response Data:', data);
    
    if (response.ok) {
      console.log('✅ API is working!');
      console.log('Response:', data.candidates?.[0]?.content?.parts?.[0]?.text);
    } else {
      console.log('❌ API Error:', data);
    }
  } catch (error) {
    console.error('❌ Fetch Error:', error);
  }
};

// Call this in browser console to test
// testGeminiAPI();
