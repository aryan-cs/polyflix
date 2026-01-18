import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import HomeScreen from './pages/HomeScreen';
import MyWatchlists from './pages/MyWatchlists';
import Culture from './pages/Culture';
import Politics from './pages/Politics';
import Crypto from './pages/Crypto';
import Sports from './pages/Sports';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/culture" element={<Culture />} />
          <Route path="/politics" element={<Politics />} />
          <Route path="/crypto" element={<Crypto />} />
          <Route path="/sports" element={<Sports />} />
          <Route path="/watchlists" element={<MyWatchlists />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;