import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Create custom restaurant icon
const createRestaurantIcon = () => {
  return new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1671/1671069.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const RestaurantMap = ({ restaurants = [] }) => {
  // Default center for the map (Nairobi coordinates)
  const defaultCenter = [-1.2921, 36.8219];

  // Helper function to safely convert coordinates
  const parseCoordinate = (coord) => {
    if (coord === null || coord === undefined) return null;
    const num = Number(coord);
    return isNaN(num) ? null : num;
  };

  return (
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
        
        {restaurants.map(restaurant => {
          const lat = parseCoordinate(restaurant.latitude);
          const lng = parseCoordinate(restaurant.longitude);
          
          if (lat === null || lng === null) {
            console.warn(`Invalid coordinates for restaurant ${restaurant.id}:`, restaurant.latitude, restaurant.longitude);
            return null;
          }

          return (
            <Marker 
              key={restaurant.id} 
              position={[lat, lng]}
              icon={createRestaurantIcon()}
            >
              <Popup>
                <div className="max-w-xs">
                  <h3 className="font-bold text-lg mb-2">{restaurant.name}</h3>
                  {restaurant.image && (
                    <img 
                      src={restaurant.image} 
                      alt={restaurant.name} 
                      className="w-full h-24 object-cover mb-2 rounded"
                    />
                  )}
                  <p className="text-sm text-gray-700 mb-1">{restaurant.description}</p>
                  <p className="text-xs text-gray-500">
                    <span className="font-semibold">Location:</span> {restaurant.location}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="font-semibold">Coordinates:</span> {lat.toFixed(6)}, {lng.toFixed(6)}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default RestaurantMap;