import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { FiClock, FiShoppingCart, FiArrowLeft, FiHeart, FiShare2, FiDollarSign } from 'react-icons/fi';
import { FaHeart, FaWhatsapp, FaFacebook, FaTwitter } from 'react-icons/fa';
import { GiMeal } from 'react-icons/gi';

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
  const [withFries, setWithFries] = useState(false);
  const [withSoda, setWithSoda] = useState(false);
  const [withSalad, setWithSalad] = useState(false);
  const [withSauce, setWithSauce] = useState(false);
  const [withChilly, setWithChilly] = useState(false);
  const [withPasta, setWithPasta] = useState(false);
  const stripe = useStripe();
  const elements = useElements();

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
        setMeal(response.data);
        setFavorite(false); // Replace with actual favorite check
      } catch (err) {
        setError(err.message || 'Failed to load meal details');
      } finally {
        setLoading(false);
      }
    };

    fetchMealDetails();
  }, [id]);

  const calculateTotal = () => {
    const basePrice = meal?.price || 0;
    const deliveryFee = deliveryOption === 'delivery' ? 1 : 0;
    // Add additional costs for extras if needed
    return (basePrice * quantity + deliveryFee).toFixed(2);
  };

  const handlePlaceOrder = async (paymentMethod) => {
    try {
      // Get user ID from your authentication system
      // This should come from your auth context or localStorage
      const userId = localStorage.getItem('userId') || 1; // Fallback for demo
      
      // Prepare the order data with all required fields
      const orderData = {
        userId: userId, // REQUIRED
        mealId: meal.id, // REQUIRED
        restaurantId: meal.restaurant_id, // REQUIRED
        quantity: quantity,
        isSpicy: isSpicy,
        addDrink: addDrink,
        selectedDrink: selectedDrink,
        address: deliveryOption === 'delivery' ? address : 'Pickup',
        deliveryFee: deliveryOption === 'delivery' ? 50 : 0,
        paymentMethod: paymentMethod, // REQUIRED
        withFries: withFries,
        withSoda: withSoda,
        withSalad: withSalad,
        withSauce: withSauce,
        withChilly: withChilly,
        withPasta: withPasta,
        specialInstructions: orderNotes,
        totalAmount: calculateTotal()
      };
  
      // Send the order to your backend
      const response = await axios.post('http://roundhouse.proxy.rlwy.net:3000/api/orders', orderData);
  
      if (response.data.success) {
        return response.data; // Return the created order
      } else {
        throw new Error(response.data.error || 'Failed to create order');
      }
    } catch (error) {
      console.error('Order Error:', error);
      throw error;
    }
  };
  const handleMpesaPayment = async () => {
    try {
      // Validate phone number
      if (!phoneNumber || !/^(07|2547|25407|\+2547)\d{8}$/.test(phoneNumber)) {
        throw new Error('Please enter a valid Kenyan phone number (e.g. 07XXXXXXXX or 2547XXXXXXXX)');
      }
  
      // First create the order
      const order = await handlePlaceOrder('mpesa');
      
      // Then initiate M-Pesa payment
      const amount = parseFloat(calculateTotal());
      if (isNaN(amount) || amount < 10) {
        throw new Error('Minimum payment amount is 10 KES');
      }
  
      const paymentResponse = await axios.post('http://localhost:3000/api/mpesa', {
        phoneNumber,
        amount: Math.floor(amount),
        order_id: order.id // Pass the order ID to link payment with order
      });
  
      if (paymentResponse.data.success) {
        alert('Payment initiated! Check your phone to complete the M-Pesa transaction');
        navigate(`/order-confirmation/${order.id}`);
      } else {
        throw new Error(paymentResponse.data.error || 'Payment initiation failed');
      }
    } catch (error) {
      alert(`Order failed: ${error.message}`);
    }
  };
  
  const handleStripePayment = async () => {
    if (!stripe || !elements) return;
  
    try {
      // First create the order
      const order = await handlePlaceOrder('card');
      
      // Then process Stripe payment
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
      });
  
      if (error) throw error;
  
      const response = await axios.post('http://localhost:3000/api/stripe', {
        amount: calculateTotal() * 100,
        currency: 'usd',
        payment_method: paymentMethod.id,
        order_id: order.id // Pass the order ID to link payment with order
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
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
      <div className="container mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-6xl mx-auto">
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
                <span>Ready in {meal.preparation_time || 30} mins</span>
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
                    <h3 className="font-semibold text-blue-800 mb-2">Ingredients</h3>
                    <ul className="list-disc list-inside text-gray-700">
                      {meal.ingredients?.length > 0 ? (
                        meal.ingredients.map((ingredient, index) => (
                          <li key={index}>{ingredient}</li>
                        ))
                      ) : (
                        <li>Fresh ingredients sourced locally</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'nutrition' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Nutritional Information</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-600">Calories</p>
                      <p className="text-xl font-bold">{meal.calories || '450'} kcal</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-yellow-600">Protein</p>
                      <p className="text-xl font-bold">{meal.protein || '25'}g</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-600">Carbs</p>
                      <p className="text-xl font-bold">{meal.carbs || '45'}g</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-purple-600">Fats</p>
                      <p className="text-xl font-bold">{meal.fats || '15'}g</p>
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
            <div className="md:w-1/2 bg-gray-50 p-6 md:p-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Now</h2>
                
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
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">Delivery Option</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setDeliveryOption('delivery')}
                      className={`py-2 px-4 rounded-lg border ${deliveryOption === 'delivery' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-blue-300'}`}
                    >
                      Delivery (+Ksh 50)
                    </button>
                    <button
                      onClick={() => setDeliveryOption('pickup')}
                      className={`py-2 px-4 rounded-lg border ${deliveryOption === 'pickup' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-blue-300'}`}
                    >
                      Pickup
                    </button>
                  </div>
                </div>

                {/* Delivery Address (shown only for delivery) */}
                {deliveryOption === 'delivery' && (
                  <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2">Delivery Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter your delivery address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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

                    {/* Additional Options */}
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={withFries}
                          onChange={() => setWithFries(!withFries)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-700">With fries</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={withSoda}
                          onChange={() => setWithSoda(!withSoda)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-700">With soda</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={withSalad}
                          onChange={() => setWithSalad(!withSalad)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-700">With salad</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={withSauce}
                          onChange={() => setWithSauce(!withSauce)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-700">Extra sauce</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={withChilly}
                          onChange={() => setWithChilly(!withChilly)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-700">Add chilly</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={withPasta}
                          onChange={() => setWithPasta(!withPasta)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-700">With pasta</span>
                      </label>
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
                      <span className="text-gray-600">Delivery Fee</span>
                      <span className="font-medium">Ksh 50.00</span>
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
                            className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                          >
                            Pay with M-Pesa
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
                            className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                          >
                            <FiDollarSign className="mr-2" />
                            Pay with Card
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