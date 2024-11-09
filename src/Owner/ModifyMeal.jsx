// FILE: ModifyMeal.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const ModifyMeal = ({ onSave }) => {
  const { mealId } = useParams();
  const [meal, setMeal] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [spicy, setSpicy] = useState(false);
  const [withFries, setWithFries] = useState(false);
  const [withSoda, setWithSoda] = useState(false);
  const [withSalad, setWithSalad] = useState(false);
  const [withSauce, setWithSauce] = useState(false);
  const [withChilly, setWithChilly] = useState(false);
  const [withPasta, setWithPasta] = useState(false);
  
  // Additional Specifications
  const [vegetarian, setVegetarian] = useState(false);
  const [vegan, setVegan] = useState(false);
  const [glutenFree, setGlutenFree] = useState(false);
  const [organic, setOrganic] = useState(false);
  const [allergens, setAllergens] = useState('');

  const [seasonal, setSeasonal] = useState(false);
  const [availableSeason, setAvailableSeason] = useState('');

  // Nutrition Information
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbohydrates, setCarbohydrates] = useState('');
  const [fats, setFats] = useState('');

  useEffect(() => {
    const fetchMeal = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/meals/${mealId}`);
        const data = response.data;
        setMeal(data);
        setName(data.name);
        setDescription(data.description);
        setPrice(data.price);
        setImage(data.image);
        setSpicy(data.spicy || false);
        setWithFries(data.withFries || false);
        setWithSoda(data.withSoda || false);
        setWithSalad(data.withSalad || false);
        setWithSauce(data.withSauce || false);
        setWithChilly(data.withChilly || false);
        setWithPasta(data.withPasta || false);
        setVegetarian(data.vegetarian || false);
        setVegan(data.vegan || false);
        setGlutenFree(data.glutenFree || false);
        setOrganic(data.organic || false);
        setAllergens(data.allergens || '');
        setSeasonal(data.seasonal || false);
        setAvailableSeason(data.availableSeason || '');
        setCalories(data.calories || '');
        setProtein(data.protein || '');
        setCarbohydrates(data.carbohydrates || '');
        setFats(data.fats || '');
      } catch (error) {
        console.error('Error fetching meal details:', error);
      }
    };

    fetchMeal();
  }, [mealId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedMeal = {
      ...meal,
      name,
      description,
      price,
      image,
      spicy,
      withFries,
      withSoda,
      withSalad,
      withSauce,
      withChilly,
      withPasta,
      vegetarian,
      vegan,
      glutenFree,
      organic,
      allergens,
      seasonal,
      availableSeason,
      calories,
      protein,
      carbohydrates,
      fats,
    };
    onSave(updatedMeal);
  };

  if (!meal) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white mt-14 p-8 rounded-lg shadow-lg w-full max-w-6xl mt-8">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Modify Meal</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Details */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Price ($)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Description */}
          <div className="col-span-full">
            <label className="block text-gray-700 font-semibold mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
            />
          </div>

          {/* Dietary Information */}
          <div className="col-span-full md:col-span-2 bg-gray-100 p-4 rounded">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Dietary Labels</h3>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={vegetarian}
                onChange={(e) => setVegetarian(e.target.checked)}
                className="mr-2"
              />
              <label>Vegetarian</label>
            </div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={vegan}
                onChange={(e) => setVegan(e.target.checked)}
                className="mr-2"
              />
              <label>Vegan</label>
            </div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={glutenFree}
                onChange={(e) => setGlutenFree(e.target.checked)}
                className="mr-2"
              />
              <label>Gluten-Free</label>
            </div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={organic}
                onChange={(e) => setOrganic(e.target.checked)}
                className="mr-2"
              />
              <label>Organic</label>
            </div>
          </div>

          {/* Nutrition Information */}
          <div className="col-span-full md:col-span-2 bg-gray-100 p-4 rounded">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Nutrition Information</h3>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Calories (kcal)</label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Protein (g)</label>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Carbohydrates (g)</label>
              <input
                type="number"
                value={carbohydrates}
                onChange={(e) => setCarbohydrates(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Fats (g)</label>
              <input
                type="number"
                value={fats}
                onChange={(e) => setFats(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Seasonal Availability */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Seasonal Availability</label>
            <input
              type="checkbox"
              checked={seasonal}
              onChange={(e) => setSeasonal(e.target.checked)}
              className="mr-2"
            />
            <span>Seasonal Item</span>
            {seasonal && (
              <input
                type="text"
                placeholder="Available Season (e.g., Summer)"
                value={availableSeason}
                onChange={(e) => setAvailableSeason(e.target.value)}
                className="form-input mt-2"
              />
            )}
          </div>

          {/* Image */}
          <div className="col-span-full">
            <label className="block text-gray-700 font-semibold mb-2">Image URL</label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="form-input"
            />
          </div>

          <button
            type="submit"
            className="col-span-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 mt-6"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModifyMeal;
