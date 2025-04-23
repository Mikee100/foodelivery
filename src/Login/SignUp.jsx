import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import 'leaflet/dist/leaflet.css';

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [county, setCounty] = useState('');
  const [location, setLocation] = useState({ lat: 0, lng: 0 });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://192.168.137.1:3000/api/signup', {
        username,
        email,
        password,
        phone,
        county,
        location,
      });
      setUsername('');
      setEmail('');
      setPassword('');
      setPhone('');
      setCounty('');
      setLocation({ lat: 0, lng: 0 });
      navigate('/login');
    } catch (error) {
      console.error('There was an error signing up!', error);
    }
  };

  function LocationMarker() {
    const map = useMapEvents({
      click(e) {
        setLocation(e.latlng);
        map.flyTo(e.latlng, map.getZoom());
      },
    });
    return location === null ? null : <Marker position={location}></Marker>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col mt-16 items-center justify-center">
      <h1 className="text-5xl font-extrabold text-gray-800 mb-12 tracking-wide">Create Your Account</h1>
      <div className="bg-white p-10 rounded-xl shadow-xl w-full max-w-lg transition-all transform hover:scale-105 duration-300">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label className="block text-gray-600 text-sm font-semibold mb-2" htmlFor="username">
              Username
            </label>
            <div className="relative">
              <FaUser className="absolute top-3 left-3 text-gray-400" />
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm text-gray-800 transition-all duration-150 ease-in-out"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-gray-600 text-sm font-semibold mb-2" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <FaEnvelope className="absolute top-3 left-3 text-gray-400" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm text-gray-800 transition-all duration-150 ease-in-out"
                placeholder="Enter your email address"
                required
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-gray-600 text-sm font-semibold mb-2" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <FaLock className="absolute top-3 left-3 text-gray-400" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm text-gray-800 transition-all duration-150 ease-in-out"
                placeholder="Create a password"
                required
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-gray-600 text-sm font-semibold mb-2" htmlFor="phone">
              Phone Number
            </label>
            <div className="relative">
              <FaPhone className="absolute top-3 left-3 text-gray-400" />
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm text-gray-800 transition-all duration-150 ease-in-out"
                placeholder="Enter your phone number"
                required
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-gray-600 text-sm font-semibold mb-2" htmlFor="county">
              County
            </label>
            <div className="relative">
              <FaMapMarkerAlt className="absolute top-3 left-3 text-gray-400" />
              <input
                type="text"
                id="county"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm text-gray-800 transition-all duration-150 ease-in-out"
                placeholder="Enter your county"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 text-sm font-semibold mb-2">Location</label>
            <MapContainer
              center={[0, 0]}
              zoom={2}
              style={{ height: '300px', width: '100%' }}
              className="rounded-lg shadow-md border border-gray-300"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationMarker />
            </MapContainer>
            <p className="text-xs text-gray-500 mt-2 italic">Click on the map to set your location</p>
          </div>

          <button
            type="submit"
            className="mt-8 w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}
