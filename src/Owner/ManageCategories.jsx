import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const restaurantId = localStorage.getItem('restaurantId'); // Get the restaurant ID from local storage

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

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const restaurantId = localStorage.getItem('restaurantId'); // Get the restaurant ID from local storage
    try {
      await axios.post('http://192.168.181.75:3000/api/categories', {
        name: categoryName,
        restaurantId,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setCategoryName('');
      fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-6xl mt-8">
      <h2 className="text-2xl font-bold mb-4">Manage Categories</h2>
      <form onSubmit={handleAddCategory}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="categoryName">
            Category Name
          </label>
          <input
            type="text"
            id="categoryName"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Add Category
        </button>
      </form>
      <h3 className="text-xl font-bold mt-8 mb-4">Existing Categories</h3>
      <ul>
        {categories.map((category) => (
          <li key={category.id} className="mb-2">
            {category.name}
          </li>
        ))}
      </ul>
    </div>
  );
}