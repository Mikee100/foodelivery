import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const LocationMarker = ({ position, setPosition, setLocationText, setManualCoords }) => {
  const map = useMapEvents({
    click(e) {
      const newPosition = e.latlng;
      setPosition(newPosition);
      setManualCoords({
        latitude: newPosition.lat,
        longitude: newPosition.lng
      });
      
      // Reverse geocode to get address
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPosition.lat}&lon=${newPosition.lng}`)
        .then(response => response.json())
        .then(data => {
          const address = data.display_name || `${newPosition.lat.toFixed(6)}, ${newPosition.lng.toFixed(6)}`;
          setLocationText(address);
        })
        .catch(error => {
          console.error('Geocoding error:', error);
          setLocationText(`${newPosition.lat.toFixed(6)}, ${newPosition.lng.toFixed(6)}`);
        });
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Selected Restaurant Location</Popup>
    </Marker>
  );
};

export default function RestaurantCreation() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [position, setPosition] = useState(null);
  const [manualCoords, setManualCoords] = useState({
    latitude: '',
    longitude: ''
  });
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Default center for the map (Nairobi coordinates)
  const defaultCenter = [-1.2921, 36.8219];

  // Validate coordinates input
  const validateCoordinates = (lat, lng) => {
    const latFloat = parseFloat(lat);
    const lngFloat = parseFloat(lng);
    return (
      !isNaN(latFloat) && latFloat >= -90 && latFloat <= 90 &&
      !isNaN(lngFloat) && lngFloat >= -180 && lngFloat <= 180
    );
  };

  // Handle manual coordinate changes
  const handleManualCoordChange = (e, field) => {
    const value = e.target.value;
    setManualCoords(prev => ({
      ...prev,
      [field]: value
    }));

    // If both coordinates are valid, update the position
    if (validateCoordinates(
      field === 'latitude' ? value : manualCoords.latitude,
      field === 'longitude' ? value : manualCoords.longitude
    )) {
      const lat = field === 'latitude' ? parseFloat(value) : parseFloat(manualCoords.latitude);
      const lng = field === 'longitude' ? parseFloat(value) : parseFloat(manualCoords.longitude);
      setPosition({ lat, lng });
      
      // Update the location text
      setLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
  
    // Validate position
    if (!position) {
      setError('Please select a location for the restaurant');
      setIsLoading(false);
      return;
    }
  
    try {
      console.log('Submitting restaurant data...'); // Debug log
      const restaurantData = {
        name,
        email,
        location,
        latitude: position.lat,
        longitude: position.lng,
        description,
        image,
        username,
        password,
      };
  
      console.log('Request payload:', restaurantData); // Debug log
  
      const response = await axios.post('http://localhost:3000/api/admin/addRestaurant', restaurantData, {
        timeout: 10000 // 10 second timeout
      });
  
      console.log('Response received:', response.data); // Debug log
      alert('Restaurant and user created successfully');
      
      // Reset form
      setName('');
      setEmail('');
      setLocation('');
      setPosition(null);
      setManualCoords({ latitude: '', longitude: '' });
      setDescription('');
      setImage('');
      setUsername('');
      setPassword('');
    } catch (error) {
      console.error('Full error object:', error); // Debug log
      
      let errorMessage = 'Failed to create restaurant';
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        errorMessage = error.response.data?.error || error.response.data?.message || errorMessage;
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        errorMessage = 'No response from server - check your network connection';
      } else {
        // Something happened in setting up the request
        console.error('Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-400 to-blue-500 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Add a New Restaurant</h1>
        
        <div className="bg-white p-8 rounded-lg shadow-lg grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
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
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
                  Location Address
                </label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="latitude">
                    Latitude
                  </label>
                  <input
                    type="number"
                    id="latitude"
                    step="0.000001"
                    value={manualCoords.latitude}
                    onChange={(e) => handleManualCoordChange(e, 'latitude')}
                    className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="e.g., -1.2921"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="longitude">
                    Longitude
                  </label>
                  <input
                    type="number"
                    id="longitude"
                    step="0.000001"
                    value={manualCoords.longitude}
                    onChange={(e) => handleManualCoordChange(e, 'longitude')}
                    className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="e.g., 36.8219"
                  />
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>Tip: You can either click on the map or manually enter coordinates above.</p>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="image">
                  Image URL
                </label>
                <input
                  type="text"
                  id="image"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                disabled={isLoading}
                className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline w-full ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Creating...' : 'Add Restaurant'}
              </button>
            </form>
          </div>
          
          {/* Right Column - Map */}
          <div className="h-96 lg:h-full rounded-lg overflow-hidden border border-gray-300">
            <MapContainer 
              center={defaultCenter} 
              zoom={13} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <LocationMarker 
                position={position} 
                setPosition={setPosition}
                setLocationText={setLocation}
                setManualCoords={setManualCoords}
              />
            </MapContainer>
            {position && (
              <div className="bg-gray-50 p-2 text-sm text-center">
                Selected Coordinates: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}