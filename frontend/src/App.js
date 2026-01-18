import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import HomeScreen from './pages/HomeScreen';
import MyWatchlists, { initializeDefaultWatchlists } from './pages/MyWatchlists';
import ProfilePage from './pages/ProfilePage';
import Culture from './pages/Culture';
import Politics from './pages/Politics';
import Crypto from './pages/Crypto';
import Sports from './pages/Sports';
import ForYou from './pages/ForYou';
import SearchResults from './pages/SearchResults';

function App() {
  useEffect(() => {
    initializeDefaultWatchlists();
  }, []);
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/foryou" element={<ForYou />} />
          <Route path="/culture" element={<Culture />} />
          <Route path="/politics" element={<Politics />} />
          <Route path="/crypto" element={<Crypto />} />
          <Route path="/sports" element={<Sports />} />
          <Route path="/watchlists" element={<MyWatchlists />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/search" element={<SearchResults />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;