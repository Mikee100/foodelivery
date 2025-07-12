import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ManageMeals from './ManageMeals';

export default function MealsPage() {
  const [restaurantName, setRestaurantName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurantDetails();
  }, []);

  const fetchRestaurantDetails = async () => {
    const restaurantId = localStorage.getItem('restaurantId');
    const token = localStorage.getItem('token');

    if (!restaurantId || !token) {
      console.error('Missing restaurant ID or token');
      return;
    }

    try {
      const response = await axios.get(`http://localhost:3000/api/restaurants/${restaurantId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setRestaurantName(response.data.name);
    } catch (error) {
      console.error('Error fetching restaurant details:', error.response || error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-600 shadow-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-white text-2xl font-bold">{restaurantName} - Meals Management</h1>
            <button
              onClick={() => navigate('/owner/dashboard')}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto p-6">
        <ManageMeals />
      </div>
    </div>
  );
} 