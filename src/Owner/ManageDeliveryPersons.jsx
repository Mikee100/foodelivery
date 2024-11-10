import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ManageDeliveryPersons() {
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [deliveryPersonName, setDeliveryPersonName] = useState('');
  const [deliveryPersonEmail, setDeliveryPersonEmail] = useState('');

  useEffect(() => {
    fetchDeliveryPersons();
  }, []);

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

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-6xl mt-8">
      <h2 className="text-2xl font-bold mb-4">Delivery Persons</h2>
      {deliveryPersons.map((person) => (
        <div key={person.id} className="mb-4 p-4 border rounded">
          <h3 className="text-xl font-bold mb-2">Name: {person.name}</h3>
          <p className="mb-2">Email: {person.email}</p>
        </div>
      ))}
      <h2 className="text-2xl font-bold mb-4 mt-8">Add a Delivery Person</h2>
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
  );
}