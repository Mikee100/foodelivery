import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ManageMeals() {
  const [meals, setMeals] = useState([]);
  const [mealName, setMealName] = useState('');
  const [mealImage, setMealImage] = useState('');
  const [mealDescription, setMealDescription] = useState('');
  const [mealPrice, setMealPrice] = useState('');
  const [mealCategory, setMealCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [mealToModify, setMealToModify] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMeals();
    fetchCategories();
  }, []);

  const fetchMeals = async () => {
    const restaurantId = localStorage.getItem('restaurantId');
    if (!restaurantId) {
      console.error('Restaurant ID not found in localStorage');
      return;
    }

    try {
      const response = await axios.get(`http://roundhouse.proxy.rlwy.net:3000/api/restaurants/${restaurantId}/meals`);
      setMeals(response.data);
    } catch (error) {
      console.error('Error fetching meals:', error);
    }
  };

  const fetchCategories = async () => {
    const restaurantId = localStorage.getItem('restaurantId');
    if (!restaurantId) {
      console.error('Restaurant ID not found in localStorage');
      return;
    }

    try {
      const response = await axios.get(`http://roundhouse.proxy.rlwy.net:3000/api/restaurants/${restaurantId}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    const restaurant_id = localStorage.getItem('restaurantId');
    try {
      await axios.post('http://roundhouse.proxy.rlwy.net:3000/api/meals', {
        name: mealName,
        image: mealImage,
        description: mealDescription,
        price: mealPrice,
        category_id: mealCategory,
        restaurant_id,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      fetchMeals();
      setMealName('');
      setMealImage('');
      setMealDescription('');
      setMealPrice('');
      setMealCategory('');
    } catch (error) {
      console.error('Error adding meal:', error);
    }
  };

  const handleModifyMeal = (meal) => {
    setMealToModify(meal);
    navigate(`/modify-meal/${meal.id}`);
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-8">Manage Meals</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {meals.map((meal) => (
          <div key={meal.id} className="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-lg font-semibold mb-2">{meal.name}</h3>
            <img
              src={meal.image}
              alt={meal.name}
              className="w-full h-40 object-cover rounded mb-3"
            />
            <p className="text-sm text-gray-700 mb-2">{meal.description}</p>
            <p className="font-bold text-gray-800 mb-4">Ksh {meal.price}</p>
            <button
              onClick={() => handleModifyMeal(meal)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold py-1 px-3 rounded transition duration-200"
            >
              Modify
            </button>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold mt-10 mb-4">Add a New Meal</h2>
      <form onSubmit={handleAddMeal} className="bg-gray-100 p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label htmlFor="mealName" className="block text-sm font-semibold text-gray-700 mb-1">
              Meal Name
            </label>
            <input
              type="text"
              id="mealName"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter meal name"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="mealImage" className="block text-sm font-semibold text-gray-700 mb-1">
              Meal Image URL
            </label>
            <input
              type="text"
              id="mealImage"
              value={mealImage}
              onChange={(e) => setMealImage(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter image URL"
              required
            />
          </div>
          <div className="mb-4 md:col-span-2">
            <label htmlFor="mealDescription" className="block text-sm font-semibold text-gray-700 mb-1">
              Meal Description
            </label>
            <textarea
              id="mealDescription"
              value={mealDescription}
              onChange={(e) => setMealDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter meal description"
              rows="3"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="mealPrice" className="block text-sm font-semibold text-gray-700 mb-1">
              Meal Price (Ksh)
            </label>
            <input
              type="number"
              id="mealPrice"
              value={mealPrice}
              onChange={(e) => setMealPrice(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter price"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="mealCategory" className="block text-sm font-semibold text-gray-700 mb-1">
              Meal Category
            </label>
            <select
              id="mealCategory"
              value={mealCategory}
              onChange={(e) => setMealCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition duration-200"
        >
          Add Meal
        </button>
      </form>
    </div>
  );
}