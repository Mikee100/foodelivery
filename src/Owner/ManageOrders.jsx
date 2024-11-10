import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const restaurantId = localStorage.getItem('restaurantId'); // Get the restaurant ID from local storage

    if (!restaurantId) {
      console.error('Restaurant ID not found in localStorage');
      return;
    }

    try {
      const response = await axios.get(`http://localhost:3000/api/orders?restaurantId=${restaurantId}`);
      // Filter out processed orders
      const unprocessedOrders = response.data.filter(order => order.status !== 'Delivered');
      setOrders(unprocessedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`http://localhost:3000/api/orders/${orderId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-6xl mt-8">
      <h2 className="text-2xl font-bold mb-4">Manage Orders</h2>
      {orders.map((order) => (
        <div key={order.id} className="mb-4 p-4 border rounded">
          <h3 className="text-xl font-bold mb-2">Order #{order.id}</h3>
          <p className="mb-2">Meal: {order.meal_name}</p>
          <p className="mb-2">Quantity: {order.quantity}</p>
          <p className="mb-2">Status: {order.status}</p>
          <div className="flex space-x-2">
            <button
              onClick={() => handleUpdateOrderStatus(order.id, 'In the Kitchen')}
              className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
            >
              In the Kitchen
            </button>
            <button
              onClick={() => handleUpdateOrderStatus(order.id, 'Out for Delivery')}
              className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
            >
              Out for Delivery
            </button>
            <button
              onClick={() => handleUpdateOrderStatus(order.id, 'Delivered')}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
            >
              Delivered
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}