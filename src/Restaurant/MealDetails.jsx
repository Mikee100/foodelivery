import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import MealInfo from './MealInfo';
import OrderForm from './OrderForm';

const stripePromise = loadStripe('your-stripe-public-key');

function MealDetailsComponent() {
  const { id } = useParams();
  const [meal, setMeal] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    const fetchMealDetails = async () => {
      try {
        const response = await axios.get(`http://192.168.181.75:3000/api/meals/${id}`);
        setMeal(response.data);
      } catch (error) {
        console.error('Error fetching meal details:', error);
      }
    };

    fetchMealDetails();
  }, [id]);

  if (!meal) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-500 to-blue-700">
        <div className="flex flex-col items-center text-white text-lg font-semibold">
          <div className="loader rounded-full border-t-4 border-white w-16 h-16 mb-4 animate-spin"></div>
          Loading meal details...
        </div>
      </div>
    );
  }

  const totalAmount = meal.price * 1 + 50; // Example calculation

  const handleMpesaPayment = async () => {
    try {
      const response = await axios.post('http://192.168.181.75:3000/api/mpesa', {
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
      return;
    }

    const cardElement = elements.getElement(CardElement);
    try {
      const { token } = await stripe.createToken(cardElement);
      const response = await axios.post('http://192.168.181.75:3000/api/stripe', {
        amount: totalAmount * 100,
        currency: 'usd',
        source: token.id,
      });
      alert('Stripe payment successful');
    } catch (error) {
      console.error('Error processing Stripe payment:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br bg-white mt-16 text-gray-800 p-6">
      <div className="bg-white rounded-lg shadow-2xl overflow-hidden max-w-5xl w-full md:flex md:space-x-8 transform transition-transform duration-500 hover:scale-105">
        <div className="md:w-1/2 p-6">
          <MealInfo meal={meal} />
        </div>
        <div className="md:w-1/2 p-6 flex flex-col justify-center">
          <OrderForm
            meal={meal}
            totalAmount={totalAmount}
            handleMpesaPayment={handleMpesaPayment}
            handleStripePayment={handleStripePayment}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
          />
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
