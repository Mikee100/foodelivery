import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { useAuth } from '../AuthContext/AuthContext';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    try {
      const res = await axios.post("http://192.168.137.1:3000/api/login", {
        email,
        password,
      });
  
      const { token, user, restaurantId, deliveryPersonId } = res.data;
  
      // Validate response structure
      if (!token || !user?.email || !user?.role) {
        throw new Error('Invalid login response structure');
      }
  
      // Save all auth data at once
      await login({
        token,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurantId,
        deliveryPersonId
      });
  
      console.log('my admin',user.role)
      // Redirect by role
      const redirectPaths = {
        admin: '/admin/dashboard',
        restaurant_owner: `/restaurant/${restaurantId}/dashboard`,
        delivery_person: `/delivery/${deliveryPersonId}/dashboard`,
        default: '/'
      };
  
      navigate(redirectPaths[user.role] || redirectPaths.default);
  
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side with background image */}
      <div
        className="hidden md:flex md:w-1/2 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/12725456/pexels-photo-12725456.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2)',
        }}
      />

      {/* Right side login form */}
      <div className="flex flex-col justify-center md:w-1/2 p-8 bg-white">
        <div className="max-w-md mx-auto p-6 rounded-lg shadow-lg border border-gray-200">
          <h1 className="text-3xl font-semibold text-center text-gray-800 mb-6">Welcome Back</h1>
          <p className="text-center text-gray-500 mb-6">Please enter your credentials to login</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200"
                placeholder="Email"
                required
              />
            </div>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200"
                placeholder="Password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300 transform hover:scale-105 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              Sign in with Google
            </button>
          </div>
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="text-blue-500 hover:underline font-medium">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
          <div className="w-10 h-10 border-4 border-t-blue-500 border-gray-300 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}