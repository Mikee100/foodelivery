import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ProcessedOrders() {
  const [processedOrders, setProcessedOrders] = useState([]);

  useEffect(() => {
    fetchProcessedOrders();
  }, []);

  const fetchProcessedOrders = async () => {
    const restaurantId = localStorage.getItem('restaurantId'); // Get the restaurant ID from local storage

    if (!restaurantId) {
      console.error('Restaurant ID not found in localStorage');
      return;
    }

    try {
      const response = await axios.get(`http://localhost:3000/api/processedorders/processed?restaurantId=${restaurantId}`);
     
      if (Array.isArray(response.data)) {
        setProcessedOrders(response.data);
      } else {
        console.error('Unexpected response format:', response.data);
      }
    } catch (error) {
      console.error('Error fetching processed orders:', error);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-6xl mt-8">
      <h2 className="text-2xl font-bold mb-4">Processed Orders</h2>
      {processedOrders.length === 0 ? (
        <p>No processed orders found.</p>
      ) : (
        processedOrders.map((order) => (
          <div key={order.id} className="mb-4 p-4 border rounded">
            <h3 className="text-xl font-bold mb-2">Order #{order.id}</h3>
            <p className="mb-2">Meal: {order.meal_name}</p>
            <p className="mb-2">Quantity: {order.quantity}</p>
            <p className="mb-2">Status: {order.status}</p>
          </div>
        ))
      )}
    </div>
  );
}