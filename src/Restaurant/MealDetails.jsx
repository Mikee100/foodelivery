import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_51P1B7LCXIhVW50LesYpPi6AtOMCuxUu6vIOa9rXOiHshVmgIOR9MRTrS8QgvwOL1Q7W409Y0BwVkwZNwkOwGyKxt00htQVUS9I');

function MealDetailsComponent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meal, setMeal] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isSpicy, setIsSpicy] = useState(false);
  const [addDrink, setAddDrink] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState('');
  const [drinkPrice, setDrinkPrice] = useState(0);
  const [address, setAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(50); // Example delivery fee
  const [location, setLocation] = useState({ lat: 0, lng: 0 });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    const fetchMealDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/meals/${id}`);
        setMeal(response.data);
        console.log(response.data.restaurant_id); // Log the restaurant_id from the response data
      } catch (error) {
        console.error('Error fetching meal details:', error);
      }
    };

    fetchMealDetails();
  }, [id]);

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    const order = {
      mealId: id,
      restaurantId: meal.restaurant_id, // Include the restaurant_id in the order
      quantity,
      isSpicy,
      addDrink,
      selectedDrink,
      address,
      deliveryFee,
      location,
      paymentMethod,
    };
    try {
      const response = await axios.post('http://localhost:3000/api/orders', order);
      alert('Order placed successfully');
      navigate(`/order/${response.data.orderId}`);
    } catch (error) {
      console.error('Error placing order:', error);
    }
  };

  const handleMpesaPayment = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/mpesa', {
        phoneNumber,
        amount: totalAmount,
      });
      alert('Mpesa payment initiated');
    } catch (error) {
      console.error('Error initiating Mpesa payment:', error);
    }
  };

  const handleStripePayment = async () => {
    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return;
    }

    const cardElement = elements.getElement(CardElement);
    try {
      const { token } = await stripe.createToken(cardElement);
      const response = await axios.post('http://localhost:3000/api/stripe', {
        amount: totalAmount * 100, // Stripe expects the amount in cents
        currency: 'usd',
        source: token.id,
      });
      alert('Stripe payment successful');
    } catch (error) {
      console.error('Error processing Stripe payment:', error);
    }
  };

  const handleAddDrinkChange = (e) => {
    setAddDrink(e.target.checked);
    if (!e.target.checked) {
      setSelectedDrink('');
      setDrinkPrice(0);
    }
  };

  const handleDrinkSelect = (drink, price) => {
    setSelectedDrink(drink);
    setDrinkPrice(price);
  };

  if (!meal) {
    return <div>Loading...</div>;
  }

  function LocationMarker() {
    const map = useMapEvents({
      click(e) {
        setLocation(e.latlng);
        map.flyTo(e.latlng, map.getZoom());
      },
    });

    return location === null ? null : (
      <Marker position={location}></Marker>
    );
  }

  const totalAmount = meal.price * quantity + deliveryFee + drinkPrice;

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-400 to-blue-500 p-6 flex flex-col items-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl">
        <h1 className="text-5xl font-extrabold text-center text-gray-800 mb-12">{meal.name}</h1>
        <img src={meal.image} alt={meal.name} className="w-full h-96 object-cover mb-6 rounded-lg" />
        <p className="text-gray-700 text-lg mb-6">{meal.description}</p>
        <p className="text-gray-900 text-lg mb-6 font-bold">Price: Ksh{meal.price}</p>
        <div className="mb-6">
          <h3 className="text-2xl font-bold mb-4">Specifications</h3>
          <ul className="list-disc list-inside">
            {meal.spicy && <li>Spicy</li>}
            {meal.with_fries && <li>With Fries</li>}
            {meal.with_soda && <li>With Soda</li>}
            {meal.with_salad && <li>With Salad</li>}
            {meal.with_sauce && <li>With Sauce</li>}
            {meal.with_chilly && <li>With Chilly</li>}
            {meal.with_pasta && <li>With Pasta</li>}
            {meal.vegetarian && <li>Vegetarian</li>}
            {meal.vegan && <li>Vegan</li>}
            {meal.gluten_free && <li>Gluten Free</li>}
            {meal.organic && <li>Organic</li>}
            {meal.allergens && <li>Allergens: {meal.allergens}</li>}
            {meal.seasonal && <li>Seasonal</li>}
            {meal.available_season && <li>Available Season: {meal.available_season}</li>}
            {meal.calories && <li>Calories: {meal.calories}</li>}
            {meal.protein && <li>Protein: {meal.protein}g</li>}
            {meal.carbohydrates && <li>Carbohydrates: {meal.carbohydrates}g</li>}
            {meal.fats && <li>Fats: {meal.fats}g</li>}
          </ul>
        </div>
        <form onSubmit={handleOrderSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="quantity">
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              <input
                type="checkbox"
                checked={isSpicy}
                onChange={(e) => setIsSpicy(e.target.checked)}
                className="mr-2 leading-tight"
              />
              Spicy
            </label>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              <input
                type="checkbox"
                checked={addDrink}
                onChange={handleAddDrinkChange}
                className="mr-2 leading-tight"
              />
              Add Drink
            </label>
            {addDrink && (
              <div className="mt-4">
                <h3 className="text-lg font-bold mb-2">Select a Drink</h3>
                <div className="space-y-4">
                  <button
                    type="button"
                    className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full ${selectedDrink === 'Coke' ? 'bg-blue-700' : ''}`}
                    onClick={() => handleDrinkSelect('Coke', 50)}
                  >
                    Coke (Ksh50)
                  </button>
                  <button
                    type="button"
                    className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full ${selectedDrink === 'Pepsi' ? 'bg-blue-700' : ''}`}
                    onClick={() => handleDrinkSelect('Pepsi', 50)}
                  >
                    Pepsi (Ksh50)
                  </button>
                  <button
                    type="button"
                    className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full ${selectedDrink === 'Sprite' ? 'bg-blue-700' : ''}`}
                    onClick={() => handleDrinkSelect('Sprite', 50)}
                  >
                    Sprite (Ksh50)
                  </button>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
              Delivery Address
            </label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Delivery Location
            </label>
            <MapContainer center={[0, 0]} zoom={2} style={{ height: '300px', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker />
            </MapContainer>
          </div>
          <div>
            <p className="text-gray-700 text-sm font-bold mb-2">Delivery Fee: Ksh{deliveryFee}</p>
          </div>
          <div>
            <p className="text-gray-700 text-sm font-bold mb-2">Total Amount: Ksh{totalAmount}</p>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="mpesa">Mpesa</option>
              <option value="bank">Bank</option>
            </select>
          </div>
          {paymentMethod === 'mpesa' && (
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phoneNumber">
                Phone Number
              </label>
              <input
                type="text"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
              <button
                type="button"
                onClick={handleMpesaPayment}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline w-full mt-4"
              >
                Pay with Mpesa
              </button>
            </div>
          )}
          {paymentMethod === 'bank' && (
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Card Details
              </label>
              <CardElement className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
              <button
                type="button"
                onClick={handleStripePayment}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline w-full mt-4"
              >
                Pay with Bank
              </button>
            </div>
          )}
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            Place Order
          </button>
        </form>
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