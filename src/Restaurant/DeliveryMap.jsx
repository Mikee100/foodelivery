import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiMapPin, FiClock, FiDollarSign, FiNavigation } from 'react-icons/fi';

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
const MapEvents = ({ setUserPosition, restaurantPosition, onAddressUpdate, onGeocodingStart }) => {
  const map = useMap();

  useMapEvents({
    click(e) {
      const newPosition = e.latlng;
      console.log('Map clicked, setting user position:', newPosition);
      setUserPosition(newPosition);
      map.flyTo(newPosition, map.getZoom());
      
      // Notify that geocoding is starting
      if (onGeocodingStart) {
        onGeocodingStart();
      }
      
      // Reverse geocode to get address
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPosition.lat}&lon=${newPosition.lng}&zoom=18&addressdetails=1`)
        .then(response => response.json())
        .then(data => {
          if (data.display_name) {
            // Extract a more user-friendly address
            const addressParts = data.display_name.split(', ');
            const shortAddress = addressParts.slice(0, 3).join(', '); // Take first 3 parts
            onAddressUpdate(shortAddress);
          } else {
            // Fallback to coordinates if no address found
            onAddressUpdate(`${newPosition.lat.toFixed(6)}, ${newPosition.lng.toFixed(6)}`);
          }
        })
        .catch(error => {
          console.error('Geocoding error:', error);
          // Fallback to coordinates
          onAddressUpdate(`${newPosition.lat.toFixed(6)}, ${newPosition.lng.toFixed(6)}`);
        });
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

// Enhanced distance calculation with validation
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  // Validate coordinates
  if (
    isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2) ||
    lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90 ||
    lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180
  ) {
    console.error('Invalid coordinates provided');
    return 0;
  }

  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * 
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const DeliveryMap = ({ 
  restaurantPosition,
  onDeliveryCalculated,
  onAddressUpdate, // New prop for address updates
  onGeocodingStart, // New prop for geocoding start
  baseDeliveryFee = 50,
  deliveryRatePerKm = 10,
  minDeliveryTime = 15, // Minimum delivery time in minutes
  timePerKm = 2 // Additional minutes per km
}) => {
  const [userPosition, setUserPosition] = useState(null);
  const [distance, setDistance] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(baseDeliveryFee);
  const [deliveryTime, setDeliveryTime] = useState(minDeliveryTime);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState(null);
  const polylineRef = useRef(null);
  const mapRef = useRef(null);

  // Memoized distance calculation
  const calculateDeliveryDetails = useCallback((restaurantPos, userPos) => {
    console.log('Calculating delivery details:', { restaurantPos, userPos });
    
    if (!restaurantPos || !userPos) {
      console.log('Missing positions:', { restaurantPos, userPos });
      return;
    }

    // Ensure restaurant position has proper lat/lng format
    if (!restaurantPos.lat || !restaurantPos.lng) {
      console.log('Invalid restaurant position format:', restaurantPos);
      return;
    }

    // Ensure user position has proper lat/lng format
    if (!userPos.lat || !userPos.lng) {
      console.log('Invalid user position format:', userPos);
      return;
    }
    
    setIsCalculating(true);
    setError(null);

    try {
      // Calculate distance
      const dist = calculateHaversineDistance(
        restaurantPos.lat,
        restaurantPos.lng,
        userPos.lat,
        userPos.lng
      );

      console.log('Distance calculation:', {
        restaurantLat: restaurantPos.lat,
        restaurantLng: restaurantPos.lng,
        userLat: userPos.lat,
        userLng: userPos.lng,
        calculatedDistance: dist
      });

      // Validate distance
      const validDistance = Math.max(0, dist);
      setDistance(validDistance);

      // Calculate fee with minimum charge
      const fee = Math.max(
        baseDeliveryFee,
        baseDeliveryFee + (validDistance * deliveryRatePerKm)
      );
      setDeliveryFee(Math.round(fee));

      // Calculate time with minimum
      const time = Math.max(
        minDeliveryTime,
        minDeliveryTime + (validDistance * timePerKm)
      );
      setDeliveryTime(Math.round(time));

      // Notify parent
      onDeliveryCalculated({
        distance: validDistance,
        fee,
        time,
        userPosition: userPos,
        isValid: validDistance > 0
      });
    } catch (err) {
      console.error("Delivery calculation error:", err);
      setError("Could not calculate delivery details. Please try again.");
      setDistance(0);
      setDeliveryFee(baseDeliveryFee);
      setDeliveryTime(minDeliveryTime);
    } finally {
      setIsCalculating(false);
    }
  }, [baseDeliveryFee, deliveryRatePerKm, minDeliveryTime, timePerKm, onDeliveryCalculated]);

  // Calculate when positions change
  useEffect(() => {
    console.log('Positions changed, triggering calculation:', { restaurantPosition, userPosition });
    calculateDeliveryDetails(restaurantPosition, userPosition);
  }, [restaurantPosition, userPosition, calculateDeliveryDetails]);

  // Auto-detect user location if available
  const detectUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserPosition(userPos);
          if (mapRef.current) {
            mapRef.current.flyTo(userPos, 15);
          }
          
          // Notify that geocoding is starting
          if (onGeocodingStart) {
            onGeocodingStart();
          }
          
          // Reverse geocode the detected location
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userPos.lat}&lon=${userPos.lng}&zoom=18&addressdetails=1`)
            .then(response => response.json())
            .then(data => {
              if (data.display_name) {
                const addressParts = data.display_name.split(', ');
                const shortAddress = addressParts.slice(0, 3).join(', ');
                onAddressUpdate(shortAddress);
              } else {
                onAddressUpdate(`${userPos.lat.toFixed(6)}, ${userPos.lng.toFixed(6)}`);
              }
            })
            .catch(error => {
              console.error('Geocoding error:', error);
              onAddressUpdate(`${userPos.lat.toFixed(6)}, ${userPos.lng.toFixed(6)}`);
            });
        },
        (err) => {
          console.error("Geolocation error:", err);
          setError("Could not detect your location. Please click on the map.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  // Line color based on distance
  const getLineColor = () => {
    if (distance > 15) return '#e53e3e'; // Red for long distances
    if (distance > 8) return '#dd6b20'; // Orange for medium
    return '#38a169'; // Green for short
  };


  


  return (
    <div className="space-y-4 relative z-0">
      <div className="bg-white rounded-lg shadow-md overflow-hidden relative">
        <MapContainer 
          center={restaurantPosition || [-1.2921, 36.8219]} 
          zoom={13} 
          style={{ height: '300px', width: '100%', position: 'relative', zIndex: 1, overflow: 'hidden' }}
          whenCreated={(map) => { mapRef.current = map; }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {restaurantPosition && (
            <Marker position={restaurantPosition} icon={restaurantIcon}>
              <Popup>
                <div className="font-semibold">Restaurant Location</div>
                <div className="text-sm text-gray-600">
                  {restaurantPosition.address || 'Our restaurant'}
                </div>
              </Popup>
            </Marker>
          )}
          
          {userPosition && (
            <Marker position={userPosition} icon={userIcon}>
              <Popup>Your Delivery Location</Popup>
            </Marker>
          )}
          
          {restaurantPosition && userPosition && (
            <Polyline 
              ref={polylineRef}
              positions={[restaurantPosition, userPosition]}
              color={getLineColor()}
              weight={4}
              dashArray="5, 5"
            />
          )}
          
          <MapEvents 
            setUserPosition={setUserPosition} 
            restaurantPosition={restaurantPosition} 
            onAddressUpdate={onAddressUpdate}
            onGeocodingStart={onGeocodingStart}
          />
        </MapContainer>

        <button 
          onClick={detectUserLocation}
          className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-lg z-[1000] hover:bg-gray-100 transition-colors"
          title="Detect my location"
        >
          <FiNavigation className="text-blue-600" />
        </button>
      </div>

      {/* Delivery Information */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="font-bold text-lg mb-3 flex items-center">
          <FiMapPin className="mr-2 text-blue-500" />
          Delivery Information
        </h3>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {isCalculating ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <FiMapPin className="mx-auto text-blue-600 mb-2 text-xl" />
                <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Distance</p>
                <p className="font-bold text-lg text-blue-800">
                  {distance > 0 ? `${distance.toFixed(1)} km` : '--'}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <FiDollarSign className="mx-auto text-green-600 mb-2 text-xl" />
                <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Delivery Fee</p>
                <p className="font-bold text-lg text-green-800">
                  {distance > 0 ? `Ksh ${Math.round(deliveryFee)}` : '--'}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                <FiClock className="mx-auto text-orange-600 mb-2 text-xl" />
                <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Est. Time</p>
                <p className="font-bold text-lg text-orange-800">
                  {distance > 0 ? `${Math.round(deliveryTime)} min` : '--'}
                </p>
              </div>
            </div>
            
            <div className="text-center">
              {!userPosition ? (
                <>
                  <p className="text-sm text-yellow-600 mb-2">
                    Click on the map or use the location button to set your delivery address
                  </p>
                  <button
                    onClick={detectUserLocation}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center mx-auto"
                  >
                    <FiNavigation className="mr-2" />
                    Use My Current Location
                  </button>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  Click on the map to change your delivery location
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DeliveryMap;