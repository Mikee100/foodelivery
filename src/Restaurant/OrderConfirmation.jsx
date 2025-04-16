import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaCheckCircle, 
  FaSpinner, 
  FaShoppingBag,
  FaMapMarkerAlt,
  FaClock,
  FaCreditCard,
  FaMoneyBillWave,
  FaBarcode,
  FaShareAlt,
  FaPrint
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.get(`http://localhost:3000/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          const orderData = {
            ...response.data.data,
            total_amount: Number(response.data.data.total_amount || 0),
            delivery_fee: Number(response.data.data.delivery_fee || 0),
            items: response.data.data.items || [
              { name: response.data.data.meal_name, quantity: response.data.data.quantity, price: response.data.data.total_amount }
            ]
          };
          setOrder(orderData);
          toast.success('Order details loaded successfully');
        } else {
          setError(response.data.message || 'Failed to load order details');
          toast.error(response.data.message || 'Failed to load order details');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load order');
        toast.error(err.response?.data?.message || err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return 'Ksh 0.00';
    }
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `Order Confirmation #${order.order_number}`,
        text: `Your order #${order.order_number} has been confirmed. Total: ${formatCurrency(order.total_amount)}`,
        url: window.location.href,
      });
    } catch (err) {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast.info('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6"
      >
        <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Loading your order details</h2>
        <p className="text-gray-500 mt-2">Please wait while we fetch your order information</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6"
      >
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Order</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back Home
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen p-4 md:p-8 ${isPrinting ? 'print:p-0' : ''}`}
    >
      <div className={`max-w-5xl mx-auto ${isPrinting ? 'print:max-w-none' : ''}`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-8 print:hidden">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FaPrint /> Print
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FaShareAlt /> Share
            </button>
          </div>
        </div>

        {/* Order Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          {/* Confirmation Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white text-center">
            <FaCheckCircle className="mx-auto text-5xl mb-4" />
            <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-green-100">Thank you for your order</p>
            <div className="mt-4 bg-white/10 rounded-full inline-block px-4 py-1">
              <span className="font-medium">#{order.order_number}</span>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {/* Order Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FaShoppingBag /> Order Summary
                </h2>
                
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between border-b pb-3">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p>{formatCurrency(item.price)}</p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-gray-500">
                            {formatCurrency(item.price / item.quantity)} each
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatCurrency(order.total_amount - (order.delivery_fee || 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span>{formatCurrency(order.delivery_fee)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FaMapMarkerAlt /> Delivery Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-700">Delivery Address</h3>
                    <p className="text-gray-600">{order.address || 'Pickup from restaurant'}</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-700 flex items-center gap-2">
                      <FaClock /> Estimated Delivery Time
                    </h3>
                    <p className="text-gray-600">30-45 minutes</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-700 flex items-center gap-2">
                      {order.payment_method === 'mpesa' ? <FaMoneyBillWave /> : <FaCreditCard />}
                      Payment Method
                    </h3>
                    <p className="text-gray-600 capitalize">
                      {order.payment_method === 'mpesa' ? 'M-Pesa' : order.payment_method}
                    </p>
                    {order.payment_method === 'mpesa' && (
                      <div className="mt-2 bg-gray-100 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">
                          Payment request sent to your phone. Please complete the transaction.
                        </p>
                      </div>
                    )}
                  </div>

                  {order.special_instructions && (
                    <div>
                      <h3 className="font-medium text-gray-700">Special Instructions</h3>
                      <p className="text-gray-600">{order.special_instructions}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Status Timeline */}
            <div className="mt-10">
              <h2 className="text-xl font-bold mb-6">Order Status</h2>
              <div className="relative">
                {/* Timeline */}
                <div className="absolute left-4 h-full w-0.5 bg-gray-200 top-0"></div>
                
                {/* Timeline Steps */}
                <div className="space-y-8">
                  <div className="relative pl-10">
                    <div className="absolute left-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                      1
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <h3 className="font-medium text-green-800">Order Received</h3>
                      <p className="text-sm text-green-600">We've received your order</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.date).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="relative pl-10">
                    <div className="absolute left-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      2
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h3 className="font-medium text-blue-800">Preparing Your Order</h3>
                      <p className="text-sm text-blue-600">The restaurant is preparing your food</p>
                    </div>
                  </div>

                  <div className="relative pl-10">
                    <div className="absolute left-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
                      3
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="font-medium text-gray-800">On The Way</h3>
                      <p className="text-sm text-gray-600">Your order will be delivered soon</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code for Order Tracking (example) */}
            <div className="mt-10 text-center">
              <div className="inline-block p-4 bg-white border border-gray-200 rounded-lg">
                <FaBarcode className="text-4xl mx-auto text-gray-700 mb-2" />
                <p className="text-sm text-gray-600">Scan this code at the restaurant for order tracking</p>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="bg-gray-50 p-6 border-t flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600">Need help? Contact our support team</p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/contact')}
                className="px-6 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Contact Support
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </motion.div>

        {/* Order Again Section */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-bold mb-4">Enjoyed your order?</h2>
          <p className="text-gray-600 mb-6">Order again from your favorite restaurants</p>
          <button
            onClick={() => navigate(`/restaurants/${order.restaurant_id}`)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Order Again
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}