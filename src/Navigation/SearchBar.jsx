import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?query=${query}`);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSearch} className="flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border rounded-l-lg py-2 px-4"
          placeholder="Search for meals..."
        />
        <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded-r-lg">
          Search
        </button>
      </form>
    </div>
  );
}