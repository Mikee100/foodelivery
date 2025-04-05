import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowRight } from 'react-icons/fa'; // For arrow icon

export default function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search).get('query');
  const filter = new URLSearchParams(location.search).get('filter');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await axios.get(`http://192.168.158.75:3000/api/search?query=${query}&filter=${filter}`);
        setResults(response.data);
      } catch (error) {
        console.error('Error searching for meals and restaurants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, filter]);

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.restaurant_name]) {
      acc[result.restaurant_name] = [];
    }
    acc[result.restaurant_name].push(result);
    return acc;
  }, {});

  const handleMealClick = (mealId) => {
    navigate(`/meal/${mealId}`);
  };

  const handleRestaurantClick = (restaurantId) => {
    navigate(`/restaurant/${restaurantId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-16 ">
      <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
        Search Results for "<span className="text-blue-600">{query}</span>"
      </h1>

      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-500 border-opacity-50"></div>
        </div>
      ) : (
        Object.keys(groupedResults).length === 0 ? (
          <p className="text-center text-gray-600 text-lg">No results found for "{query}".</p>
        ) : (
          Object.keys(groupedResults).map((category) => (
            <div key={category} className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-700 border-b border-gray-200 pb-2">
                  {category}
                </h2>
                {filter === 'meals' && (
                  <div
                    onClick={() => handleRestaurantClick(groupedResults[category][0].restaurant_id)}
                    className="text-blue-500 font-semibold hover:text-blue-600 flex items-center cursor-pointer transition-colors duration-200"
                  >
                    Visit Restaurant <FaArrowRight className="ml-2" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedResults[category].map((item) => (
                  <div
                    key={item.meal_id || item.restaurant_id}
                    className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                    onClick={() => item.meal_id ? handleMealClick(item.meal_id) : handleRestaurantClick(item.restaurant_id)}
                  >
                    {item.image && <img src={item.image} alt={item.meal_name || item.restaurant_name} className="w-full h-48 object-cover rounded-lg mb-4" />}
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.meal_name || item.restaurant_name}</h3>
                    {item.description && <p className="text-gray-600 mb-4">{item.description}</p>}
                    {item.price && (
                      <div className="flex items-center justify-between">
                        <span className="text-blue-600 font-semibold bg-blue-100 px-3 py-1 rounded-full">
                          ${item.price}
                        </span>
                        <button className="text-white bg-blue-500 hover:bg-blue-600 font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                          View Details
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )
      )}
    </div>
  );
}