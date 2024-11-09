import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('restaurants');
  const [restaurants, setRestaurants] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/restaurants');
      setRestaurants(response.data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  const handleAddRestaurant = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/admin/addRestaurant', {
        name,
        email,
        location,
        description,
        image,
        username,
        password,
      });
      fetchRestaurants();
      setName('');
      setEmail('');
      setLocation('');
      setDescription('');
      setImage('');
      setUsername('');
      setPassword('');
      alert('Restaurant and user created successfully');
    } catch (error) {
      console.error('There was an error adding the restaurant and user!', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <nav className="bg-blue-600 p-4 mt-16 shadow-md w-64">
        <div className="container mx-auto flex flex-col items-start">
          <h1 className="text-white text-2xl font-bold mb-4">Admin Dashboard</h1>
          <button
            onClick={() => setActiveSection('restaurants')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2 w-full text-left"
          >
            Restaurants
          </button>
          <button
            onClick={() => setActiveSection('addRestaurant')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2 w-full text-left"
          >
            Add Restaurant
          </button>
        </div>
      </nav>

      <main className="flex-grow container mt-12 mx-auto p-6">
        {activeSection === 'restaurants' && (
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-6xl mt-8">
            <h2 className="text-2xl font-bold mb-4">Restaurants</h2>
            {restaurants.map((restaurant) => (
              <div key={restaurant.id} className="mb-4 p-4 border rounded">
                <h3 className="text-xl font-bold mb-2">{restaurant.name}</h3>
                <img src={restaurant.image} alt={restaurant.name} className="w-full h-48 object-cover mb-2" />
                <p className="mb-2">Location: {restaurant.location}</p>
                <p className="mb-2">Description: {restaurant.description}</p>
              
              </div>
            ))}
          </div>
        )}

        {activeSection === 'addRestaurant' && (
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-6xl mt-8">
            <h2 className="text-2xl font-bold mb-4">Add a New Restaurant</h2>
            <form onSubmit={handleAddRestaurant}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="image">
                  Image URL
                </label>
                <input
                  type="text"
                  id="image"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Add Restaurant
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}