import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsClosing, setNotificationsClosing] = useState(false);
  const searchInputRef = useRef(null);
  const notificationsRef = useRef(null);

  const notifications = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=150&h=85&fit=crop',
      title: 'Suggestions for Tonight',
      description: 'Explore personalized picks.',
      time: '1 day ago'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=150&h=85&fit=crop',
      title: "Don't miss out",
      description: 'Experience more Crypto markets',
      time: '3 days ago'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1509822929063-6b6cfc9b42f2?w=150&h=85&fit=crop',
      title: 'New Arrival',
      description: 'Politics predictions heating up',
      time: '2 weeks ago'
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShow(true);
      } else {
        setShow(false);
      }
    };

    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        handleCloseNotifications();
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCloseNotifications = () => {
    setNotificationsClosing(true);
    setTimeout(() => {
      setNotificationsOpen(false);
      setNotificationsClosing(false);
    }, 300);
  };

  return (
    <div className={`navbar ${show && 'navbar__black'}`}>
      <div className="navbar__contents">
        <div className="navbar__left">
          <img src="/images/polyflix.png" alt="Polyflix" className="navbar__logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
          <div className="navbar__links">
            <span onClick={() => navigate('/')}>Discover</span>
            <span onClick={() => navigate('/foryou')}>For You</span>
            <span onClick={() => navigate('/culture')}>Culture</span>
            <span onClick={() => navigate('/politics')}>Politics</span>
            <span onClick={() => navigate('/crypto')}>Crypto</span>
            <span onClick={() => navigate('/sports')}>Sports</span>
            <span onClick={() => navigate('/watchlists')}>My Watchlists</span>
          </div>
        </div>
        
        <div className="navbar__right">
          <div className="navbar__search">
            <input
              ref={searchInputRef}
              className={`navbar__search-input ${searchOpen ? 'navbar__search-input--open' : ''}`}
              type="text"
              placeholder="Topics, tags, markets"
              onKeyDown={e => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  window.location.href = `/search?q=${encodeURIComponent(e.target.value.trim())}`;
                  setSearchOpen(false);
                }
              }}
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
          <div className="navbar__notifications-container" ref={notificationsRef}>
            <svg 
              className="navbar__icon navbar__notifications-icon" 
              viewBox="0 0 24 24" 
              width="24" 
              height="24"
              onClick={() => {
                if (notificationsOpen) {
                  handleCloseNotifications();
                } else {
                  setNotificationsOpen(true);
                }
              }}
            >
              <path fill="currentColor" fillRule="evenodd" d="M13 4.07A7 7 0 0 1 19 11v4.25q1.58.12 3.1.28l-.2 2a93 93 0 0 0-19.8 0l-.2-2q1.52-.15 3.1-.28V11a7 7 0 0 1 6-6.93V2h2zm4 11.06V11a5 5 0 0 0-10 0v4.13a97 97 0 0 1 10 0m-8.37 4.24C8.66 20.52 10.15 22 12 22s3.34-1.48 3.37-2.63c.01-.22-.2-.37-.42-.37h-5.9c-.23 0-.43.15-.42.37" clipRule="evenodd"></path>
            </svg>
            {notifications.length > 0 && (
              <span className="navbar__notifications-badge">{notifications.length}</span>
            )}
            {notificationsOpen && (
              <div className={`navbar__notifications-dropdown ${notificationsClosing ? 'navbar__notifications-dropdown--closing' : ''}`}>
                <div className="navbar__notifications-list">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="navbar__notification-item">
                      <img src={notification.image} alt={notification.title} />
                      <div className="navbar__notification-content">
                        <div className="navbar__notification-title">{notification.title}</div>
                        <div className="navbar__notification-description">{notification.description}</div>
                        <div className="navbar__notification-time">{notification.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="navbar__avatar" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
            <span>P</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Navbar;