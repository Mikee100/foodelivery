import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUtensils, FaClipboardList, FaTruck, FaHistory, FaTags } from 'react-icons/fa';
import { restaurantAPI } from '../services/api';

export default function OwnerDashboard() {
  const [restaurantName, setRestaurantName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurantDetails();
  }, []);

  const fetchRestaurantDetails = async () => {
    const restaurantId = localStorage.getItem('restaurantId');
    if (!restaurantId) {
      console.error('Restaurant ID not found in localStorage');
      return;
    }
    try {
      const response = await restaurantAPI.getById(restaurantId);
      setRestaurantName(response.data.name);
    } catch (error) {
      console.error('Error fetching restaurant details:', error.response || error);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <FaUtensils className="text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">Manage Meals</h3>
              <p className="text-gray-600 text-sm">Add and edit menu items</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/owner/meals')}
            className="w-full mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Go to Meals
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <FaClipboardList className="text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">Manage Orders</h3>
              <p className="text-gray-600 text-sm">View and update order status</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/owner/orders')}
            className="w-full mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Go to Orders
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <FaTruck className="text-purple-600 text-xl" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">Delivery Team</h3>
              <p className="text-gray-600 text-sm">Manage delivery persons</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/owner/delivery-persons')}
            className="w-full mt-4 bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Manage Delivery
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-full">
              <FaHistory className="text-orange-600 text-xl" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">Order History</h3>
              <p className="text-gray-600 text-sm">View completed orders</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/owner/processed-orders')}
            className="w-full mt-4 bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            View History
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 rounded-full">
              <FaTags className="text-indigo-600 text-xl" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">Categories</h3>
              <p className="text-gray-600 text-sm">Organize your menu</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/owner/categories')}
            className="w-full mt-4 bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Manage Categories
          </button>
        </div>
      </div>
      {/* Quick Stats Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-gray-600">Pending Orders</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-gray-600">Today's Orders</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">0</div>
            <div className="text-sm text-gray-600">Active Meals</div>
          </div>
        </div>
      </div>
    </div>
  );
}