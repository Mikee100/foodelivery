import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModifyMeal from './ModifyMeal';
import ManageOrders from './ManageOrders';
import ManageDeliveryPersons from './ManageDeliveryPersons';
import ManageMeals from './ManageMeals';
import ProcessedOrders from './ProcessedOrders';
import ManageCategories from './ManageCategories';

export default function OwnerDashboard() {
  const [restaurantName, setRestaurantName] = useState('');
  const [activeSection, setActiveSection] = useState('meals');

  useEffect(() => {
    fetchRestaurantDetails();
  }, []);

  const fetchRestaurantDetails = async () => {
    const restaurantId = localStorage.getItem('restaurantId'); // Get the restaurant ID from local storage

    if (!restaurantId) {
      console.error('Restaurant ID not found in localStorage');
      return;
    }

    try {
      const response = await axios.get(`http://192.168.181.75:3000/api/restaurants/${restaurantId}`);
      setRestaurantName(response.data.name);
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <nav className="bg-blue-600 mt-16 p-4 shadow-md w-64 ">
        <div className="container mx-auto flex flex-col items-start">
          <h1 className="text-white text-2xl font-bold mb-4">{restaurantName} Dashboard</h1>
          <button
            onClick={() => setActiveSection('meals')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2 w-full text-left"
          >
            Meals
          </button>
          <button
            onClick={() => setActiveSection('orders')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2 w-full text-left"
          >
            Orders
          </button>
          <button
            onClick={() => setActiveSection('deliveryPersons')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2 w-full text-left"
          >
            Delivery Persons
          </button>
          <button
            onClick={() => setActiveSection('processedOrders')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2 w-full text-left"
          >
            Processed Orders
          </button>
          <button
            onClick={() => setActiveSection('categories')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2 w-full text-left"
          >
            Categories
          </button>
        </div>
      </nav>

      <main className="flex-grow container mt-12 mx-auto p-6">
        {activeSection === 'meals' && <ManageMeals />}
        {activeSection === 'orders' && <ManageOrders />}
        {activeSection === 'deliveryPersons' && <ManageDeliveryPersons />}
        {activeSection === 'processedOrders' && <ProcessedOrders />}
        {activeSection === 'categories' && <ManageCategories />}
      </main>
    </div>
  );
}