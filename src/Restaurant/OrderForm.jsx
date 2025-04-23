import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MealInfo from './MealInfo';

const OrderForm = ({ meal, totalAmount }) => {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const userId = localStorage.getItem('userId');
  
  const [formData, setFormData] = useState({
    quantity: 1,
    isSpicy: false,
    addDrink: false,
    selectedDrink: '',
    address: '',
    location: { lat: 0, lng: 0 },
    areaName: '',
    paymentMethod: 'mpesa',
    withFries: false,
    withSoda: false,
    extraCheese: false,
    extraSauce: false,
    withSalad: false,
    withChilly: false,
    withPasta: false,
    phoneNumber: '',
    specialInstructions: ''
  });
  const [loading, setLoading] = useState(false);
  const [deliveryFee] = useState(50);

  // Initialize user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Could not get your location. Please enable location services.');
        }
      );
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLocationSelect = async (latlng) => {
    try {
      const response = await axios.get(
        `https://api.opencagedata.com/geocode/v1/json?q=${latlng.lat}+${latlng.lng}&key=YOUR_OPENCAGE_API_KEY`
      );
      const areaName = response.data.results[0]?.formatted || '';
      
      setFormData(prev => ({
        ...prev,
        location: latlng,
        areaName,
        address: areaName
      }));
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Could not determine address for this location');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First create the order
      const orderResponse = await axios.post('http://192.168.137.1:3000/api/orders', {
        userId,
        mealId: meal.id,
        restaurantId: meal.restaurant_id,
        quantity: formData.quantity,
        isSpicy: formData.isSpicy,
        addDrink: formData.addDrink,
        selectedDrink: formData.selectedDrink,
        address: formData.address,
        deliveryFee,
        location: formData.location,
        areaName: formData.areaName,
        paymentMethod: formData.paymentMethod,
        withFries: formData.withFries,
        withSoda: formData.withSoda,
        extraCheese: formData.extraCheese,
        extraSauce: formData.extraSauce,
        withSalad: formData.withSalad,
        withChilly: formData.withChilly,
        withPasta: formData.withPasta,
        specialInstructions: formData.specialInstructions,
        totalAmount: totalAmount + (formData.addDrink ? drinkPrice : 0)
      });

      // Then process payment based on method
      if (formData.paymentMethod === 'mpesa') {
        await handleMpesaPayment(orderResponse.data.orderNumber);
      } else if (formData.paymentMethod === 'card') {
        await handleCardPayment(orderResponse.data.orderNumber);
      }

      toast.success('Order placed successfully!');
      navigate(`/order-confirmation/${orderResponse.data.orderNumber}`);

    } catch (error) {
      console.error('Order error:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handleMpesaPayment = async (orderNumber) => {
    try {
      await axios.post('http://192.168.137.1:3000/api/mpesa', {
        phoneNumber: formData.phoneNumber,
        amount: totalAmount,
        orderNumber
      });
      toast.info('Check your phone to complete M-Pesa payment');
    } catch (error) {
      throw new Error(error.response?.data?.message || 'M-Pesa payment failed');
    }
  };

  const handleCardPayment = async (orderNumber) => {
    if (!stripe || !elements) {
      throw new Error('Stripe not initialized');
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement),
    });

    if (error) {
      throw new Error(error.message);
    }

    await axios.post('http://192.168.137.1:3000/api/stripe', {
      paymentMethodId: paymentMethod.id,
      amount: totalAmount * 100, // Convert to cents
      orderNumber,
      currency: 'kes'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 max-w-2xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quantity */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Quantity
          </label>
          <input
            type="number"
            name="quantity"
            min="1"
            max="10"
            value={formData.quantity}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Special Options */}
        <div className="space-y-2">
          <label className="block text-gray-700 font-medium mb-2">
            Special Options
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: 'isSpicy', label: 'Spicy' },
              { name: 'withFries', label: 'With Fries' },
              { name: 'withSoda', label: 'With Soda' },
              { name: 'extraCheese', label: 'Extra Cheese' },
              { name: 'extraSauce', label: 'Extra Sauce' },
              { name: 'withSalad', label: 'With Salad' },
              { name: 'withChilly', label: 'With Chilly' },
              { name: 'withPasta', label: 'With Pasta' }
            ].map((option) => (
              <label key={option.name} className="flex items-center">
                <input
                  type="checkbox"
                  name={option.name}
                  checked={formData[option.name]}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 font-medium mb-2">
            Delivery Address
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Location Picker */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 font-medium mb-2">
            Select Delivery Location
          </label>
          <div className="h-64 rounded-lg overflow-hidden border">
            <MapContainer 
              center={[formData.location.lat, formData.location.lng]} 
              zoom={15}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationMarker 
                onLocationSelect={handleLocationSelect} 
                initialLocation={formData.location}
              />
            </MapContainer>
          </div>
        </div>

        {/* Special Instructions */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 font-medium mb-2">
            Special Instructions
          </label>
          <textarea
            name="specialInstructions"
            value={formData.specialInstructions}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            rows="3"
            placeholder="Any special requests?"
          />
        </div>

        {/* Payment Method */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 font-medium mb-2">
            Payment Method
          </label>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          >
            <option value="mpesa">M-Pesa</option>
            <option value="card">Credit/Debit Card</option>
          </select>
        </div>

        {/* Payment Details */}
        {formData.paymentMethod === 'mpesa' && (
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-medium mb-2">
              M-Pesa Phone Number (format: 2547XXXXXXXX)
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              pattern="2547[0-9]{8}"
              className="w-full p-2 border rounded"
              required
            />
          </div>
        )}

        {formData.paymentMethod === 'card' && (
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-medium mb-2">
              Card Details
            </label>
            <div className="p-3 border rounded">
              <CardElement options={{
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
              }} />
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2">Order Summary</h3>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Meal Price:</span>
              <span>Ksh {meal.price}</span>
            </div>
            <div className="flex justify-between">
              <span>Quantity:</span>
              <span>{formData.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee:</span>
              <span>Ksh {deliveryFee}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2 mt-2">
              <span>Total:</span>
              <span>Ksh {totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Place Order'}
          </button>
        </div>
      </div>
    </form>
  );
};


const LocationMarker = ({ initialLocation, onLocationSelect }) => {
  const [position, setPosition] = useState(initialLocation);
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
};

export default OrderForm;