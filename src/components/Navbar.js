import React, { useState, useEffect } from 'react';
import './Navbar.css';

function Navbar() {
  const [show, setShow] = useState(false);

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
          <svg className="navbar__icon" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <span className="navbar__notifications">🔔</span>
          <div className="navbar__avatar">
            <span>P</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Navbar;