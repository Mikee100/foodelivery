import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function MealDetails() {
  const { id } = useParams();
  const [meal, setMeal] = useState(null);

  useEffect(() => {
    const fetchMealDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/meals/${id}`);
        setMeal(response.data);
      } catch (error) {
        console.error('Error fetching meal details:', error);
      }
    };

    fetchMealDetails();
  }, [id]);

  if (!meal) {
    return <div>Loading...</div>;
  }
  console.log("my meal:", meal);
  return (
    <div className="min-h-screen bg-gradient-to-r from-green-400 to-blue-500 p-6 flex flex-col items-center">
      <h1 className="text-5xl font-extrabold text-center text-white mb-12">{meal.name}</h1>
      <img src={meal.image} alt={meal.name} className="w-full h-48 object-cover mb-8" />
      <p className="text-white text-lg mb-6">{meal.description}</p>
      <p className="text-white text-lg mb-6 font-bold">Price: ${meal.price}</p>
    </div>
  );
}