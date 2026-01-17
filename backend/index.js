const express = require('express');
const cors = require('cors');
const polymarketRoutes = require('./routes/polymarket');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.use('/api/polymarket', polymarketRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});