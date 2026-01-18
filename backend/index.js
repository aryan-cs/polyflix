const express = require('express');
const cors = require('cors');
const polymarketRoutes = require('./routes/polymarket');
const videoRoutes = require('./routes/video');
const imageRoutes = require('./routes/images');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/polymarket', polymarketRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/images', imageRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});