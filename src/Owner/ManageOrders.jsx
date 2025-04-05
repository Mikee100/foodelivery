import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCheckCircle, FaTruck, FaUtensils } from 'react-icons/fa';

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const restaurantId = localStorage.getItem('restaurantId');
    if (!restaurantId) return console.error('Restaurant ID not found in localStorage');

    try {
      const response = await axios.get(`http://192.168.158.75:3000/api/orders?restaurantId=${restaurantId}`);
      const unprocessedOrders = response.data.filter(order => order.status !== 'Delivered');
      setOrders(unprocessedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`http://192.168.158.75:3000/api/orders/${orderId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  return (
    <div className="bg-gray-50 p-8 rounded-lg shadow-lg w-full max-w-6xl mt-8">
      <h2 className="text-3xl font-semibold mb-6 text-gray-800">Manage Orders</h2>
      {orders.map((order) => (
        <div key={order.id} className="mb-4 p-6 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold text-gray-700">Order #{order.order_number}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(order.status)}`}>
              {order.status}
            </span>
          </div>
          <p className="text-gray-600 mb-1"><strong>Meal:</strong> {order.meal_name}</p>
          <p className="text-gray-600 mb-3"><strong>Description:</strong> {order.meal_description}</p>
          <p className="text-gray-600 mb-3"><strong>Quantity:</strong> {order.quantity}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {order.is_spicy && <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium">Spicy</span>}
            {order.add_drink && <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">Add Drink - {order.selected_drink}</span>}
            {order.with_fries && <span className="bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full text-xs font-medium">With Fries</span>}
            {order.with_soda && <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">With Soda</span>}
            {order.extra_cheese && <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs font-medium">Extra Cheese</span>}
            {order.extra_sauce && <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-medium">Extra Sauce</span>}
            {order.with_salad && <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">With Salad</span>}
            {order.with_chilly && <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium">With Chilly</span>}
            {order.with_pasta && <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">With Pasta</span>}
          </div>
          <div className="flex space-x-2">
            <StatusButton label="In the Kitchen" onClick={() => handleUpdateOrderStatus(order.id, 'In the Kitchen')} color="yellow" icon={<FaUtensils />} />
            <StatusButton label="Out for Delivery" onClick={() => handleUpdateOrderStatus(order.id, 'Out for Delivery')} color="orange" icon={<FaTruck />} />
            <StatusButton label="Delivered" onClick={() => handleUpdateOrderStatus(order.id, 'Delivered')} color="green" icon={<FaCheckCircle />} />
          </div>
        </div>
      ))}
    </div>
  );
}

const colorClasses = {
  yellow: 'bg-yellow-500 hover:bg-yellow-600',
  orange: 'bg-orange-500 hover:bg-orange-600',
  green: 'bg-green-500 hover:bg-green-600',
};

function StatusButton({ label, onClick, color, icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center ${colorClasses[color]} text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline transition-colors`}
    >
      {icon} <span className="ml-2">{label}</span>
    </button>
  );
}

function getStatusClass(status) {
  switch (status) {
    case 'In the Kitchen':
      return 'bg-yellow-100 text-yellow-800';
    case 'Out for Delivery':
      return 'bg-orange-100 text-orange-800';
    case 'Delivered':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}