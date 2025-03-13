import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function RestaurantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const placeholderImage = 'https://via.placeholder.com/150'; // Placeholder image URL

  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      try {
        const restaurantResponse = await axios.get(`http://192.168.181.75:3000/api/restaurants/${id}`);
        setRestaurant(restaurantResponse.data);

        const mealsResponse = await axios.get(`http://192.168.181.75:3000/api/restaurants/${id}/meals`);
        const mealsData = mealsResponse.data;
        const groupedMeals = groupMealsByCategory(mealsData);
        setMeals(groupedMeals);
      } catch (error) {
        console.error('Error fetching restaurant details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantDetails();
  }, [id]);

  const groupMealsByCategory = (meals) => {
    const categories = {};
    meals.forEach((meal) => {
      if (!categories[meal.category_name]) {
        categories[meal.category_name] = [];
      }
      categories[meal.category_name].push(meal);
    });
    return categories;
  };

  const handleMealClick = (mealId) => {
    navigate(`/meal/${mealId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-t-blue-500 border-gray-300 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!restaurant) {
    return <div className="text-center text-xl text-red-500">Restaurant details not available.</div>;
  }

  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="relative w-full h-screen bg-gray-800">
        {/* Background Image */}
        <img
          src={restaurant.image || placeholderImage}
          alt={restaurant.name}
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-90"></div>
        
        {/* Content Overlay */}
        <div className="relative z-10 p-8 h-full flex flex-col items-center justify-center text-center text-white">
          <h1 className="text-6xl font-extrabold mb-4">{restaurant.name}</h1>
          <p className="text-gray-700 text-lg font-medium mb-4 leading-relaxed">{restaurant.description}</p>
          
          <div className="flex flex-col md:flex-row items-center md:space-x-8 text-lg">
            <div className="flex items-center mb-2 md:mb-0">
              <span className="font-bold text-xl mr-2">📍 Location:</span>
              <p>{restaurant.location}</p>
            </div>
            <div className="flex items-center">
              <span className="font-bold text-xl mr-2">📞 Contact:</span>
              <p>{restaurant.contact}</p>
            </div>
          </div>
        </div>
        
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 text-gray-800 bg-white hover:bg-gray-200 py-2 px-4 rounded-lg shadow-md"
        >
          ← Back
        </button>
      </div>

      {/* Meals Section */}
      <div className="container mx-auto max-w-6xl mt-12 px-4">
        <h2 className="text-4xl font-bold text-gray-800 mb-6 text-center">Available Meals</h2>
        {Object.keys(meals).map((category) => (
  <div key={category} className="mb-8">
    <h3 className="text-3xl font-bold text-gray-800 mb-4">{category}</h3>
    {/* Divider line below category name */}
    <hr className="border-t-2 border-gray-300 mb-6" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {meals[category].map((meal) => (
        <div
          key={meal.id}
          className="bg-white rounded-lg shadow-2xl overflow-hidden transform transition-transform hover:scale-105 hover:shadow-lg cursor-pointer"
          onClick={() => handleMealClick(meal.id)}
        >
          <img src={meal.image} alt={meal.name} className="w-full h-48 object-cover" />
          <div className="p-4">
            <h3 className="text-3xl font-bold mb-3">{meal.name}</h3>
            <p className="text-gray-700 mb-3">{meal.description}</p>
            <p className="text-gray-900 font-bold">Ksh {meal.price}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
))}

      </div>
    </div>
  );
}
