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
    <div className="min-h-screen bg-gradient-to-r from-green-400 to-blue-500 p-6 flex flex-col items-center">
      <div className="w-full flex justify-end mb-4">
        {user ? (
          <div className="text-white font-bold">
            Welcome, {user.username}
          </div>
        ) : (
          <Link to="/login" className="bg-white text-blue-500 font-bold py-2 px-4 rounded shadow-lg hover:bg-gray-100">
            Login
          </Link>
        )}
      </div>
      <h1 className="text-5xl font-extrabold text-center text-white mb-12">Welcome to Our Restaurant Directory</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {restaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            onClick={() => handleRestaurantClick(restaurant.id)}
            className="cursor-pointer bg-white rounded-lg shadow-2xl overflow-hidden transform transition-transform hover:scale-105 hover:shadow-lg"
          >
            <img src={restaurant.image} alt={restaurant.name} className="w-full h-52 object-cover" />
            <div className="p-6">
              <h2 className="text-3xl font-bold mb-3">{restaurant.name}</h2>
              <p className="text-gray-700">{restaurant.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}