import React, { useCallback, useEffect, useRef, useState } from 'react';
import './MarketModal.css';
import { getWatchlists, addMarketToWatchlist, removeMarketFromWatchlist } from '../pages/MyWatchlists';

function MarketModal({ market, onClose, watchlists: propWatchlists, onToggleWatchlist }) {
  const [isClosing, setIsClosing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState('Yes');
  const [limitPrice, setLimitPrice] = useState('');
  const [shares, setShares] = useState('');
  const [yesPrice, setYesPrice] = useState(0);
  const [noPrice, setNoPrice] = useState(0);
  const [showWatchlistDropdown, setShowWatchlistDropdown] = useState(false);
  const [checkedWatchlists, setCheckedWatchlists] = useState(new Set());
  const [watchlists, setWatchlists] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [username, setUsername] = useState(() => {
    // Use sessionStorage instead of localStorage so each tab has its own username
    const sessionUsername = sessionStorage.getItem(`polyflix_username_${market?.id}`);
    return sessionUsername || `User_${Math.random().toString(36).substring(7)}`;
  });
  const [wsConnected, setWsConnected] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [tempUsername, setTempUsername] = useState(username);
  const wsRef = useRef(null);

  const closeTimerRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const bodyRef = useRef(null);
  const dropdownRef = useRef(null);
  const tabsHeaderRef = useRef(null);

  // Load watchlists - use props if provided, otherwise load from localStorage
  useEffect(() => {
    if (propWatchlists && propWatchlists.length > 0) {
      setWatchlists(propWatchlists);
    } else {
      setWatchlists(getWatchlists());
    }
  }, [propWatchlists]);

  // Initialize checked watchlists when market or watchlists change
  useEffect(() => {
    if (!market || watchlists.length === 0) return;

    // Find which watchlists already contain this market
    const containingWatchlists = watchlists
      .filter(w => w.markets.some(m => m.id === market.id))
      .map(w => w.id);

    setCheckedWatchlists(new Set(containingWatchlists));
  }, [market, watchlists]);

  // Log market on open
  useEffect(() => {
    if (!market) return;

    setIsClosing(false);
    setIsExpanded(false);
    setShowWatchlistDropdown(false);
    
    // Load chat messages from localStorage for this market
    const savedMessages = localStorage.getItem(`chat_${market.id}`);
    if (savedMessages) {
      try {
        setChatMessages(JSON.parse(savedMessages));
      } catch (e) {
        setChatMessages([]);
      }
    } else {
      setChatMessages([]);
    }
    
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }, [market]);

  // Generate AI-powered suggested questions when market loads
  useEffect(() => {
    if (!market || aiMessages.length > 0) return;

    const generateQuestions = async () => {
      try {
        const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
        const URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

        const response = await fetch(URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': API_KEY
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Generate 4 concise, specific questions a trader might ask about this prediction market. Make them actionable and directly related to the market topic.

Market: "${market.title || market.question}"
Category: ${market.category}

Format your response as a JSON array with exactly 4 questions. Example:
["Question 1?", "Question 2?", "Question 3?", "Question 4?"]

Only return the JSON array, nothing else.`
              }]
            }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          try {
            // Extract JSON array from response
            const jsonMatch = text.match(/\[.*\]/s);
            if (jsonMatch) {
              const questions = JSON.parse(jsonMatch[0]);
              setSuggestedQuestions(questions.slice(0, 4));
            }
          } catch (e) {
            console.error('Error parsing questions:', e);
          }
        }
      } catch (error) {
        console.error('Error generating questions:', error);
      }
    };

    generateQuestions();
  }, [market]);

  // Parse prices from Gamma API data
  useEffect(() => {
    if (!market) return;

    // outcomePrices comes as a JSON string from Gamma API like "[\"0.029\", \"0.971\"]"
    let prices = market.outcomePrices;

    // Parse if it's a string
    if (typeof prices === 'string') {
      try {
        prices = JSON.parse(prices);
      } catch (e) {
        prices = null;
      }
    }

    if (Array.isArray(prices) && prices.length >= 2) {
      setYesPrice(Math.round(parseFloat(prices[0]) * 100));
      setNoPrice(Math.round(parseFloat(prices[1]) * 100));
    } else {
      // Fallback to 50/50 if no price data
      setYesPrice(50);
      setNoPrice(50);
    }
  }, [market]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowWatchlistDropdown(false);
      }
    };

    if (showWatchlistDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showWatchlistDropdown]);

  const handleClose = useCallback(() => {
    setIsClosing((prev) => {
      if (prev) return prev;
      closeTimerRef.current = window.setTimeout(() => {
        onCloseRef.current();
      }, 250);
      return true;
    });
  }, []);

  const handleTrade = () => {
    // Trading not implemented - would require wallet connection
  };

  const handleToggleWatchlist = (watchlistId) => {
    const isCurrentlyChecked = checkedWatchlists.has(watchlistId);
    const newChecked = new Set(checkedWatchlists);

    if (isCurrentlyChecked) {
      newChecked.delete(watchlistId);
      // If we have a callback from parent (MyWatchlists page), use it
      if (onToggleWatchlist) {
        onToggleWatchlist(watchlistId, market, false);
      } else {
        // Otherwise update localStorage directly
        const updated = removeMarketFromWatchlist(watchlistId, market.id);
        setWatchlists(updated);
      }
    } else {
      newChecked.add(watchlistId);
      if (onToggleWatchlist) {
        onToggleWatchlist(watchlistId, market, true);
      } else {
        const updated = addMarketToWatchlist(watchlistId, market);
        setWatchlists(updated);
      }
    }

    setCheckedWatchlists(newChecked);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !wsConnected || !wsRef.current) return;

    try {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        username: username,
        text: chatInput.trim(),
        marketId: market.id,
        timestamp: new Date().toLocaleTimeString()
      }));
      
      setChatInput('');
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  };

  const handleSetUsername = (newUsername) => {
    if (newUsername.trim()) {
      setUsername(newUsername.trim());
      // Store in sessionStorage per market so each tab has its own username
      if (market?.id) {
        sessionStorage.setItem(`polyflix_username_${market.id}`, newUsername.trim());
      }
      setTempUsername(newUsername.trim());
      setShowUsernameModal(false);
      // Reconnect WebSocket with new username
      if (wsRef.current) {
        wsRef.current.close();
      }
    }
  };

  const handleAiChat = async () => {
    if (!aiInput.trim()) return;

    const userMessage = aiInput.trim();
    setAiInput('');
    
    // Add user message to chat
    setAiMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'user',
      text: userMessage,
      timestamp: new Date().toLocaleTimeString()
    }]);

    setAiLoading(true);

    try {
      // Create context about the market
      const marketContext = `
        Market Question: ${market.title || market.question}
        Category: ${market.category}
        Yes Price: ${yesPrice}¢
        No Price: ${noPrice}¢
        Volume: ${market.volumeNum ? `$${(market.volumeNum / 1000000).toFixed(1)}M` : 'Unknown'}
        End Date: ${market.endDate || 'TBD'}
      `;

      const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
      const URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

      const response = await fetch(URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': API_KEY
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a helpful assistant analyzing prediction markets. Here is the market context:\n${marketContext}\n\nUser question: ${userMessage}\n\nProvide a concise, informative response about this market or the user's question.`
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API Error:', errorData);
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
      
      // Keep responses concise - limit to first 500 characters if too long
      if (aiText.length > 500) {
        aiText = aiText.substring(0, 500).trim() + '...';
      }

      // Add AI response to chat
      setAiMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (error) {
      console.error('❌ AI Error:', error);
      setAiMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: `❌ Error: ${error.message}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSuggestedQuestion = (question) => {
    setAiInput(question);
    // Trigger the AI chat after setting input
    setTimeout(() => {
      handleAiChat();
    }, 100);
  };

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClose]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  // Update tab indicator position
  useEffect(() => {
    if (!tabsHeaderRef.current) return;
    
    const activeBtn = tabsHeaderRef.current.querySelector('.marketModal__tab-btn.active');
    if (!activeBtn) return;

    const indicator = tabsHeaderRef.current.querySelector('::after');
    const left = activeBtn.offsetLeft;
    const width = activeBtn.offsetWidth;

    // Update CSS variables for the sliding indicator
    tabsHeaderRef.current.style.setProperty('--tab-left', `${left}px`);
    tabsHeaderRef.current.style.setProperty('--tab-width', `${width}px`);
  }, [activeTab]);

  // Save chat messages to localStorage whenever they change
  useEffect(() => {
    if (market?.id && chatMessages.length > 0) {
      localStorage.setItem(`chat_${market.id}`, JSON.stringify(chatMessages));
    }
  }, [chatMessages, market?.id]);

  // WebSocket connection for Watch Party
  useEffect(() => {
    if (activeTab !== 'watchparty' || !market) return;

    const connectWebSocket = () => {
      try {
        const wsUrl = `ws://localhost:5003/chat/${market.id}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('✅ WebSocket connected to Watch Party for market:', market.id);
          setWsConnected(true);
          
          // Send username when connecting
          ws.send(JSON.stringify({
            type: 'join',
            username: username,
            marketId: market.id
          }));
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'message' || message.type === 'user_join') {
              setChatMessages(prev => [...prev, {
                id: Date.now(),
                username: message.username,
                text: message.text || `${message.username} joined the chat`,
                timestamp: new Date().toLocaleTimeString(),
                type: message.type
              }]);
            }
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          setWsConnected(false);
        };

        ws.onclose = () => {
          console.log('⚠️ WebSocket disconnected');
          setWsConnected(false);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('❌ Failed to connect to WebSocket:', error);
        setWsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [activeTab, market?.id, username]);

  if (!market) return null;

  const description = market.question || 'No description available yet for this market.';
  const shouldTruncate = description.length > 220;
  const visibleDescription =
    !shouldTruncate || isExpanded
      ? description
      : `${description.slice(0, 200).trim()}...`;

  const outcomePairs = Array.isArray(market.outcomePairs)
    ? market.outcomePairs
    : [];
  const showOutcomeList = outcomePairs.length > 0 && !market.hasBinaryOutcomes;

  const volume = market.volumeNum ? `$${(market.volumeNum / 1000000).toFixed(1)}M` : '—';

  const watchlistCount = checkedWatchlists.size;

  return (
    <div
      className={`marketModal ${isClosing ? 'marketModal--closing' : ''}`}
      onClick={handleClose}
    >
      {showUsernameModal && (
        <div className="marketModal__username-modal">
          <div className="marketModal__username-content">
            <h3>Change Username</h3>
            <input
              type="text"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              placeholder="Enter your username"
              onKeyPress={(e) => e.key === 'Enter' && handleSetUsername(tempUsername)}
              autoFocus
            />
            <div className="marketModal__username-buttons">
              <button
                className="marketModal__username-btn-confirm"
                onClick={() => handleSetUsername(tempUsername)}
              >
                Confirm
              </button>
              <button
                className="marketModal__username-btn-cancel"
                onClick={() => setShowUsernameModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        className="marketModal__dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="marketModal__close"
          onClick={handleClose}
          aria-label="Close"
        >
          ×
        </button>

        <div
          className="marketModal__hero"
          style={{ backgroundImage: `url(${market.image})` }}
        />

        <div className="marketModal__body" ref={bodyRef}>
          <h2 className="marketModal__title">{market.title || market.question}</h2>

          <div className="marketModal__meta">
            <span className="marketModal__badge">{market.category || 'Market'}</span>
            <span className="marketModal__end">
              Ends {market.endDate || 'TBD'}
            </span>
            <div className="marketModal__watchlist-container" ref={dropdownRef}>
              <button
                className={`marketModal__watchlist-btn ${watchlistCount > 0 ? 'marketModal__watchlist-btn--active' : ''}`}
                onClick={() => setShowWatchlistDropdown(!showWatchlistDropdown)}
              >
                {watchlistCount > 0 ? `★ In ${watchlistCount} List${watchlistCount > 1 ? 's' : ''}` : '+ Watchlist'}
              </button>

              {showWatchlistDropdown && (
                <div className="marketModal__watchlist-dropdown">
                  <div className="marketModal__watchlist-header">
                    Add to Watchlist
                  </div>
                  {watchlists.length === 0 ? (
                    <div className="marketModal__watchlist-empty">
                      <p>No watchlists yet.</p>
                      <p>Go to My Watchlists to create one!</p>
                    </div>
                  ) : (
                    <div className="marketModal__watchlist-list">
                      {watchlists.map((watchlist) => (
                        <label key={watchlist.id} className="marketModal__watchlist-item">
                          <input
                            type="checkbox"
                            checked={checkedWatchlists.has(watchlist.id)}
                            onChange={() => handleToggleWatchlist(watchlist.id)}
                          />
                          <span className="marketModal__watchlist-checkbox">
                            {checkedWatchlists.has(watchlist.id) && '✓'}
                          </span>
                          <span className="marketModal__watchlist-name">{watchlist.name}</span>
                          <span className="marketModal__watchlist-count">
                            {watchlist.markets.length}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <p className="marketModal__description">
            {visibleDescription}
            {shouldTruncate && (
              <button
                className="marketModal__readMore"
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
              >
                {isExpanded ? 'Read Less' : 'Read More'}
              </button>
            )}
          </p>

          {showOutcomeList ? (
            <>
              <div className="marketModal__outcomes">
                <h4 className="marketModal__outcomes-title">Outcomes</h4>
                <div className="marketModal__outcomes-list">
                  {outcomePairs.map((outcome, index) => (
                    <div key={`${outcome.label}-${index}`} className="marketModal__outcome">
                      <span className="marketModal__outcome-name">
                        {outcome.label}
                      </span>
                      <span className="marketModal__outcome-price">
                        {outcome.price}¢
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="marketModal__stats marketModal__stats--compact">
                <div className="marketModal__stat">
                  <span className="marketModal__stat-label">Volume</span>
                  <span className="marketModal__stat-value">{volume}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="marketModal__trading-panel">
              <div className="marketModal__stats">
                <div className="marketModal__stat">
                  <span className="marketModal__stat-label">Yes</span>
                  <span className="marketModal__stat-value marketModal__stat-value--yes">
                    {yesPrice}¢
                  </span>
                </div>
                <div className="marketModal__stat">
                  <span className="marketModal__stat-label">No</span>
                  <span className="marketModal__stat-value marketModal__stat-value--no">
                    {noPrice}¢
                  </span>
                </div>
                <div className="marketModal__stat">
                  <span className="marketModal__stat-label">Volume</span>
                  <span className="marketModal__stat-value">{volume}</span>
                </div>
              </div>

              <div className="marketModal__trading-form">
                <div className="marketModal__form-group">
                  <label>Outcome</label>
                  <div className="marketModal__outcome-buttons">
                    <button
                      className={`marketModal__outcome-btn ${selectedOutcome === 'Yes' ? 'active' : ''}`}
                      onClick={() => setSelectedOutcome('Yes')}
                    >
                      Yes ({yesPrice}¢)
                    </button>
                    <button
                      className={`marketModal__outcome-btn ${selectedOutcome === 'No' ? 'active' : ''}`}
                      onClick={() => setSelectedOutcome('No')}
                    >
                      No ({noPrice}¢)
                    </button>
                  </div>
                </div>

                <div className="marketModal__form-group">
                  <label>Limit Price (¢)</label>
                  <input
                    type="number"
                    placeholder="Enter limit price"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    min="1"
                    max="99"
                  />
                </div>

                <div className="marketModal__form-group">
                  <label>Shares</label>
                  <input
                    type="number"
                    placeholder="Enter number of shares"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    min="1"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            className="marketModal__cta"
            onClick={handleTrade}
          >
            Trade Now
          </button>

          <div className="marketModal__tabs">
            <div className="marketModal__tabs-header" ref={tabsHeaderRef}>
              <button
                className={`marketModal__tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Ask AI
              </button>
              <button
                className={`marketModal__tab-btn ${activeTab === 'watchparty' ? 'active' : ''}`}
                onClick={() => setActiveTab('watchparty')}
              >
                Watch Party
              </button>
            </div>

            <div className="marketModal__tabs-content">
              {activeTab === 'overview' && (
                <div className="marketModal__tab-pane">
                  <h4>Ask AI</h4>
                  <div className="marketModal__ai-chat">
                    <div className="marketModal__ai-messages">
                      {aiMessages.length === 0 ? (
                        <div className="marketModal__ai-empty">
                          <p>👋 Ask me anything about this market!</p>
                          <p style={{ fontSize: '0.9rem', color: '#888' }}>Questions, analysis, predictions...</p>
                        </div>
                      ) : (
                        aiMessages.map((msg) => (
                          <div key={msg.id} className={`marketModal__ai-message marketModal__ai-message--${msg.sender}`}>
                            <div className="marketModal__ai-sender">{msg.sender === 'user' ? 'You' : '🤖 AI'}</div>
                            <div className="marketModal__ai-text">{msg.text}</div>
                            <div className="marketModal__ai-timestamp">{msg.timestamp}</div>
                          </div>
                        ))
                      )}
                      {aiLoading && (
                        <div className="marketModal__ai-message marketModal__ai-message--ai">
                          <div className="marketModal__ai-sender">🤖 AI</div>
                          <div className="marketModal__ai-text">
                            <span className="marketModal__ai-loading">Thinking...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {aiMessages.length === 0 && !aiLoading && (
                      <div className="marketModal__ai-suggestions">
                        <p className="marketModal__ai-suggestions-title">💡 Try asking:</p>
                        {suggestedQuestions.length > 0 ? (
                          suggestedQuestions.map((question, index) => (
                            <button
                              key={index}
                              className="marketModal__ai-suggestion-btn"
                              onClick={() => handleSuggestedQuestion(question)}
                            >
                              {question}
                            </button>
                          ))
                        ) : (
                          <p style={{ color: '#888', fontSize: '0.9rem' }}>Loading suggestions...</p>
                        )}
                      </div>
                    )}

                    <div className="marketModal__ai-input-container">
                      <input
                        type="text"
                        className="marketModal__ai-input"
                        placeholder="Ask about this market..."
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAiChat()}
                        disabled={aiLoading}
                      />
                      <button
                        className="marketModal__ai-send"
                        onClick={handleAiChat}
                        disabled={aiLoading || !aiInput.trim()}
                      >
                        {aiLoading ? '...' : 'Send'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'watchparty' && (
                <div className="marketModal__tab-pane">
                  <h4>Watch Party</h4>
                  <div className="marketModal__chat-header-info">
                    <span>👤 Joined as: <strong>{username}</strong></span>
                    <button
                      className="marketModal__change-username-btn"
                      onClick={() => {
                        setTempUsername(username);
                        setShowUsernameModal(true);
                      }}
                    >
                      Change Name
                    </button>
                  </div>
                  <div className="marketModal__chat">
                    <div className="marketModal__chat-messages">
                      {chatMessages.length === 0 ? (
                        <div className="marketModal__chat-empty">
                          <p>No messages yet. Be the first to comment!</p>
                        </div>
                      ) : (
                        chatMessages.map((msg) => (
                          <div key={msg.id} className={`marketModal__chat-message marketModal__chat-message--${msg.type}`}>
                            <span className="marketModal__chat-username">{msg.username}</span>
                            <span className="marketModal__chat-text">{msg.text}</span>
                            <span className="marketModal__chat-timestamp">{msg.timestamp}</span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="marketModal__chat-input-container">
                      <input
                        type="text"
                        className="marketModal__chat-input"
                        placeholder="Type your message..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        disabled={!wsConnected}
                      />
                      <button
                        className="marketModal__chat-send"
                        onClick={handleSendMessage}
                        disabled={!wsConnected || !chatInput.trim()}
                      >
                        {wsConnected ? 'Send' : 'Connecting...'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketModal;