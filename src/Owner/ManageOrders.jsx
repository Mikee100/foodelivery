import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCheckCircle, FaTruck, FaUtensils } from 'react-icons/fa';

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const testBackendConnection = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/restaurants/1');
      console.log('Backend connection test successful:', response.data);
      setDebugInfo(prev => ({ ...prev, backendConnection: 'Success' }));
    } catch (error) {
      console.error('Backend connection test failed:', error);
      setDebugInfo(prev => ({ ...prev, backendConnection: `Failed: ${error.message}` }));
    }
  };

  const fetchOrders = async () => {
    const restaurantId = localStorage.getItem('restaurantId');
    const token = localStorage.getItem('token');

    console.log('ManageOrders Debug:', {
      restaurantId,
      token: token ? 'Token exists' : 'No token',
      allLocalStorage: Object.keys(localStorage)
    });

    if (!restaurantId) {
      console.error('Restaurant ID not found in localStorage');
      setError('Restaurant ID not found. Please log in again.');
      setLoading(false);
      return;
    }

    if (!token) {
      console.error('Authentication token not found in localStorage');
      setError('Authentication token not found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      console.log('Making API call to:', `http://localhost:3000/api/orders?restaurantId=${restaurantId}`);
      
      const response = await axios.get(`http://localhost:3000/api/orders?restaurantId=${restaurantId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Orders response:', response.data);
      console.log('Total orders received:', response.data.length);
      
      const unprocessedOrders = response.data.filter(order => order.status !== 'Delivered');
      console.log('Unprocessed orders:', unprocessedOrders.length);
      
      setOrders(unprocessedOrders);
      setLoading(false);
      setDebugInfo(prev => ({ 
        ...prev, 
        totalOrders: response.data.length,
        unprocessedOrders: unprocessedOrders.length,
        restaurantId,
        hasToken: !!token
      }));
    } catch (error) {
      console.error('Error fetching orders:', error.response || error);
      setError(`Error fetching orders: ${error.response?.data || error.message}`);
      setLoading(false);
      setDebugInfo(prev => ({ 
        ...prev, 
        error: error.response?.data || error.message,
        restaurantId,
        hasToken: !!token
      }));
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

  if (loading) {
    return (
      <div className="bg-gray-50 p-8 rounded-lg shadow-lg w-full max-w-6xl mt-8">
        <h2 className="text-3xl font-semibold mb-6 text-gray-800">Manage Orders</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 p-8 rounded-lg shadow-lg w-full max-w-6xl mt-8">
        <h2 className="text-3xl font-semibold mb-6 text-gray-800">Manage Orders</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
        <div className="flex space-x-4 mb-4">
          <button 
            onClick={fetchOrders}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Retry
          </button>
          <button 
            onClick={testBackendConnection}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Test Backend Connection
          </button>
        </div>
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Debug Information:</h3>
          <pre className="text-sm">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-8 rounded-lg shadow-lg w-full max-w-6xl mt-8">
      <h2 className="text-3xl font-semibold mb-6 text-gray-800">Manage Orders</h2>
      
      {orders.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg mb-4">No orders found</div>
          <p className="text-gray-400">There are currently no pending orders for your restaurant.</p>
          <div className="mt-4 flex justify-center space-x-4">
            <button 
              onClick={fetchOrders}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Refresh
            </button>
            <button 
              onClick={testBackendConnection}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Test Backend
            </button>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            <p>Debug Info:</p>
            <p>Restaurant ID: {localStorage.getItem('restaurantId')}</p>
            <p>Token: {localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
            <p>Total Orders: {debugInfo.totalOrders || 0}</p>
            <p>Unprocessed Orders: {debugInfo.unprocessedOrders || 0}</p>
          </div>
        </div>
      ) : (
        orders.map((order) => (
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
        ))
      )}
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