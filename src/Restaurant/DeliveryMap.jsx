import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiMapPin, FiClock, FiDollarSign } from 'react-icons/fi';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom icons
const restaurantIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1671/1671069.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const userIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Helper component to handle map events
const MapEvents = ({ setUserPosition, restaurantPosition }) => {
  const map = useMap();

  useMapEvents({
    click(e) {
      setUserPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  // Center map between restaurant and user if both positions exist
  useEffect(() => {
    if (restaurantPosition && map) {
      map.flyTo(restaurantPosition, 13);
    }
  }, [restaurantPosition, map]);

  return null;
};

const DeliveryMap = ({ 
  restaurantPosition,
  onDeliveryCalculated,
  baseDeliveryFee = 50,
  deliveryRatePerKm = 10 
}) => {
  const [userPosition, setUserPosition] = useState(null);
  const [distance, setDistance] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(baseDeliveryFee);
  const [deliveryTime, setDeliveryTime] = useState(null);
  const polylineRef = useRef(null);

  // Calculate distance, fee, and time when positions change
  useEffect(() => {
    if (restaurantPosition && userPosition) {
      // Calculate distance in km (simplified calculation)
      const latDiff = restaurantPosition.lat - userPosition.lat;
      const lngDiff = restaurantPosition.lng - userPosition.lng;
      const calculatedDistance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // Approx km
      setDistance(calculatedDistance.toFixed(1));

      // Calculate delivery fee (base + rate per km)
      const calculatedFee = baseDeliveryFee + (calculatedDistance * deliveryRatePerKm);
      setDeliveryFee(Math.max(baseDeliveryFee, calculatedFee.toFixed(0)));

      // Estimate delivery time (5 mins base + 2 mins per km)
      const calculatedTime = 5 + (calculatedDistance * 2);
      setDeliveryTime(Math.max(10, calculatedTime.toFixed(0)));

      // Notify parent component
      onDeliveryCalculated({
        distance: calculatedDistance,
        fee: calculatedFee,
        time: calculatedTime,
        userPosition
      });
    }
  }, [restaurantPosition, userPosition, baseDeliveryFee, deliveryRatePerKm, onDeliveryCalculated]);

  // Line color based on distance
  const lineColor = distance > 10 ? '#e53e3e' : distance > 5 ? '#dd6b20' : '#38a169';

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <MapContainer 
          center={restaurantPosition || [-1.2921, 36.8219]} 
          zoom={13} 
          style={{ height: '300px', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {restaurantPosition && (
            <Marker position={restaurantPosition} icon={restaurantIcon}>
              <Popup>Restaurant Location</Popup>
            </Marker>
          )}
          
          {userPosition && (
            <Marker position={userPosition} icon={userIcon}>
              <Popup>Your Location</Popup>
            </Marker>
          )}
          
          {restaurantPosition && userPosition && (
            <Polyline 
              ref={polylineRef}
              positions={[restaurantPosition, userPosition]}
              color={lineColor}
              weight={4}
              dashArray="5, 5"
            />
          )}
          
          <MapEvents 
            setUserPosition={setUserPosition} 
            restaurantPosition={restaurantPosition} 
          />
        </MapContainer>
      </div>

      {/* Delivery Information */}
      {userPosition && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="font-bold text-lg mb-3">Delivery Information</h3>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 p-3 rounded-lg">
              <FiMapPin className="mx-auto text-blue-600 mb-1" />
              <p className="text-sm text-gray-600">Distance</p>
              <p className="font-bold">{distance} km</p>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg">
              <FiDollarSign className="mx-auto text-green-600 mb-1" />
              <p className="text-sm text-gray-600">Delivery Fee</p>
              <p className="font-bold">Ksh {deliveryFee}</p>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg">
              <FiClock className="mx-auto text-yellow-600 mb-1" />
              <p className="text-sm text-gray-600">Est. Time</p>
              <p className="font-bold">{deliveryTime} mins</p>
            </div>
          </div>
          
          <p className="mt-3 text-sm text-gray-500 text-center">
            Click on the map to change your delivery location
          </p>
        </div>
      )}
      
      {!userPosition && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center">
          <p className="text-yellow-700">
            Click on the map to set your delivery location
          </p>
        </div>
      )}
    </div>
  );
};

export default DeliveryMap;