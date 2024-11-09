import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/login', { email, password });
      const { role, token, user, restaurantId, deliveryPersonId } = response.data;
  
      // Save token and role
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userId', user.id);
  
      // If role is restaurant_owner, save restaurantId
      if (role === 'restaurant_owner') {
        localStorage.setItem('restaurantId', restaurantId);
      }
  
      // If role is delivery_person, save restaurantId if exists
      if (role === 'delivery_person' && restaurantId) {
        localStorage.setItem('restaurantId', restaurantId);
      }
  
      // If role is delivery_person, save deliveryPersonId
      if (role === 'delivery_person') {
        localStorage.setItem('deliveryPersonId', deliveryPersonId);
      }
  
      const redirectRestaurantId = localStorage.getItem('redirectRestaurantId');
      if (redirectRestaurantId) {
        localStorage.removeItem('redirectRestaurantId');
        navigate(`/restaurant/${redirectRestaurantId}`);
      } else {
        // Navigate based on the role
        switch (role) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'restaurant_owner':
            navigate('/owner/dashboard');
            break;
          case 'delivery_person':
            navigate('/delivery/dashboard');
            break;
          default:
            navigate('/');
            break;
        }
      }
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Invalid credentials');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-r from-green-400 to-blue-500 p-6 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">Login</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            Login
          </button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-gray-700">Don't have an account?</p>
          <Link to="/signup" className="text-blue-500 hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
