import React from 'react'

// Search receives searchTerm, SetSearchTerm and onSearchSubmit  from App.jsx

const Search = ({ searchTerm, setSearchTerm, onSearchSubmit }) => {
  return (
    // Bootstrap navbar acting as the search bar container
    <nav className="navbar custom-navbar">
      <div className="container-fluid">

        {/* Bootstrap flex form — role="search" improves screen reader accessibility */}
        <form
          className="d-flex"
          role="search"
          onSubmit={(e) => {
            e.preventDefault(); // Prevent the browser from reloading the page on submit
            onSearchSubmit?.(); // Call the parent's submit handler if it exists (optional chaining for safety)
          }}
        >
          {/* Controlled input — its value is always driven by the searchTerm state in App.jsx */}
          <input
            className="form-control me-2" 
            type="search"                
            placeholder="Search"
            aria-label="Search"           
            value={searchTerm}            // Controlled: reflects current state
            onChange={(e) => setSearchTerm(e.target.value)} // Updates parent state on every keystroke
          />

          {/* Submits the form — triggers onSubmit above */}
          <button className="btn btn-outline-success" type="submit">
            Search
          </button>
        </form>

      </div>
    </nav>
  )
}

export default Search;