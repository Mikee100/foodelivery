import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const OrderForm = ({ meal, totalAmount, handleMpesaPayment, handleStripePayment, phoneNumber, setPhoneNumber }) => {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [isSpicy, setIsSpicy] = useState(false);
  const [addDrink, setAddDrink] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState('');
  const [drinkPrice, setDrinkPrice] = useState(0);
  const [address, setAddress] = useState('');
  const [deliveryFee] = useState(50); // Example delivery fee
  const [location, setLocation] = useState({ lat: 0, lng: 0 });
  const [areaName, setAreaName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [withFries, setWithFries] = useState(false);
  const [withSoda, setWithSoda] = useState(false);
  const [extraCheese, setExtraCheese] = useState(false);
  const [extraSauce, setExtraSauce] = useState(false);
  const [withSalad, setWithSalad] = useState(false);
  const [withChilly, setWithChilly] = useState(false);
  const [withPasta, setWithPasta] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting user location:', error);
        }
      );
    }
  }, []);

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const order = {
      mealId: meal.id,
      restaurantId: meal.restaurant_id,
      quantity,
      isSpicy,
      addDrink,
      selectedDrink,
      address,
      deliveryFee,
      location,
      areaName,
      paymentMethod,
      withFries,
      withSoda,
      extraCheese,
      extraSauce,
      withSalad,
      withChilly,
      withPasta,
    };
    try {
      const response = await axios.post('http://localhost:3000/api/orders', order);
      setLoading(false);
      setSuccessMessage('Order placed successfully');
      setTimeout(() => {
        navigate(`/order/${response.data.orderId}`);
      }, 2000);
    } catch (error) {
      setLoading(false);
      console.error('Error placing order:', error);
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

  return (
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
            checked={withFries}
            onChange={(e) => setWithFries(e.target.checked)}
            className="mr-2 leading-tight"
          />
          With Fries
        </label>
      </div>
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          <input
            type="checkbox"
            checked={withSoda}
            onChange={(e) => setWithSoda(e.target.checked)}
            className="mr-2 leading-tight"
          />
          With Soda
        </label>
      </div>
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          <input
            type="checkbox"
            checked={extraCheese}
            onChange={(e) => setExtraCheese(e.target.checked)}
            className="mr-2 leading-tight"
          />
          Extra Cheese
        </label>
      </div>
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          <input
            type="checkbox"
            checked={extraSauce}
            onChange={(e) => setExtraSauce(e.target.checked)}
            className="mr-2 leading-tight"
          />
          Extra Sauce
        </label>
      </div>
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          <input
            type="checkbox"
            checked={withSalad}
            onChange={(e) => setWithSalad(e.target.checked)}
            className="mr-2 leading-tight"
          />
          With Salad
        </label>
      </div>
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          <input
            type="checkbox"
            checked={withChilly}
            onChange={(e) => setWithChilly(e.target.checked)}
            className="mr-2 leading-tight"
          />
          With Chilly
        </label>
      </div>
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          <input
            type="checkbox"
            checked={withPasta}
            onChange={(e) => setWithPasta(e.target.checked)}
            className="mr-2 leading-tight"
          />
          With Pasta
        </label>
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
        <MapContainer center={[location.lat, location.lng]} zoom={15} style={{ height: '300px', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker location={location} setLocation={setLocation} setAreaName={setAreaName} setAddress={setAddress} />
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
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-white" role="status">
            
          </div>
        </div>
      )}
      {successMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">{successMessage}</h2>
          </div>
        </div>
      )}
      {areaName && (
        <div className="mt-4">
          <p className="text-gray-700 text-sm font-bold mb-2">Selected Area: {areaName}</p>
        </div>
      )}
    </form>
  );
};

function LocationMarker({ location, setLocation, setAreaName, setAddress }) {
  const map = useMapEvents({
    click(e) {
      setLocation(e.latlng);
      map.flyTo(e.latlng, map.getZoom());

      // Reverse geocoding to get the area name
      const fetchAreaName = async () => {
        try {
          const response = await axios.get(`https://api.opencagedata.com/geocode/v1/json?q=${e.latlng.lat}+${e.latlng.lng}&key=3c6d34ba30be4245b9f40ca0afc9174b`);
          const areaName = response.data.results[0].formatted;
          setAreaName(areaName);
          setAddress(areaName); // Update the address field with the area name
          console.log(areaName);
        } catch (error) {
          console.error('Error fetching area name:', error);
        }
      };

      fetchAreaName();
    },
  });

  return location === null ? null : (
    <Marker position={location}></Marker>
  );
}

export default OrderForm;