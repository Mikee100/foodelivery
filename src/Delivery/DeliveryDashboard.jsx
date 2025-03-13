import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState([]);
  const [deliveryPerson, setDeliveryPerson] = useState({
    name: '',
    email: '',
    phone: '',
    picture: '',
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [activeSection, setActiveSection] = useState('orders');
  const [error, setError] = useState('');


  useEffect(() => {
    fetchOrders();
    fetchDeliveryPersonDetails();
  }, []);

  const fetchOrders = async () => {
    const deliveryPersonId = localStorage.getItem('userId');
    const restaurantId = localStorage.getItem('restaurantId');
    
    if (!deliveryPersonId || !restaurantId) {
      console.error('Both deliveryPersonId and restaurantId are required');
      return;
    }
    
    try {
      const response = await axios.get('http://192.168.181.75:3000/api/delivery/orders', {
        params: { deliveryPersonId, restaurantId },
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error.response?.data || error.message);
    }
  };

  const fetchDeliveryPersonDetails = async () => {
    const deliveryPersonId = localStorage.getItem('userId'); // Assuming the user ID is stored in local storage
    if (!deliveryPersonId) {
      console.error('deliveryPersonId is required');
      return;
    }
    try {
      const response = await axios.get(`http://192.168.181.75:3000/api/delivery-persons/${deliveryPersonId}`);
      setDeliveryPerson(response.data);
    } catch (error) {
      console.error('Error fetching delivery person details:', error.response?.data || error.message);
    }
  };

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    const deliveryPersonId = localStorage.getItem('userId'); // Assuming the user ID is stored in local storage
    try {
      await axios.put(`http://192.168.181.75:3000/api/delivery-persons/${deliveryPersonId}`, deliveryPerson);
      alert('Details updated successfully');
    } catch (error) {
      console.error('Error updating details:', error.response?.data || error.message);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    const deliveryPersonId = localStorage.getItem('userId'); // Assuming the user ID is stored in local storage
    try {
      await axios.put(`http://192.168.181.75:3000/api/delivery-persons/${deliveryPersonId}/password`, {
        currentPassword,
        newPassword,
      });
      alert('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      console.error('Error updating password:', error.response?.data || error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDeliveryPerson((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const handleDispatchOrder = async (orderId) => {
    try {
      await axios.put(`http://192.168.181.75:3000/api/orders/${orderId}/dispatch`);
      fetchOrders(); // Refresh the orders list after dispatching
    } catch (error) {
      console.error('Error dispatching order:', error);
      setError('Error dispatching order');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <nav className="bg-blue-600 p-4 mt-16 shadow-md w-64">
        <div className="container mx-auto flex flex-col items-start">
          <h1 className="text-white text-2xl font-bold mb-4">Delivery Dashboard</h1>
          <button
            onClick={() => setActiveSection('orders')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2 w-full text-left"
          >
            Orders
          </button>
          <button
            onClick={() => setActiveSection('details')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2 w-full text-left"
          >
            Your Details
          </button>
          <button
            onClick={() => setActiveSection('password')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2 w-full text-left"
          >
            Update Password
          </button>
        </div>
      </nav>

      <main className="flex-grow container mx-auto p-6">
        {activeSection === 'orders' && (
          <>
            <h2 className="text-3xl font-bold mb-6">Orders Ready for Delivery</h2>
            {orders.length === 0 ? (
              <p className="text-gray-700">No orders ready for delivery</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold mb-2">Order #{order.order_number}</h3>
                    <p className="mb-2"><strong>Meal:</strong> {order.meal_name}</p>
                    <p className="mb-2"><strong>Description:</strong> {order.meal_description}</p>
                    <img src={order.meal_image} alt={order.meal_name} className="w-full h-48 object-cover mb-2 rounded" />
                    <p className="mb-2"><strong>Quantity:</strong> {order.quantity}</p>
                    <p className="mb-2"><strong>Pick Up From:</strong> {order.restaurant_name}, {order.restaurant_location}</p>
                    <p className="mb-2"><strong>Deliver To:</strong> {order.address}</p>
                    <p>{order.user_phone}</p>
                    <button
              onClick={() => handleDispatchOrder(order.id)}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Order Dispatched
            </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeSection === 'details' && (
          <>
            <h2 className="text-3xl font-bold mb-6">Your Details</h2>
            <form onSubmit={handleUpdateDetails} className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={deliveryPerson.name}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={deliveryPerson.email}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={deliveryPerson.phone}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="picture">
                  Picture URL
                </label>
                <input
                  type="text"
                  id="picture"
                  name="picture"
                  value={deliveryPerson.picture}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Update Details
              </button>
            </form>
          </>
        )}

        {activeSection === 'password' && (
          <>
            <h2 className="text-3xl font-bold mb-6">Update Password</h2>
            <form onSubmit={handleUpdatePassword} className="bg-white p-6 rounded-lg shadow-md">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currentPassword">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newPassword">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Update Password
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}