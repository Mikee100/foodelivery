import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RestaurantMap from './RestaurantMap';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const RestaurantListing = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('map');
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: '',
    latitude: '',
    longitude: '',
    description: '',
    image: ''
  });

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/restaurants');
      setRestaurants(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRestaurant = async (restaurantId) => {
    try {
      await axios.delete(`http://localhost:3000/api/restaurants/${restaurantId}`);
      setRestaurants(restaurants.filter(restaurant => restaurant.id !== restaurantId));
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      setError('Failed to delete restaurant');
    }
  };

  const openEditModal = (restaurant) => {
    setEditingRestaurant(restaurant);
    setFormData({
      name: restaurant.name,
      email: restaurant.email,
      location: restaurant.location,
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      description: restaurant.description,
      image: restaurant.image
    });
    setIsEditModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateRestaurant = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:3000/api/restaurants/${editingRestaurant.id}`,
        formData
      );
      
      // Update local state
      setRestaurants(restaurants.map(restaurant => 
        restaurant.id === editingRestaurant.id ? { ...restaurant, ...formData } : restaurant
      ));
      
      setIsEditModalOpen(false);
      setEditingRestaurant(null);
    } catch (error) {
      console.error('Error updating restaurant:', error);
      setError('Failed to update restaurant');
    }
  };
  const LocationPickerMap = ({ position, setPosition, setFormData }) => {
    const map = useMapEvents({
      click(e) {
        const newPosition = e.latlng;
        setPosition(newPosition);
        setFormData(prev => ({
          ...prev,
          latitude: newPosition.lat,
          longitude: newPosition.lng
        }));
      },
    });
  
    return position === null ? null : (
      <Marker position={position}>
        <Popup>Restaurant Location</Popup>
      </Marker>
    );
  };
  const defaultCenter = [-1.2921, 36.8219];


  if (loading) return <div className="text-center py-8">Loading restaurants...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Our Restaurants</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
            >
              {viewMode === 'map' ? 'Show List View' : 'Show Map View'}
            </button>
            <Link 
              to="/admin/add-restaurant" 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Add New Restaurant
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {viewMode === 'map' ? (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <RestaurantMap restaurants={restaurants} />
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-lg w-full mb-8">
            <h2 className="text-2xl font-bold mb-6">Restaurants List</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
                <div key={restaurant.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {restaurant.image && (
                    <img 
                      src={restaurant.image} 
                      alt={restaurant.name} 
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="text-xl font-bold mb-2">{restaurant.name}</h3>
                    <p className="text-gray-600 mb-1">{restaurant.location}</p>
                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">{restaurant.description}</p>
                    <div className="flex justify-between items-center">
                      <Link
                        to={`/restaurants/${restaurant.id}`}
                        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                      >
                        View Details
                      </Link>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(restaurant)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRestaurant(restaurant.id)}
                          className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Restaurant Modal */}
        {isEditModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl"> {/* Increased max width */}
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Edit Restaurant</h2>
        <form onSubmit={handleUpdateRestaurant}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column - Form fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded h-24"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Image URL</label>
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>
            
            {/* Right column - Map */}
            <div className="h-96 rounded-lg overflow-hidden border border-gray-300">
              <MapContainer 
                center={[formData.latitude || defaultCenter[0], formData.longitude || defaultCenter[1]]} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationPickerMap 
                  position={formData.latitude && formData.longitude ? 
                    [formData.latitude, formData.longitude] : null}
                  setPosition={(pos) => {
                    setFormData(prev => ({
                      ...prev,
                      latitude: pos.lat,
                      longitude: pos.lng
                    }));
                  }}
                  setFormData={setFormData}
                />
              </MapContainer>
              <div className="bg-gray-50 p-2 text-sm text-center">
                {formData.latitude && formData.longitude ? (
                  <>Selected: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}</>
                ) : (
                  "Click on the map to select location"
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Update Restaurant
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default RestaurantListing;