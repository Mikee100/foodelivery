import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function OwnerDashboard() {
  const [restaurantName, setRestaurantName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurantDetails();
  }, []);

  const fetchRestaurantDetails = async () => {
    const restaurantId = localStorage.getItem('restaurantId');
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    console.log('Owner Dashboard Debug:', {
      restaurantId,
      token: token ? 'Token exists' : 'No token',
      userRole,
      allLocalStorage: Object.keys(localStorage)
    });

    if (!restaurantId) {
      console.error('Restaurant ID not found in localStorage');
      return;
    }

    if (!token) {
      console.error('Authentication token not found in localStorage');
      return;
    }

    try {
      const response = await axios.get(`http://localhost:3000/api/restaurants/${restaurantId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Restaurant details response:', response.data);
      setRestaurantName(response.data.name);
    } catch (error) {
      console.error('Error fetching restaurant details:', error.response || error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-600 shadow-md">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-white text-3xl font-bold">{restaurantName} Dashboard</h1>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Meals Management</h2>
            <p className="text-gray-600 mb-4">Manage your restaurant's menu items, add new meals, and update existing ones.</p>
            <button
              onClick={() => navigate('/owner/meals')}
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors"
            >
              Manage Meals
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Orders Management</h2>
            <p className="text-gray-600 mb-4">View and manage incoming orders, update order status, and track deliveries.</p>
            <button
              onClick={() => navigate('/owner/orders')}
              className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded transition-colors"
            >
              Manage Orders
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Delivery Persons</h2>
            <p className="text-gray-600 mb-4">Manage your delivery team, assign orders, and track delivery performance.</p>
            <button
              onClick={() => navigate('/owner/delivery-persons')}
              className="w-full bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded transition-colors"
            >
              Manage Delivery
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Processed Orders</h2>
            <p className="text-gray-600 mb-4">View completed orders and analyze your restaurant's performance history.</p>
            <button
              onClick={() => navigate('/owner/processed-orders')}
              className="w-full bg-orange-500 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded transition-colors"
            >
              View History
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Categories</h2>
            <p className="text-gray-600 mb-4">Organize your menu with categories to improve customer browsing experience.</p>
            <button
              onClick={() => navigate('/owner/categories')}
              className="w-full bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded transition-colors"
            >
              Manage Categories
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}