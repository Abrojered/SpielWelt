import React, { useState } from 'react'

// Receives a single `game` object from the RAWG API as a prop
const GameCard = ({ game }) => {

 
  const {
    name, released, background_image, rating, rating_top, ratings,
    ratings_count, reviews_text_count, added, added_by_status, metacritic, playtime,
    suggestions_count, updated, user_game, reviews_count, saturated_color, dominant_color,
    platforms, parent_platforms, genres, stores, clip, tags, esrb_rating, short_screenshots
  } = game;

  // Controls whether the card shows extra info (release date, genre)
  const [expanded, setExpanded] = useState(false);
  // Tracks which screenshot is currently displayed (index into short_screenshots array)
  const [screenshotIndex, setScreenshotIndex] = useState(0);
  // Stores the X position where a touch gesture began (used to detect swipe direction)
  const [touchStartX, setTouchStartX] = useState(null);



  // Record where the finger first touched the screen
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    // If there was no recorded start point, ignore this event
    if (touchStartX === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX; // Positive = swiped right, negative = swiped left

    // Only register as a swipe if the finger moved more than 40px
    if (Math.abs(diff) > 40) {
      if (diff < 0 && short_screenshots && screenshotIndex < short_screenshots.length - 1) {
        // Swiped left → go to next screenshot
        setScreenshotIndex(screenshotIndex + 1);
      } else if (diff > 0 && short_screenshots && screenshotIndex > 0) {
        // Swiped right → go to previous screenshot
        setScreenshotIndex(screenshotIndex - 1);
      }
    }
    // Reset touch start so the next gesture starts fresh
    setTouchStartX(null);
  };

  // Determine which image URL to display:

  const currentScreenshot = short_screenshots && short_screenshots.length > 0
    ? short_screenshots[screenshotIndex].image
    : (background_image || `https://picsum.photos/300/400?random=${Math.random()}`);

  return (
    // Clicking anywhere on the card toggles the expanded state.
   
    <div
      className={`game-card ${expanded ? 'expanded' : ''}`}
      onClick={() => setExpanded((current) => !current)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        // Allow keyboard users to toggle expand with Enter or Space
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setExpanded((current) => !current);
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* --- Screenshot image with navigation arrows --- */}
      <div style={{ position: 'relative' }}>

        {/* Previous arrow — only rendered if there are multiple screenshots */}
        {short_screenshots && short_screenshots.length > 1 && (
          <button
            type="button"
            aria-label="Previous screenshot"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 rounded-full p-1 text-white z-10 hover:bg-opacity-70"
            // Hidden via inline style (not unmounted) to preserve layout stability
            style={{ display: screenshotIndex > 0 ? 'block' : 'none' }}
       
            onClick={e => { e.stopPropagation(); setScreenshotIndex(screenshotIndex - 1); }}
          >
            &#8592; {/* ← left arrow character */}
          </button>
        )}

        {/* The main game image — smoothly transitions between screenshots */}
        <img
          src={currentScreenshot}
          alt={name}
          style={{ transition: 'all 0.3s' }}
        />

        {/* Next arrow — only rendered if there are multiple screenshots */}
        {short_screenshots && short_screenshots.length > 1 && (
          <button
            type="button"
            aria-label="Next screenshot"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 rounded-full p-1 text-white z-10 hover:bg-opacity-70"
            // Hidden when already on the last screenshot
            style={{ display: screenshotIndex < short_screenshots.length - 1 ? 'block' : 'none' }}
            onClick={e => { e.stopPropagation(); setScreenshotIndex(screenshotIndex + 1); }}
          >
            &#8594; {/* → right arrow character */}
          </button>
        )}
      </div>

      {/* --- Card content below the image --- */}
      <div className='mt-4'>
        <h3 className='font-semibold text-lg'>{name}</h3>

        {/* --- Platform icons row --- */}
        <div className='mt-1 flex flex-wrap gap-2'>
          {parent_platforms?.length ? (
            parent_platforms
              // Normalize: some platforms are nested as { platform: { name } }, others as { name }
              .map((p) => p?.platform?.name || p?.name)
              .filter(Boolean) // Remove any undefined/null entries
              .map((platformName) => {
                const normalized = platformName.toLowerCase();

                // Map platform name to a local icon filename
                let icon = '';
                if (normalized.includes('android')) icon = 'android.png';
                else if (normalized.includes('pc') || normalized.includes('windows')) icon = 'windows.png';
                else if (normalized.includes('xbox')) icon = 'xbox.png';
                else if (normalized.includes('linux')) icon = 'linux-platform.png';
                else if (normalized.includes('mac') || normalized.includes('apple')) icon = 'apple-logo.png';
                else if (normalized.includes('playstation')) icon = 'playstation-logotype.png';
                else if (normalized.includes('nintendo')) icon = 'nintendo-switch.png';
                // If no icon matched, falls back to showing the platform name as text

                return (
                  <span key={platformName} className='inline-flex items-center gap-1 text-xs text-gray-100'>
                    {icon ? (
                      // Show icon image if a match was found
                      <img
                        src={`/${icon}`}
                        alt={`${platformName} icon`}
                        className='h-4 w-4 object-contain'
                      />
                    ) : (
                      // Fallback: render the platform name as plain text
                      <span className='text-[10px]'>{platformName}</span>
                    )}
                  </span>
                );
              })
          ) : (
            // No platform data available at all
            <p className='text-xs text-gray-300'>Platform info unavailable</p>
          )}
        </div>

        {/* --- Star rating --- */}
        <div className='content'>
          <div className='rating'>
            <img src='/star.svg' alt='Star' />
            <p>{rating}</p> {/* e.g. 4.2 out of 5 */}
          </div>
        </div>

        {/* --- Expanded details panel (only visible when card is clicked) --- */}
        {expanded && (
          <div className="mt-3 p-3 rounded-lg bg-gray-800 bg-opacity-80 text-gray-100">
            <div>
              <strong>Release Date:</strong> {released || 'Unknown'}
            </div>
            <div>
              <strong>Genre:</strong>{' '}
              {/* Join all genre names into a comma-separated string, or show 'Unknown' */}
              {genres && genres.length > 0 ? genres.map(g => g.name).join(', ') : 'Unknown'}
            </div>
          </div>
        )}

        {/* --- Screenshot dot indicators (only shown if multiple screenshots exist) --- */}
        {short_screenshots && short_screenshots.length > 1 && (
          <div className="flex justify-center mt-2 gap-1">
            {short_screenshots.map((s, idx) => (
              <span
                key={s.id || idx}
                // Active dot is white, inactive dots are gray
                className={`inline-block w-2 h-2 rounded-full ${idx === screenshotIndex ? 'bg-white' : 'bg-gray-500'} opacity-70`}
                style={{ cursor: 'pointer' }}
                // Clicking a dot jumps directly to that screenshot
                onClick={e => { e.stopPropagation(); setScreenshotIndex(idx); }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default GameCard