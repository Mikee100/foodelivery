import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import RestaurantCreation from './RestaurantCreation';
import RestaurantListing from './RestaurantListing';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('restaurants');
  const [restaurants, setRestaurants] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  // Default center for the map (Nairobi coordinates)
  const defaultCenter = [-1.2921, 36.8219];

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
        latitude,
        longitude,
        description,
        image,
        username,
        password,
      });
      fetchRestaurants();
      setName('');
      setEmail('');
      setLocation('');
      setLatitude(null);
      setLongitude(null);
      setDescription('');
      setImage('');
      setUsername('');
      setPassword('');
      setMessage('Restaurant and user created successfully');
      setActiveSection('restaurants');
    } catch (error) {
      console.error('There was an error adding the restaurant and user!', error);
      setMessage('Error creating restaurant');
    }
  };

  const handleDeleteRestaurant = async (restaurantId) => {
    try {
      await axios.delete(`http://localhost:3000/api/restaurants/${restaurantId}`);
      setRestaurants(restaurants.filter(restaurant => restaurant.id !== restaurantId));
      setMessage('Restaurant deleted successfully');
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      setMessage('Error deleting restaurant');
    }
  };

  const handleLocationSelect = async (e) => {
    // You can implement map click handling here if needed
    // Or keep the manual location input as is
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <nav className="bg-blue-600 p-4 mt-16 shadow-md w-64">
        <div className="container mx-auto flex flex-col items-start">
          <h1 className="text-white text-2xl font-bold mb-4">Admin Dashboard</h1>
          <button
            onClick={() => setActiveSection('restaurants')}
            className={`${activeSection === 'restaurants' ? 'bg-blue-700' : 'bg-blue-500'} hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2 w-full text-left`}
          >
            Restaurants
          </button>
          <button
            onClick={() => setActiveSection('addRestaurant')}
            className={`${activeSection === 'addRestaurant' ? 'bg-blue-700' : 'bg-blue-500'} hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2 w-full text-left`}
          >
            Add Restaurant
          </button>
          <button
            onClick={() => setActiveSection('mapView')}
            className={`${activeSection === 'mapView' ? 'bg-blue-700' : 'bg-blue-500'} hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2 w-full text-left`}
          >
            Map View
          </button>
        </div>
      </nav>

      <main className="flex-grow container mt-12 mx-auto p-6">
        {message && (
          <div className={`mb-4 p-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        {activeSection === 'restaurants' && (
          <RestaurantListing />
        )}

        {activeSection === 'addRestaurant' && (
        <RestaurantCreation />
        )}

        {activeSection === 'mapView' && (
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-6xl">
            <h2 className="text-2xl font-bold mb-6">Restaurants Map View</h2>
            <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-300">
              <MapContainer 
                center={defaultCenter} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {restaurants.map(restaurant => (
                  restaurant.latitude && restaurant.longitude && (
                    <Marker 
                      key={restaurant.id} 
                      position={[restaurant.latitude, restaurant.longitude]}
                    >
                      <Popup>
                        <div className="max-w-xs">
                          <h3 className="font-bold text-lg">{restaurant.name}</h3>
                          {restaurant.image && (
                            <img 
                              src={restaurant.image} 
                              alt={restaurant.name} 
                              className="w-full h-24 object-cover mb-2"
                            />
                          )}
                          <p className="text-sm">{restaurant.description}</p>
                          <p className="text-sm text-gray-600 mt-1">{restaurant.location}</p>
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}
              </MapContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}