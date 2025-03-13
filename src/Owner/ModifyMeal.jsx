import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ModifyMeal = () => {
  const { mealId } = useParams();
  const navigate = useNavigate();
  const [meal, setMeal] = useState(null);

  // Meal details
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);

  // Customizations
  const [spicy, setSpicy] = useState(false);
  const [withFries, setWithFries] = useState(false);
  const [withSoda, setWithSoda] = useState(false);
  const [extraCheese, setExtraCheese] = useState(false);
  const [extraSauce, setExtraSauce] = useState(false);
  const [withSalad, setWithSalad] = useState(false);
  const [withChilly, setWithChilly] = useState(false);
  const [withPasta, setWithPasta] = useState(false);

  // Messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (mealId) {
      fetchMealDetails();
      fetchCategories();
    }
  }, [mealId]);

  const fetchMealDetails = async () => {
    try {
      const response = await axios.get(`http://192.168.181.75:3000/api/meals/${mealId}`);
      const data = response.data;
      setMeal(data);
      setName(data.name);
      setDescription(data.description);
      setPrice(data.price);
      setImage(data.image);
      setCategory(data.category_id);
      setSpicy(data.spicy || false);
      setWithFries(data.withFries || false);
      setWithSoda(data.withSoda || false);
      setExtraCheese(data.extraCheese || false);
      setExtraSauce(data.extraSauce || false);
      setWithSalad(data.withSalad || false);
      setWithChilly(data.withChilly || false);
      setWithPasta(data.withPasta || false);
    } catch (error) {
      console.error('Error fetching meal details:', error);
    }
  };

  const fetchCategories = async () => {
    const restaurantId = localStorage.getItem('restaurantId');
    if (!restaurantId) {
      console.error('Restaurant ID not found in localStorage');
      return;
    }

    try {
      const response = await axios.get(`http://192.168.181.75:3000/api/restaurants/${restaurantId}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updatedMeal = {
      name,
      description,
      price,
      image,
      category_id: category,
      spicy,
      withFries,
      withSoda,
      extraCheese,
      extraSauce,
      withSalad,
      withChilly,
      withPasta,
    };

    try {
      const response = await axios.put(`http://192.168.181.75:3000/api/updatemeals/${mealId}`, updatedMeal, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Response:', response.data); // Debugging log
      setSuccessMessage('Meal updated successfully!');
      setErrorMessage('');
      setTimeout(() => {
       
      }, 2000);
    } catch (error) {
      console.error('Error saving meal:', error);
      setErrorMessage('Failed to update meal. Please try again.');
      setSuccessMessage('');
    }
  };

  if (!meal) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-6xl mt-8">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Modify Meal</h2>
      {successMessage && <div className="bg-green-100 text-green-700 p-4 rounded mb-4">{successMessage}</div>}
      {errorMessage && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{errorMessage}</div>}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <label className="block text-gray-700 font-semibold mb-2">Price (Ksh)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-select"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-full">
            <label className="block text-gray-700 font-semibold mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
            />
          </div>
          <div className="col-span-full">
            <label className="block text-gray-700 font-semibold mb-2">Image URL</label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="col-span-full md:col-span-2 bg-gray-100 p-4 rounded">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add-ons & Customizations</h3>
            <label>
              <input type="checkbox" checked={spicy} onChange={(e) => setSpicy(e.target.checked)} /> Spicy
            </label>
            <label>
              <input type="checkbox" checked={withFries} onChange={(e) => setWithFries(e.target.checked)} /> With Fries
            </label>
            <label>
              <input type="checkbox" checked={withSoda} onChange={(e) => setWithSoda(e.target.checked)} /> With Soda
            </label>
            <label>
              <input type="checkbox" checked={extraCheese} onChange={(e) => setExtraCheese(e.target.checked)} /> Extra Cheese
            </label>
            <label>
              <input type="checkbox" checked={extraSauce} onChange={(e) => setExtraSauce(e.target.checked)} /> Extra Sauce
            </label>
            <label>
              <input type="checkbox" checked={withSalad} onChange={(e) => setWithSalad(e.target.checked)} /> With Salad
            </label>
            <label>
              <input type="checkbox" checked={withChilly} onChange={(e) => setWithChilly(e.target.checked)} /> With Chilly
            </label>
            <label>
              <input type="checkbox" checked={withPasta} onChange={(e) => setWithPasta(e.target.checked)} /> With Pasta
            </label>
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition duration-200"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default ModifyMeal;