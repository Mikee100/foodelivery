import React, { useState, useEffect } from 'react';
import ProcessedOrders from './ProcessedOrders';

export default function ProcessedOrdersPage() {
  const [restaurantName, setRestaurantName] = useState('');

  useEffect(() => {
    fetchRestaurantDetails();
  }, []);

  const fetchRestaurantDetails = async () => {
    const restaurantId = localStorage.getItem('restaurantId');
    if (!restaurantId) {
      console.error('Restaurant ID not found in localStorage');
      return;
    }
    // Optionally fetch restaurant details if needed
  };

  return (
    <div>
      <h2 className="text-3xl font-semibold mb-6 text-gray-800">Processed Orders</h2>
      <ProcessedOrders />
    </div>
  );
} 