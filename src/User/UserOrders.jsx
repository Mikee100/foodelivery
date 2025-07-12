import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ClipLoader from 'react-spinners/ClipLoader';
import { FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';

export default function UserOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId'); // Assuming user ID is stored in local storage

  useEffect(() => {
    fetchUserOrders();
  }, []);

  const fetchUserOrders = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/users/${userId}/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching user orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <FiCheckCircle className="text-green-500 mr-2" />;
      case 'Pending':
        return <FiClock className="text-yellow-500 mr-2" />;
      case 'Cancelled':
        return <FiXCircle className="text-red-500 mr-2" />;
      default:
        return <FiClock className="text-gray-500 mr-2" />;
    }
  };

  return (
    <div className="container mx-auto px-4 mt-16 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Your Orders</h1>
      {loading ? (
        <div className="flex justify-center">
          <ClipLoader color="#3B82F6" size={50} />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-center text-gray-500">You have no previous orders.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-8 rounded-xl shadow-lg transition duration-300 hover:shadow-2xl transform hover:scale-105"
              style={{ minHeight: '300px' }} // Increased height
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-3xl font-semibold">Order #{order.order_number}</h3>
              
              </div>
              <p className="mb-4 text-gray-800 text-lg"><strong>Meal:</strong> {order.meal_name}</p>
              <p className="mb-4 text-gray-800 text-lg"><strong>Quantity:</strong> {order.quantity}</p>
              <p className="text-gray-600 text-lg"><strong>Ordered on:</strong> {new Date(order.date).toLocaleDateString()}</p>
              <div className="flex items-center text-lg">
                  {getStatusIcon(order.status)}
                  <span className="text-gray-700">{order.status}</span>
                </div>
              <button className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl shadow-md hover:bg-blue-700 transition duration-300 font-semibold text-lg">
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
