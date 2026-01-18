// Add this to your main backend server file (server.js or app.js)
const geminiRoutes = require('./gemini-api');

// Make sure this line is added after other middleware setup
app.use('/api/gemini', geminiRoutes);
