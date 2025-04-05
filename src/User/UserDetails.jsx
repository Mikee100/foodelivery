import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiMail, FiPhone, FiUser, FiEdit } from 'react-icons/fi';
import { ClipLoader } from 'react-spinners';

export default function UserDetails() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = localStorage.getItem('userId'); // Assuming user ID is stored in local storage

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    try {
      const response = await axios.get(`http://192.168.158.75:3000/api/users/${userId}`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError('Failed to load user details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <ClipLoader size={50} color="#4A90E2" />
    </div>
  );

  if (error) return <div className="text-center text-red-500">{error}</div>;

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-gray-800">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">User Profile</h1>
        <div className="flex flex-col items-center">
          <div className="text-blue-500 mb-6">
            <FiUser size={60} />
          </div>
          <h2 className="text-2xl font-semibold mb-4">{user.name}</h2>
          <div className="w-full mb-4">
            <div className="flex items-center space-x-2">
              <FiMail className="text-blue-500" />
              <p className="text-gray-700"><strong>Email:</strong> {user.email}</p>
            </div>
          </div>
          <div className="w-full mb-4">
            <div className="flex items-center space-x-2">
              <FiPhone className="text-blue-500" />
              <p className="text-gray-700"><strong>Phone:</strong> {user.phone}</p>
            </div>
          </div>
          <button 
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full flex items-center space-x-2 shadow-lg transform transition-all duration-300"
            onClick={() => alert('Edit functionality coming soon!')}
          >
            <FiEdit />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
