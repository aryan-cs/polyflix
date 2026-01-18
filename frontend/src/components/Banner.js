import React, { useState, useEffect } from 'react';
import './Banner.css';
import TradeButton from './TradeButton';
import MoreInfoButton from './MoreInfoButton';

function Banner({ market, onMoreInfo }) {
  const [videoId, setVideoId] = useState(null);

  useEffect(() => {
    async function fetchVideo() {
      if (market?.title) {
        try {
          // Reset video when market changes
          setVideoId(null);
          console.log(`🎬 Banner fetching video for: ${market.title}`);
          const res = await fetch(`http://localhost:5002/api/video/search?query=${encodeURIComponent(market.title)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.videoId) {
              console.log(`✅ Banner got video: ${data.videoId}`);
              setVideoId(data.videoId);
            }
          }
        } catch (error) {
          console.error("Banner video fetch failed:", error);
        }
      }
    }
    fetchVideo();
  }, [market]);

  const truncateDescription = (desc) => {
    if (!desc) return "";
    return desc.length > 200 ? desc.substring(0, 200) + '...' : desc;
  };

  if (!market) {
    return null;
  }

  return (
    <header
      className="banner"
      style={{
        backgroundImage: !videoId ? `url(${market?.image})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
      }}
    >
      {videoId && (
        <div className="banner__videoWrapper">
           <iframe
            className="banner__video"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${videoId}&disablekb=1&rel=0&iv_load_policy=3`}
            title={market?.title}
            frameBorder="0"
            allow="autoplay; encrypted-media"
          />
          <div className="banner__videoOverlay" />
        </div>
      )}

      <div className="banner__contents">
        <h1 className="banner__title">{market?.title}</h1>

        <h2 className="banner__description">
          {truncateDescription(market?.description)}
        </h2>
        
        <div className="banner__buttons">
          <TradeButton
            optionA={market?.optionA || "Yes"}
            optionB={market?.optionB || "No"}
            onClick={onMoreInfo}
          />
          <MoreInfoButton onClick={onMoreInfo} />
        </div>
      </div>
      <div className="banner--fadeBottom" />
    </header>
  );
}

export default Banner;
