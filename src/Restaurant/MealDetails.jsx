import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { 
  FiClock, 
  FiShoppingCart, 
  FiArrowLeft, 
  FiHeart, 
  FiShare2, 
  FiDollarSign,
  FiStar,
  FiMapPin,
  FiPhone
} from 'react-icons/fi';
import { FaHeart, FaWhatsapp, FaFacebook, FaTwitter, FaUtensils } from 'react-icons/fa';
import { GiMeal, GiHotMeal } from 'react-icons/gi';
import { MdDeliveryDining } from 'react-icons/md';
import DeliveryMap from './DeliveryMap';

const stripePromise = loadStripe('your-stripe-public-key');

function MealDetailsComponent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [deliveryOption, setDeliveryOption] = useState('delivery');
  const [address, setAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [selectedDrink, setSelectedDrink] = useState('');
  const [isSpicy, setIsSpicy] = useState(false);
  const [addDrink, setAddDrink] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  const [deliveryFee, setDeliveryFee] = useState(50); // Default fee
  const [deliveryTime, setDeliveryTime] = useState(30); // Default time in minutes
  const [distance, setDistance] = useState(0); // Distance in km
  const [userLocation, setUserLocation] = useState(null);
  const [deliveryCalculated, setDeliveryCalculated] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  // Available drink options
  const drinkOptions = [
    'Water',
    'Soda',
    'Juice',
    'Tea',
    'Coffee',
    'Beer',
    'Wine'
  ];

  useEffect(() => {
    const fetchMealDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:3000/api/meals/${id}`);
        
        if (response.data.success) {
          setMeal(response.data.data);
          console.log('Meal data loaded:', response.data.data);
          console.log('Restaurant location from meal:', response.data.data.restaurantLocation);
          // Set default values based on meal data
          setIsSpicy(response.data.data.name?.toLowerCase().includes('spicy') || false);
        } else {
          setError(response.data.message || 'Failed to load meal details');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load meal details');
      } finally {
        setLoading(false);
      }
    };

    fetchMealDetails();
  }, [id]);

 
  const calculateTotal = () => {
    const basePrice = meal?.price || 0;
    const currentDeliveryFee = deliveryOption === 'delivery' ? deliveryFee : 0;
    return (basePrice * quantity + currentDeliveryFee).toFixed(2);
  };

  // Get delivery status message
  const getDeliveryStatusMessage = () => {
    if (deliveryOption === 'pickup') {
      return 'Pickup from restaurant';
    }
    if (!deliveryCalculated) {
      return 'Set your delivery location on the map';
    }
    if (distance > 20) {
      return 'Delivery distance is too far';
    }
    return `Delivery to your location (${distance.toFixed(1)} km away)`;
  };

  // Get delivery status color
  const getDeliveryStatusColor = () => {
    if (deliveryOption === 'pickup') return 'text-green-600';
    if (!deliveryCalculated) return 'text-yellow-600';
    if (distance > 20) return 'text-red-600';
    return 'text-green-600';
  };

  // Add this near your other imports
  // Add this check before rendering the order form
if (!meal?.restaurant_id) {
  return (
    <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200 my-4">
      <p className="font-medium">We can't process orders for this meal right now.</p>
      <p className="mt-1">The restaurant information is missing.</p>
      <button 
        onClick={() => window.location.reload()}
        className="mt-2 text-blue-600 hover:underline"
      >
        Try Again
      </button>
      <button 
        onClick={() => navigate(-1)}
        className="mt-2 ml-4 text-blue-600 hover:underline"
      >
        Back to Menu
      </button>
    </div>
  );
}

  // Enhanced delivery calculation handler
  const handleDeliveryCalculated = ({ distance, fee, time, userPosition, isValid }) => {
    console.log('Delivery calculated:', { distance, fee, time, userPosition, isValid });
    setDistance(distance);
    setDeliveryFee(fee);
    setDeliveryTime(time);
    setUserLocation(userPosition);
    setDeliveryCalculated(isValid);
  };

  // Handle address updates from map
  const handleAddressUpdate = (newAddress) => {
    setAddress(newAddress);
    setIsGeocoding(false);
  };

  // Handle geocoding start
  const handleGeocodingStart = () => {
    setIsGeocoding(true);
  };

// Modify your handlePlaceOrder function:
const handlePlaceOrder = async (paymentMethod) => {
  try {
    // 1. Token Validation
    const token = sessionStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please login.');
    }

    // 2. Data Preparation
    const orderData = {
      meal_id: meal.id,
      restaurant_id: meal.restaurant_id,
      quantity: quantity,
      is_spicy: isSpicy,
      add_drink: addDrink,
      selected_drink: selectedDrink,
      address: deliveryOption === 'delivery' ? address : 'Pickup',
      delivery_fee: deliveryOption === 'delivery' ? 50 : 0,
      payment_method: paymentMethod,
      special_instructions: orderNotes,
      total_amount: parseFloat(calculateTotal())
    };

    // 3. Request Headers
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      validateStatus: (status) => status < 500 // Don't throw for 4xx errors
    };

    // 4. API Call
    const response = await axios.post(
      'http://localhost:3000/api/orders', 
      orderData, 
      config
    );

    // 5. Response Handling
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create order');
    }

    return response.data;

  } catch (error) {
    // 6. Error Handling
    const errorDetails = {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    };

    console.error('Order placement error:', errorDetails);

    // Handle specific error cases
    if (error.response?.status === 401 || errorDetails.response?.code === 'INVALID_TOKEN') {
      sessionStorage.removeItem('token');
      navigate('/login', { 
        state: { 
          from: `/meal/${id}`,
          message: 'Session expired. Please login again.'
        } 
      });
      throw new Error('Session expired. Please login again.');
    }

    // Show user-friendly message
    const errorMessage = error.response?.data?.error || 
                        errorDetails.response?.message || 
                        'Failed to place order. Please try again.';
    
    throw new Error(errorMessage);
  }
};
const handleMpesaPayment = async () => {
  try {
    // Validate phone number
    if (!phoneNumber || !/^(07|2547|25407|\+2547)\d{8}$/.test(phoneNumber)) {
      throw new Error('Please enter a valid Kenyan phone number (e.g. 07XXXXXXXX or 2547XXXXXXXX)');
    }

    // Validate delivery distance
    if (deliveryOption === 'delivery' && distance > 20) {
      throw new Error('Delivery distance is too far. Please choose a closer location or select pickup.');
    }

    // Validate delivery location is set
    if (deliveryOption === 'delivery' && !deliveryCalculated) {
      throw new Error('Please set your delivery location on the map first.');
    }

    // First create the order
    const order = await handlePlaceOrder('mpesa');
    
    // Validate amount
    const amount = parseFloat(calculateTotal());
    if (isNaN(amount) || amount < 10) {
      throw new Error('Minimum payment amount is 10 KES');
    }

    // Initiate M-Pesa payment
    const paymentResponse = await axios.post('http://localhost:3000/api/mpesa', {
      phoneNumber,
      amount: Math.floor(amount),
      order_id: order.orderId // Use orderId instead of id
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!paymentResponse.data.success) {
      throw new Error(paymentResponse.data.message || 'Payment initiation failed');
    }

    alert('Payment initiated! Check your phone to complete the M-Pesa transaction');
    navigate(`/order-confirmation/${order.orderId}`); // Use orderId here

  } catch (error) {
    console.error('Payment error:', error);
    alert(`Payment failed: ${error.message}`);
  }
};
  
  const handleStripePayment = async () => {
    if (!stripe || !elements) return;
  
    try {
      // Validate delivery distance
      if (deliveryOption === 'delivery' && distance > 20) {
        throw new Error('Delivery distance is too far. Please choose a closer location or select pickup.');
      }

      // Validate delivery location is set
      if (deliveryOption === 'delivery' && !deliveryCalculated) {
        throw new Error('Please set your delivery location on the map first.');
      }

      const order = await handlePlaceOrder('card');
      
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
      });
  
      if (error) throw error;
  
      const response = await axios.post('http://localhost:3000/api/stripe', {
        amount: calculateTotal() * 100,
        currency: 'usd',
        payment_method: paymentMethod.id,
        order_id: order.id
      });
  
      if (response.data.success) {
        alert('Payment successful! Your order is being processed.');
        navigate(`/order-confirmation/${order.id}`);
      }
    } catch (error) {
      alert(`Order failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const toggleFavorite = () => {
    setFavorite(!favorite);
  };

  const shareMeal = () => {
    if (navigator.share) {
      navigator.share({
        title: meal?.name,
        text: `Check out this delicious ${meal?.name} on our app!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      alert('Share this link: ' + window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-100 to-blue-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading delicious details...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-100 to-blue-100">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <GiMeal className="text-5xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!meal) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8 relative" style={{ zIndex: 1 }}>
      {/* Back Button */}
      <div className="container mx-auto mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <FiArrowLeft className="mr-2" /> Back to menu
        </button>
      </div>

      {/* Main Content */}
      <div className="container mx-auto relative z-10">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-6xl mx-auto relative">
          {/* Meal Header */}
          <div className="relative">
            <img
              src={meal.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'}
              alt={meal.name}
              className="w-full h-64 sm:h-80 md:h-96 object-cover"
            />
            <div className="absolute top-4 right-4 flex space-x-2">
              <button
                onClick={toggleFavorite}
                className="bg-white/90 hover:bg-white text-red-500 p-3 rounded-full shadow-md transition-all"
                aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
              >
                {favorite ? <FaHeart className="text-xl" /> : <FiHeart className="text-xl" />}
              </button>
              <button
                onClick={shareMeal}
                className="bg-white/90 hover:bg-white text-blue-500 p-3 rounded-full shadow-md transition-all"
                aria-label="Share this meal"
              >
                <FiShare2 className="text-xl" />
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-white">{meal.name}</h1>
              <div className="flex items-center mt-2 text-white">
                <FiClock className="mr-2" />
                <span>Ready in 30 mins</span>
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('nutrition')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'nutrition' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Nutrition
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'reviews' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Reviews
              </button>
            </nav>
          </div>

          <div className="md:flex">
            {/* Left Column - Meal Info */}
            <div className="md:w-1/2 p-6 md:p-8">
              {activeTab === 'details' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">About this meal</h2>
                  <p className="text-gray-600 mb-6">{meal.description || 'A delicious meal prepared with care and fresh ingredients.'}</p>
                  
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-blue-800 mb-2">Category</h3>
                    <p className="text-gray-700 flex items-center">
                      <FaUtensils className="mr-2" />
                      {meal.categoryName || 'No category specified'}
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-green-800 mb-2">Restaurant</h3>
                    <p className="text-gray-700">
                      {meal.restaurantName || 'No restaurant specified'}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'nutrition' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Nutritional Information</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-600">Calories</p>
                      <p className="text-xl font-bold">450 kcal</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-yellow-600">Protein</p>
                      <p className="text-xl font-bold">25g</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-600">Carbs</p>
                      <p className="text-xl font-bold">45g</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-purple-600">Fats</p>
                      <p className="text-xl font-bold">15g</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Customer Reviews</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600 italic">No reviews yet. Be the first to review!</p>
                  </div>
                </div>
              )}

              {/* Social Sharing */}
              <div className="mt-8">
                <h3 className="font-medium text-gray-700 mb-2">Share this meal</h3>
                <div className="flex space-x-3">
                  <button className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-full">
                    <FaWhatsapp className="text-xl" />
                  </button>
                  <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-full">
                    <FaFacebook className="text-xl" />
                  </button>
                  <button className="bg-blue-100 hover:bg-blue-200 text-blue-500 p-2 rounded-full">
                    <FaTwitter className="text-xl" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Order Form */}
            <div className="md:w-1/2 bg-gray-50 p-6 md:p-8 overflow-hidden">
              <div className="bg-white rounded-xl shadow-sm p-6 overflow-hidden">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Now</h2>
                
                {/* Price Display */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">Ksh {meal.price?.toFixed(2) || '0.00'}</p>
                </div>
                
                {/* Quantity Selector */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">Quantity</label>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-32">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-medium">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Delivery Options */}
               {/* Replace the existing delivery options section with this: */}
<div className="mb-6">
  <label className="block text-gray-700 font-medium mb-2">Delivery Option</label>
  <div className="grid grid-cols-2 gap-3 mb-4">
    <button
      onClick={() => setDeliveryOption('delivery')}
      className={`py-2 px-4 rounded-lg border ${deliveryOption === 'delivery' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-blue-300'}`}
    >
      Delivery
    </button>
    <button
      onClick={() => setDeliveryOption('pickup')}
      className={`py-2 px-4 rounded-lg border ${deliveryOption === 'pickup' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-blue-300'}`}
    >
      Pickup
    </button>
  </div>

  {deliveryOption === 'delivery' && (
    <div className="space-y-4 relative overflow-hidden">
      {/* Delivery Map Component */}
      <div className="relative z-0 overflow-hidden rounded-lg">
        <DeliveryMap 
          restaurantPosition={
            (() => {
              // Default restaurant position (Nairobi city center)
              const defaultPosition = { lat: -1.2921, lng: 36.8219 };
              
              if (!meal.restaurantLocation) {
                console.log('No restaurant location found, using default');
                return defaultPosition;
              }
              
              if (Array.isArray(meal.restaurantLocation)) {
                console.log('Restaurant location is array:', meal.restaurantLocation);
                return { lat: meal.restaurantLocation[0], lng: meal.restaurantLocation[1] };
              }
              
              if (meal.restaurantLocation.lat && meal.restaurantLocation.lng) {
                console.log('Restaurant location is object:', meal.restaurantLocation);
                return meal.restaurantLocation;
              }
              
              console.log('Invalid restaurant location format, using default');
              return defaultPosition;
            })()
          }
          onDeliveryCalculated={handleDeliveryCalculated}
          onAddressUpdate={handleAddressUpdate}
          onGeocodingStart={handleGeocodingStart}
          baseDeliveryFee={50}
          deliveryRatePerKm={10}
        />
      </div>


    
    </div>
  )}
</div>

                {/* Delivery Address (shown only for delivery) */}
                {deliveryOption === 'delivery' && (
                  <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2">
                      Delivery Address
                      <span className="text-sm text-gray-500 ml-2">
                        (Click on map or use location button to auto-fill)
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Click on the map to set your delivery address automatically"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                        disabled={isGeocoding}
                      />
                      {isGeocoding && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                      {address && !isGeocoding && (
                        <button
                          onClick={() => setAddress('')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          title="Clear address"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    {address && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Address set from map location
                      </p>
                    )}
                  </div>
                )}


                {/* Meal Customization Options */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">Customize Your Meal</label>
                  <div className="space-y-3">
                    {/* Spicy Option */}
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isSpicy}
                        onChange={() => setIsSpicy(!isSpicy)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700">Make it spicy</span>
                    </label>

                    {/* Drink Options */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={addDrink}
                        onChange={() => setAddDrink(!addDrink)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700">Add a drink</span>
                      {addDrink && (
                        <select
                          value={selectedDrink}
                          onChange={(e) => setSelectedDrink(e.target.value)}
                          className="ml-3 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select drink</option>
                          {drinkOptions.map((drink, index) => (
                            <option key={index} value={drink}>{drink}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {/* Special Instructions */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">Special Instructions</label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Any special requests or dietary restrictions?"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Order Summary */}
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Meal Price</span>
                    <span className="font-medium">Ksh {(meal.price * quantity).toFixed(2)}</span>
                  </div>
                  {deliveryOption === 'delivery' && (
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">
                        Delivery Fee
                        {deliveryCalculated && distance > 0 && (
                          <span className="text-xs text-gray-500 block">
                            ({distance.toFixed(1)} km)
                          </span>
                        )}
                      </span>
                      <span className="font-medium">Ksh {Math.round(deliveryFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between mt-4 pt-4 border-t border-gray-200">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-lg text-blue-600">Ksh {calculateTotal()}</span>
                  </div>
                </div>

                {/* Payment Options */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">Payment Method</h3>
                    <div className="space-y-3">
                      {/* M-Pesa Option */}
                      <div className="border border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="payment"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            defaultChecked
                          />
                          <span className="ml-3 block text-gray-700 font-medium">M-Pesa</span>
                        </label>
                        <div className="mt-3 ml-7">
                          <input
                            type="tel"
                            placeholder="2547XXXXXXXX"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={handleMpesaPayment}
                            disabled={deliveryOption === 'delivery' && (!deliveryCalculated || distance > 20)}
                            className={`mt-3 w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                              deliveryOption === 'delivery' && (!deliveryCalculated || distance > 20)
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            {deliveryOption === 'delivery' && !deliveryCalculated 
                              ? 'Set Delivery Location First'
                              : deliveryOption === 'delivery' && distance > 20
                              ? 'Distance Too Far'
                              : 'Pay with M-Pesa'
                            }
                          </button>
                        </div>
                      </div>

                      {/* Card Payment Option */}
                      <div className="border border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="payment"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-3 block text-gray-700 font-medium">Credit/Debit Card</span>
                        </label>
                        <div className="mt-3 ml-7">
                          <div className="p-3 border border-gray-300 rounded-md bg-white">
                            <CardElement 
                              options={{
                                style: {
                                  base: {
                                    fontSize: '16px',
                                    color: '#424770',
                                    '::placeholder': {
                                      color: '#aab7c4',
                                    },
                                  },
                                  invalid: {
                                    color: '#9e2146',
                                  },
                                },
                              }}
                            />
                          </div>
                          <button
                            onClick={handleStripePayment}
                            disabled={deliveryOption === 'delivery' && (!deliveryCalculated || distance > 20)}
                            className={`mt-3 w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
                              deliveryOption === 'delivery' && (!deliveryCalculated || distance > 20)
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            <FiDollarSign className="mr-2" />
                            {deliveryOption === 'delivery' && !deliveryCalculated 
                              ? 'Set Delivery Location First'
                              : deliveryOption === 'delivery' && distance > 20
                              ? 'Distance Too Far'
                              : 'Pay with Card'
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MealDetails() {
  return (
    <Elements stripe={stripePromise}>
      <MealDetailsComponent />
    </Elements>
  );
}