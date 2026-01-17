import React, { useState, useEffect, useRef } from 'react';
import './Navbar.css';

function Navbar() {
  const [show, setShow] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShow(true);
      } else {
        setShow(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`navbar ${show && 'navbar__black'}`}>
      <div className="navbar__contents">
        <div className="navbar__left">
          <img src="/images/polyflix.png" alt="Polyflix" className="navbar__logo" />
          <div className="navbar__links">
            <span>Home</span>
            <span>Trending</span>
            <span>Politics</span>
            <span>Crypto</span>
            <span>Sports</span>
            <span>My Markets</span>
          </div>
        </div>
        
        <div className="navbar__right">
          <div className="navbar__search">
            <input
              ref={searchInputRef}
              className={`navbar__search-input ${searchOpen ? 'navbar__search-input--open' : ''}`}
              type="text"
              placeholder="Topics, tags, markets"
              onBlur={(e) => {
                if (!e.relatedTarget || !e.relatedTarget.closest('.navbar__search')) {
                  setSearchOpen(false);
                }
              }}
            />
            <svg 
              className="navbar__icon navbar__search-icon" 
              viewBox="0 0 24 24" 
              width="24" 
              height="24"
              onMouseDown={(e) => {
                e.preventDefault();
                if (searchOpen) {
                  setSearchOpen(false);
                } else {
                  setSearchOpen(true);
                  setTimeout(() => searchInputRef.current?.focus(), 300);
                }
              }}
            >
              <path fill="currentColor" fillRule="evenodd" d="M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0m-1.38 7.03a9 9 0 1 1 1.41-1.41l5.68 5.67-1.42 1.42z" clipRule="evenodd"></path>
            </svg>
          </div>
          <svg className="navbar__icon" viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" fillRule="evenodd" d="M13 4.07A7 7 0 0 1 19 11v4.25q1.58.12 3.1.28l-.2 2a93 93 0 0 0-19.8 0l-.2-2q1.52-.15 3.1-.28V11a7 7 0 0 1 6-6.93V2h2zm4 11.06V11a5 5 0 0 0-10 0v4.13a97 97 0 0 1 10 0m-8.37 4.24C8.66 20.52 10.15 22 12 22s3.34-1.48 3.37-2.63c.01-.22-.2-.37-.42-.37h-5.9c-.23 0-.43.15-.42.37" clipRule="evenodd"></path>
          </svg>
          <div className="navbar__avatar">
            <span>P</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Navbar;