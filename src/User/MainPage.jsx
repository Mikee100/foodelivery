import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiStar, FiClock, FiMapPin } from 'react-icons/fi';
import { FaUtensils, FaFilter } from 'react-icons/fa';

export default function MainPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const cuisineTypes = [
    'All', 'Italian', 'Mexican', 'Japanese', 
    'American', 'Indian', 'Chinese', 'Mediterranean'
  ];

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('http://localhost:3000/api/restaurants');
        // Ensure each restaurant has required fields with defaults
        const restaurantsWithDefaults = response.data.map(restaurant => ({
          id: restaurant.id || '',
          name: restaurant.name || 'Unnamed Restaurant',
          image: restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          cuisine: restaurant.cuisine || 'International',
          rating: restaurant.rating || 0,
          reviews: restaurant.reviews || 0,
          openingTime: restaurant.openingTime || '09:00',
          closingTime: restaurant.closingTime || '21:00',
          location: restaurant.location || 'Location not specified',
          description: restaurant.description || 'A wonderful dining experience'
        }));
        setRestaurants(restaurantsWithDefaults);
        setFilteredRestaurants(restaurantsWithDefaults);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  useEffect(() => {
    let results = restaurants;
    
    // Apply search filter with null checks
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(restaurant => {
        const name = restaurant.name?.toLowerCase() || '';
        const cuisine = restaurant.cuisine?.toLowerCase() || '';
        return name.includes(term) || cuisine.includes(term);
      });
    }
    
    // Apply category filter with null check
    if (activeFilter !== 'all') {
      results = results.filter(restaurant => {
        const cuisine = restaurant.cuisine?.toLowerCase() || '';
        return cuisine === activeFilter.toLowerCase();
      });
    }
    
    setFilteredRestaurants(results);
  }, [searchTerm, activeFilter, restaurants]);

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      if (isNaN(hour)) return timeString;
      
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${minutes} ${period}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  };

  const handleRestaurantClick = (id) => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      sessionStorage.setItem('redirectRestaurantId', id);
      navigate('/login');
    } else {
      navigate(`/restaurant/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-gray-800">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto mb-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="md:w-1/2 mb-6 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Discover Amazing Restaurants</h1>
            <p className="text-xl mb-6 opacity-90">
              {user ? `Welcome back, ${user.username}! Ready to explore?` : 'Find your next favorite dining spot'}
            </p>
            {!user && (
              <Link 
                to="/login" 
                className="inline-block bg-white text-blue-600 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Sign In to Book Tables
              </Link>
            )}
          </div>
          <div className="md:w-1/2 flex justify-center">
            <img 
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" 
              alt="Dining experience" 
              className="rounded-xl shadow-2xl w-full max-w-md"
            />
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400 text-xl" />
          </div>
          <input
            type="text"
            placeholder="Search restaurants or cuisines..."
            className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaFilter className="mr-2" /> Filter by Cuisine
          </h2>
          <div className="flex flex-wrap gap-2">
            {cuisineTypes.map((cuisine) => (
              <button
                key={cuisine}
                onClick={() => setActiveFilter(cuisine === 'All' ? 'all' : cuisine)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilter === (cuisine === 'All' ? 'all' : cuisine.toLowerCase()) 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'}`}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Restaurant Grid */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredRestaurants.length > 0 ? (
          <>
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <FaUtensils className="mr-2" /> {activeFilter === 'all' ? 'All Restaurants' : `${activeFilter} Restaurants`}
              <span className="ml-2 text-sm font-normal bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {filteredRestaurants.length} {filteredRestaurants.length === 1 ? 'result' : 'results'}
              </span>
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredRestaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  onClick={() => handleRestaurantClick(restaurant.id)}
                  className="cursor-pointer bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                >
                  <div className="relative">
                    <img 
                      src={restaurant.image} 
                      alt={restaurant.name} 
                      className="w-full h-56 object-cover transition duration-500 group-hover:opacity-90"
                    />
                    <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-semibold shadow-md flex items-center">
                      <FiStar className="text-yellow-500 mr-1" /> {restaurant.rating}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                      <h3 className="text-white text-xl font-bold">{restaurant.name}</h3>
                      <div className="flex items-center text-white text-sm mt-1">
                        <FiMapPin className="mr-1" /> {restaurant.location}
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-center mb-3">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        {restaurant.cuisine}
                      </span>
                      <div className="text-sm text-gray-600 flex items-center">
                        <FiClock className="mr-1" /> {formatTime(restaurant.openingTime)} - {formatTime(restaurant.closingTime)}
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {restaurant.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        View Menu
                      </button>
                      <div className="text-sm text-gray-500">
                        {restaurant.distance ? `${restaurant.distance} miles away` : 'Nearby'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🍽️</div>
            <h3 className="text-2xl font-semibold mb-2">No restaurants found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setActiveFilter('all');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Featured Section */}
      {!isLoading && filteredRestaurants.length > 0 && (
        <div className="max-w-7xl mx-auto mt-16">
          <h2 className="text-2xl font-bold mb-6">Featured Restaurants</h2>
          <div className="grid grid-cols-1 gap-6">
            {restaurants.slice(0, 2).map((restaurant) => (
              <div 
                key={`featured-${restaurant.id}`}
                onClick={() => handleRestaurantClick(restaurant.id)}
                className="cursor-pointer bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <div className="md:flex">
                  <div className="md:w-1/3">
                    <img 
                      src={restaurant.image} 
                      alt={restaurant.name} 
                      className="w-full h-64 md:h-full object-cover"
                    />
                  </div>
                  <div className="p-8 md:w-2/3">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">{restaurant.name}</h3>
                        <div className="flex items-center text-gray-600 mb-4">
                          <FiMapPin className="mr-1" /> {restaurant.location}
                          <span className="mx-3">•</span>
                          <FiClock className="mr-1" /> Open until {formatTime(restaurant.closingTime)}
                        </div>
                      </div>
                      <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                        <FiStar className="mr-1" /> {restaurant.rating}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-6">
                      {restaurant.description}
                    </p>
                    <div className="flex flex-wrap gap-3 mb-6">
                      <span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">
                        {restaurant.cuisine}
                      </span>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                      Reserve a Table
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}