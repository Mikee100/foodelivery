import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function RestaurantDetails() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [meals, setMeals] = useState([]);

  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      try {
        const restaurantResponse = await axios.get(`http://localhost:3000/api/restaurants/${id}`);
        setRestaurant(restaurantResponse.data);

        const mealsResponse = await axios.get(`http://localhost:3000/api/restaurants/${id}/meals`);
        setMeals(mealsResponse.data);
      } catch (error) {
        console.error('Error fetching restaurant details:', error);
      }
    };

    fetchRestaurantDetails();
  }, [id]);

  if (!restaurant) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-r mt-16 from-green-400 to-blue-500 p-6 flex flex-col items-center">
     
      <div className="w-full max-w-10xl  bg-white rounded-lg shadow-lg overflow-hidden mb-12 ">

        <img src={restaurant.image} alt={restaurant.name} className="w-full h-64 object-cover" />
        <div className="p-6">
        <h1 className="text-5xl font-extrabold text-center text-black ">{restaurant.name}</h1>
          <p className="text-gray-700 text-lg mb-4">{restaurant.description}</p>
          <p className="text-gray-700 text-lg mb-4"><strong>Location:</strong> {restaurant.location}</p>
          <p className="text-gray-700 text-lg mb-4"><strong>Contact:</strong> {restaurant.contact}</p>
        </div>
      </div>
      <h2 className="text-4xl font-bold text-white mb-6">Meals</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {meals.map((meal) => (
          <Link to={`/meal/${meal.id}`} key={meal.id} className="bg-white rounded-lg shadow-2xl overflow-hidden transform transition-transform hover:scale-105 hover:shadow-lg">
            <img src={meal.image} alt={meal.name} className="w-full  object-cover" />
            <div className="p-2">
              <h3 className="text-3xl font-bold mb-3">{meal.name}</h3>
              <p className="text-gray-700">{meal.description}</p>
              <p className="text-gray-900 font-bold">Ksh{meal.price}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}