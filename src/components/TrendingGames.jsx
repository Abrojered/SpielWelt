import { useEffect, useState } from 'react';
import GameCard from './GameCard';
import { getTrendingGames } from '../firebase';

// Base URL for the RAWG game API
const API_BASE_URL = 'https://api.rawg.io/api/games';
// API key loaded from environment variables for secure access to RAWG API
const API_KEY = import.meta.env.VITE_TGDB_API_KEY;
// Default options for every fetch request to RAWG
const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
  },
};

const TrendingGames = () => {
  const [games, setGames] = useState([]);       // List of fully-enriched trending games
  const [isLoading, setIsLoading] = useState(true); // True while data is being fetched
  const [error, setError] = useState('');           // Holds any error message to display

  useEffect(() => {
    
    const loadTrending = async () => {
      setIsLoading(true);
      setError(''); // Reset any previous error before a new fetch

      try {
        //  Get the top 5 trending game documents from Firestore
        
        const trending = await getTrendingGames(5);

        //  Enrich each Firestore doc with full game data from RAWG
        
        const detailedGames = await Promise.all(
          trending.map(async (doc) => {
           
            const searchTerm = doc.searchTerm || doc.gameName || '';
            const gameId = doc.gameId || doc.id;

            try {
              // If gameId is a valid number, fetch by ID (faster, more accurate).
              // Otherwise fall back to a search query using the game name.
              const endpoint = Number(gameId) && gameId !== ''
                ? `${API_BASE_URL}/${gameId}?key=${API_KEY}`
                : `${API_BASE_URL}?key=${API_KEY}&search=${encodeURIComponent(searchTerm)}`;

              const response = await fetch(endpoint, API_OPTIONS);
              if (!response.ok) {
                throw new Error('Failed to fetch game details');
              }

              const data = await response.json();

              // RAWG returns a single object when fetched by ID 
              // but an array in data.results when fetched by search — handle both cases
              const gameData = data?.id ? data : data?.results?.[0];

              // Merge Firestore metadata with RAWG data.
              // Firestore values act as fallbacks if RAWG data is missing.
              return {
                id: doc.id,
                ...gameData,                                                    // Spread all RAWG fields (name, rating, platforms, etc.)
                name: gameData?.name || doc.gameName || searchTerm,             // Prefer RAWG name
                background_image: gameData?.background_image || doc.posterUrl || undefined, // Prefer RAWG image
                count: doc.count || 0,                                          // Search count from Firestore
              };
            } catch (fetchError) {
              // If RAWG fetch fails for a single game, log and return a minimal fallback object
              // so the rest of the trending list still renders correctly
              console.error('Trending game detail fetch failed:', fetchError, doc);
              return {
                id: doc.id,
                name: doc.gameName || searchTerm,
                background_image: doc.posterUrl || undefined,
                count: doc.count || 0,
              };
            }
          })
        );

        // Update state with the fully-enriched list
        setGames(detailedGames);
      } catch (err) {
        // handles failures in getTrendingGames itself 
        console.error('Unable to load trending games:', err);
        setError('Unable to load trending games.');
      } finally {
        // Always stop the loading spinner, whether the fetch succeeded or failed
        setIsLoading(false);
      }
    };

    loadTrending(); // Trigger the async function on component mount
  }, []); // Empty dependency array = runs once on mount only

  return (
    <div className="trending-games">
      <h2>Trending Games</h2>

      {/* Conditional rendering: spinner → error → empty state → game list */}
      {isLoading ? (
        <p>Loading trending games...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : games.length === 0 ? (
        <p>No trending games yet.</p>
      ) : (
        <div className="game-card flex flex-wrap justify-center items-stretch gap-4 p-6">
          {games.map((game, idx) => {
            // Define 5 descending purple shades — one per rank position (1st = darkest)
            const rankColors = [
              { color: 'text-purple-500', stroke: 'text-purple-400' },
              { color: 'text-purple-400', stroke: 'text-purple-300' },
              { color: 'text-purple-300', stroke: 'text-purple-200' },
              { color: 'text-purple-200', stroke: 'text-purple-100' },
              { color: 'text-purple-100', stroke: 'text-purple-500' },
            ];
            //  access rank color; fall back to index 0 if somehow out of range
            const rankColor = rankColors[idx] || rankColors[0];

            return (
              
              <div key={game.id} className="flex flex-col items-center w-32 relative">
                {/*  rank number displayed beside the game card */}
                <span
                  className={`absolute -left-4 top-1/2 -translate-y-1/2 text-[4rem] font-extrabold drop-shadow-lg select-none ${rankColor.color}`}
                  style={{ WebkitTextStroke: `1.5px ${rankColor.stroke}`, opacity: 0.7 }}
                >
                  {idx + 1} {/* Display rank  */}
                </span>

                {/* Only render the image if a URL exists — avoids broken img  */}
                {game.background_image && (
                  <img src={game.background_image} alt={game.name} className="w-full rounded-lg mb-2" />
                )}

                {/* Game title */}
                <div className="text-center text-white font-semibold text-sm line-clamp-2">{game.name}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TrendingGames;