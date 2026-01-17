import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import HomeScreen from './pages/HomeScreen';
import MyWatchlists from './pages/MyWatchlists';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/watchlists" element={<MyWatchlists />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;