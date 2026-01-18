# Polyflix

Netflix-style UI for Polymarket prediction markets.

## Structure

- `frontend/` - React application
- `backend/` - Node.js server

## Running the Project

### Frontend and Backend

Install dependencies and start both services:

```bash
# Frontend
cd frontend
npm install
npm start

# Backend (in a separate terminal)
cd backend
npm install
npm start
```

### Recommendation API

Start the Python recommendation service:

```bash
cd backend/python
python main.py
```