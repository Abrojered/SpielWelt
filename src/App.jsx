import { useEffect, useState } from 'react';
import Search from './components/Search';
import Spinner from './components/Spinner';
import GameCard from './components/GameCard';
import { useDebounce } from 'react-use';
import TrendingGames from './components/TrendingGames';
import { incrementSearchCount } from './firebase';

const API_BASE_URL = 'https://api.rawg.io/api/games';

// API key loaded from environment variables
const API_KEY = import.meta.env.VITE_TGDB_API_KEY;

// API request configuration
const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
  }
};

const App = () => {
  // State for search input
  const [searchTerm, setSearchTerm] = useState ('');
  // State for error messages
  const[errorMessage, setErrorMessage ] = useState ('');
  
  // State for storing fetched games
  const [gameList, setGameList] = useState ([]);
  // State for loading indicator
  const [isLoading, setIsLoading] = useState (false);

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce the search term
  useDebounce(() => {
    setDebouncedSearchTerm(searchTerm);
  }, 500, [searchTerm] );

  // Async function to fetch games from RAWG API
  const fetchGames = async (query = '', shouldStoreSearch = false) => {
    // Start loading state
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // Construct API endpoint with API key
      const endpoint = query?`${API_BASE_URL}?key=${API_KEY}&search=${query}`:`${API_BASE_URL}?key=${API_KEY}`;
      // Make GET request to RAWG API
      const response = await fetch(endpoint, API_OPTIONS);  

      // Check if response was successful
      if (!response.ok) {
        throw new Error ('Failed to fetch games');
      }
      // Parse JSON response
      const data = await response.json();
     
      // Validate that results exist and are not empty
      if (!data.results || data.results.length === 0) {
        setErrorMessage('No games found.');
        setGameList([]); 
        return;
      }
      
      // Update state with fetched games
      setGameList(data.results);

      if (shouldStoreSearch && query && data.results.length > 0) {
        const normalize = (text) =>
          text
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s]/g, '');

        const normalizedQuery = normalize(query);
        const matchedGame = data.results.find(
          (game) => normalize(game.name) === normalizedQuery
        );

        if (matchedGame) {
          incrementSearchCount(query, matchedGame);
        }
        // Do NOT count if no matchedGame (do nothing)
      }
      
      // Log results for debugging
      console.log(data.results);
     
    } catch (error) {
      // Handle any errors during fetch
  // Fetch games when component mounts
      console.error('Error fetching games:', error);
      setErrorMessage('Failed to fetch games. Please try again later.');
    } finally {
      // Stop loading state
      setIsLoading(false);
    } 

  }
  
  const handleSearchSubmit = () => {
    const query = searchTerm.trim();
    if (!query) return;

    fetchGames(query, true);
  };

  useEffect(() => {
   fetchGames(debouncedSearchTerm, false);
  }, [debouncedSearchTerm]);

  return (
    <main>
      {/* Background pattern */}
      <div className= "pattern" />

      <div className= "wrapper" >

       {/* Header section with logo and search */}
       <header>
          <img src="/Game_bild.png" alt="Game Bild" className="mx-auto mb-4 max-w-xs rounded-2xl opacity-80" />
          <h1> <span className='fancy-text'>Spiel</span> <span className="text-gradient">Welt</span></h1> 
          
       
          <Search
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSearchSubmit={handleSearchSubmit}
          />
       
       </header>
       
       
       

       <section className="trending-section">
         <TrendingGames />
       </section>

       {/* Games list section */}
       <section className="all-games">
          <h2 className='mt-[40px]'> All Games </h2>

            {/* Conditional rendering: show spinner while loading, error message if error, or game list */}
            {isLoading ? (
              <Spinner />
            ) : errorMessage ? (
              <p className="error-message">{errorMessage}</p>
            ) : (
              <ul>
                {/* Map through games and display each game name */}
                {gameList.map((game) => (
                  <GameCard key={game.id} game={game} /> 
                ))}
              </ul>
            )} 
       </section>

       
      </div>
    </main>
  )
}

export default App
