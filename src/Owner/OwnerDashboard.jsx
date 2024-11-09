import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModifyMeal from './ModifyMeal';
import { useNavigate } from 'react-router-dom';

export default function OwnerDashboard() {
  const [meals, setMeals] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [mealName, setMealName] = useState('');
  const [mealImage, setMealImage] = useState('');
  const [mealDescription, setMealDescription] = useState('');
  const [mealPrice, setMealPrice] = useState('');
  const [deliveryPersonName, setDeliveryPersonName] = useState('');
  const [deliveryPersonEmail, setDeliveryPersonEmail] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [activeSection, setActiveSection] = useState('meals');
  const [mealToModify, setMealToModify] = useState(null);

  useEffect(() => {
    fetchRestaurantDetails();
    fetchMeals();
    fetchOrders();
    fetchDeliveryPersons();
  }, []);

  const fetchRestaurantDetails = async () => {
    const restaurantId = localStorage.getItem('restaurantId'); // Get the restaurant ID from local storage

    if (!restaurantId) {
      console.error('Restaurant ID not found in localStorage');
      return;
    }

    try {
      const response = await axios.get(`http://localhost:3000/api/restaurants/${restaurantId}`);
      setRestaurantName(response.data.name);
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
    }
  };

  const fetchMeals = async () => {
    const restaurantId = localStorage.getItem('restaurantId'); // Get the restaurant ID from local storage

    if (!restaurantId) {
      console.error('Restaurant ID not found in localStorage');
      return;
    }

    try {
      const response = await axios.get(`http://localhost:3000/api/restaurants/${restaurantId}/meals`);
      setMeals(response.data);
    } catch (error) {
      console.error('Error fetching meals:', error);
    }
  };

  const fetchOrders = async () => {
    const restaurantId = localStorage.getItem('restaurantId'); // Get the restaurant ID from local storage

    if (!restaurantId) {
      console.error('Restaurant ID not found in localStorage');
      return;
    }

    try {
      const response = await axios.get(`http://localhost:3000/api/orders?restaurantId=${restaurantId}`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchDeliveryPersons = async () => {
    const restaurantId = localStorage.getItem('restaurantId'); // Get the restaurant ID from local storage

    if (!restaurantId) {
      console.error('Restaurant ID not found in localStorage');
      return;
    }

    try {
      const response = await axios.get(`http://localhost:3000/api/restaurants/${restaurantId}/delivery-persons`);
      setDeliveryPersons(response.data);
    } catch (error) {
      console.error('Error fetching delivery persons:', error);
    }
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    const restaurant_id = localStorage.getItem('restaurantId'); // Get the restaurant ID from local storage
    try {
      await axios.post('http://localhost:3000/api/meals', {
        name: mealName,
        image: mealImage,
        description: mealDescription,
        price: mealPrice,
        restaurant_id,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      fetchMeals();
      setMealName('');
      setMealImage('');
      setMealDescription('');
      setMealPrice('');
    } catch (error) {
      console.error('Error adding meal:', error);
    }
  };

  const handleAddDeliveryPerson = async (e) => {
    e.preventDefault();
    const restaurantId = localStorage.getItem('restaurantId'); // Get the restaurant ID from local storage
    try {
      await axios.post('http://localhost:3000/api/delivery-persons', {
        name: deliveryPersonName,
        email: deliveryPersonEmail,
        restaurantId,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setDeliveryPersonName('');
      setDeliveryPersonEmail('');
      fetchDeliveryPersons();
    } catch (error) {
      console.error('Error adding delivery person:', error);
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
  const navigate = useNavigate();
  const handleModifyMeal = (mealId) => {
    navigate(`/modify-meal/${mealId}`);
  };

  const handleSaveMeal = async (updatedMeal) => {
    try {
      await axios.put(`http://localhost:3000/api/meals/${updatedMeal.id}`, updatedMeal);
      fetchMeals();
      setMealToModify(null);
    } catch (error) {
      console.error('Error saving meal:', error);
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
            onClick={() => setActiveSection('addMeal')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2 w-full text-left"
          >
            Add Meal
          </button>
          <button
            onClick={() => setActiveSection('addDeliveryPerson')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2 w-full text-left"
          >
            Add Delivery Person
          </button>
        </div>
      </nav>

      <main className="flex-grow container mt-12 mx-auto p-6">
        {activeSection === 'meals' && (
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-6xl mt-8">
            <h2 className="text-2xl font-bold mb-4">Meals in the System</h2>
            {meals.map((meal) => (
              <div key={meal.id} className="mb-4 p-4 border rounded">
                <h3 className="text-xl font-bold mb-2">Name: {meal.name}</h3>
                <img className="mb-1" src={meal.image} alt={meal.image} />
                <p className="mb-2">Description: {meal.description}</p>
                <p className="mb-2">Price: Ksh{meal.price}</p>
                <button
                  onClick={() => handleModifyMeal(meal.id)}
                  className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Modify
                </button>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'orders' && (
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
        )}

        {activeSection === 'deliveryPersons' && (
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-6xl mt-8">
            <h2 className="text-2xl font-bold mb-4">Delivery Persons</h2>
            {deliveryPersons.map((person) => (
              <div key={person.id} className="mb-4 p-4 border rounded">
                <h3 className="text-xl font-bold mb-2">Name: {person.name}</h3>
                <p className="mb-2">Email: {person.email}</p>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'addMeal' && (
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-6xl mt-8">
            <h2 className="text-2xl font-bold mb-4">Add a New Meal</h2>
            <form onSubmit={handleAddMeal}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="mealName">
                  Meal Name
                </label>
                <input
                  type="text"
                  id="mealName"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="mealImage">
                  Meal Image URL
                </label>
                <input
                  type="text"
                  id="mealImage"
                  value={mealImage}
                  onChange={(e) => setMealImage(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="mealDescription">
                  Meal Description
                </label>
                <textarea
                  id="mealDescription"
                  value={mealDescription}
                  onChange={(e) => setMealDescription(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="mealPrice">
                  Meal Price
                </label>
                <input
                  type="number"
                  id="mealPrice"
                  value={mealPrice}
                  onChange={(e) => setMealPrice(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Add Meal
              </button>
            </form>
          </div>
        )}

        {activeSection === 'addDeliveryPerson' && (
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-6xl mt-8">
            <h2 className="text-2xl font-bold mb-4">Add a Delivery Person</h2>
            <form onSubmit={handleAddDeliveryPerson}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="deliveryPersonName">
                  Name
                </label>
                <input
                  type="text"
                  id="deliveryPersonName"
                  value={deliveryPersonName}
                  onChange={(e) => setDeliveryPersonName(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="deliveryPersonEmail">
                  Email
                </label>
                <input
                  type="email"
                  id="deliveryPersonEmail"
                  value={deliveryPersonEmail}
                  onChange={(e) => setDeliveryPersonEmail(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Add Delivery Person
              </button>
            </form>
          </div>
        )}
          {mealToModify && (
          <ModifyMeal meal={mealToModify} onSave={handleSaveMeal} />
        )}
        
      </main>
    </div>
  );
}