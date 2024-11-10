import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

export default function MainPage() {
  const [restaurants, setRestaurants] = useState([]);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/restaurants');
        setRestaurants(response.data);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      }
    };

    fetchRestaurants();
  }, []);

  const handleRestaurantClick = (id) => {
    const token = localStorage.getItem('token');
    if (!token) {
      localStorage.setItem('redirectRestaurantId', id);
      navigate('/login');
    } else {
      navigate(`/restaurant/${id}`);
    }
  };

  return (
    <div className=" bg-whitesmoke p-8 flex flex-col items-center text-black">
      <header className="w-full max-w-6xl flex justify-between items-center mb-12">
        {user ? (
          <span className="text-xl font-semibold tracking-wider">Welcome, {user.username}</span>
        ) : (
          <Link 
            to="/login" 
            className="bg-white text-blue-600 font-bold py-2 px-5 rounded-full shadow-lg hover:bg-gray-100 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 ease-out"
          >
            Login
          </Link>
        )}
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 w-full max-w-7xl">
        {restaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            onClick={() => handleRestaurantClick(restaurant.id)}
            className="cursor-pointer bg-white rounded-lg overflow-hidden shadow-xl transform transition duration-500 hover:scale-105 hover:shadow-2xl group"
          >
            <div className="relative">
              <img 
                src={restaurant.image} 
                alt={restaurant.name} 
                className="w-full h-56 object-cover transition duration-500 group-hover:opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent opacity-50 group-hover:opacity-75 transition duration-500"></div>
              <h2 className="absolute bottom-4 left-4 text-white text-3xl font-bold tracking-wide drop-shadow-md">
                {restaurant.name}
              </h2>
            </div>
            <div className="p-6 bg-gray-100">
              
              <div className="flex items-center justify-between">
                <button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                  View Details
                </button>
                <div className="text-sm font-medium text-gray-500">⭐ {restaurant.rating} | {restaurant.reviews} reviews</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
