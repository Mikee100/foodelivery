import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

export default function SearchResults() {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get('query');
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/search?query=${query}`);
        setResults(response.data);
      } catch (error) {
        console.error('Error searching for meals:', error);
      }
    };

    fetchResults();
  }, [query]);

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.restaurant_name]) {
      acc[result.restaurant_name] = [];
    }
    acc[result.restaurant_name].push(result);
    return acc;
  }, {});

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Search Results for "{query}"</h1>
      {Object.keys(groupedResults).map((restaurant) => (
        <div key={restaurant} className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{restaurant}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedResults[restaurant].map((meal) => (
              <div key={meal.id} className="bg-white p-4 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold mb-2">{meal.meal_name}</h3>
                <p className="text-gray-700">{meal.description}</p>
                <p className="text-gray-900 font-bold">Price: ${meal.price}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}