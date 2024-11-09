import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function ManageOrders() {
  const { restaurantId } = useParams();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/restaurants/${restaurantId}/orders`);
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, [restaurantId]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`http://localhost:3000/api/orders/${orderId}/status`, { status: newStatus });
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const statusSteps = ['Order Placed', 'In the Kitchen', 'Out for Delivery', 'Delivered'];

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-400 to-blue-500 p-6 flex flex-col items-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl">
        <h1 className="text-5xl font-extrabold text-center text-gray-800 mb-12">Manage Orders</h1>
        {orders.map((order) => (
          <div key={order.id} className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Order #{order.id}</h2>
            <div className="space-y-4">
              {statusSteps.map((step, index) => (
                <div key={index} className={`p-4 rounded-lg ${order.status >= index ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  {step}
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between">
              {order.status < statusSteps.length - 1 && (
                <button
                  onClick={() => updateOrderStatus(order.id, order.status + 1)}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  {order.status === 1 ? 'Mark as Out for Delivery' : 'Next Status'}
                </button>
              )}
              {order.status > 0 && (
                <button
                  onClick={() => updateOrderStatus(order.id, order.status - 1)}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Previous Status
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}