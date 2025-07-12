import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt, 
  FaClock, 
  FaTimes, 
  FaRedo,
  FaWhatsapp,
  FaPrint,
  FaShareAlt,
  FaExclamationTriangle,
  FaUtensils,
  FaFire,
  FaCoffee,
  FaHamburger,
  FaLeaf,
  FaPepperHot,
  FaPizzaSlice,
  FaShoppingBag,
  FaMoneyBillWave,
  FaCreditCard,
  FaQrcode
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function OrderStatus() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [estimatedDelivery, setEstimatedDelivery] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    const fetchOrderStatus = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/orders/number/${orderNumber}`);
        if (response.data) {
          setOrder(response.data);
          setLastUpdate(new Date());
          
          // Calculate estimated delivery time
          calculateEstimatedDelivery(response.data);
        } else {
          setError('Order not found');
        }
      } catch (error) {
        console.error('Error fetching order status:', error);
        setError('Error fetching order status');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderStatus();

    // WebSocket connection for real-time updates
    const connectWebSocket = () => {
      wsRef.current = new WebSocket('ws://localhost:3000');

      wsRef.current.onopen = () => {
        console.log('WebSocket connection established');
        // Subscribe to order updates
        wsRef.current.send(JSON.stringify({
          type: 'subscribe_order',
          orderNumber: orderNumber
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'order_update' && data.orderNumber === orderNumber) {
            setOrder(prevOrder => {
              const updatedOrder = { ...prevOrder, status: data.status };
              
              // Recalculate delivery time on status change
              calculateEstimatedDelivery(updatedOrder);
              
              return updatedOrder;
            });
            setLastUpdate(new Date());
            toast.info(`Order status updated to: ${data.status}`);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket connection closed');
        // Reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [orderNumber]);

  const calculateEstimatedDelivery = (orderData) => {
    const now = new Date();
    const orderTime = new Date(orderData.date);
    let estimatedMinutes = 0;

    switch (orderData.status) {
      case 'pending':
        estimatedMinutes = 45; // 45 minutes from order time
        break;
      case 'preparing':
        estimatedMinutes = 30; // 30 minutes remaining
        break;
      case 'out_for_delivery':
        estimatedMinutes = 15; // 15 minutes remaining
        break;
      case 'delivered':
        estimatedMinutes = 0;
        break;
      default:
        estimatedMinutes = 45;
    }

    const estimatedTime = new Date(orderTime.getTime() + estimatedMinutes * 60000);
    setEstimatedDelivery(estimatedTime);
  };

  const handleCancelOrder = async () => {
    if (!order || order.status !== 'pending') {
      toast.error('Order cannot be cancelled at this stage');
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setCancelling(true);
    try {
      const response = await axios.put(`http://localhost:3000/api/orders/${order.id}/status`, {
        status: 'cancelled'
      });
      
      if (response.data.success) {
        setOrder(prevOrder => ({ ...prevOrder, status: 'cancelled' }));
        toast.success('Order cancelled successfully');
      } else {
        toast.error('Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handleContactRestaurant = () => {
    if (order?.restaurant_phone) {
      window.open(`tel:${order.restaurant_phone}`, '_blank');
    } else {
      toast.info('Restaurant contact information not available');
    }
  };

  const handleReorder = () => {
    if (order?.meal_id && order?.restaurant_id) {
      navigate(`/restaurant/${order.restaurant_id}?reorder=${order.meal_id}`);
    } else {
      toast.error('Cannot reorder - meal information not available');
    }
  };

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Order Receipt - ${order.order_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .details { margin: 20px 0; }
            .total { font-weight: bold; font-size: 18px; }
            .customizations { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Order Receipt</h1>
            <h2>Order #${order.order_number}</h2>
            <p>Date: ${new Date(order.date).toLocaleString()}</p>
          </div>
          <div class="details">
            <p><strong>Meal:</strong> ${order.meal_name}</p>
            <p><strong>Quantity:</strong> ${order.quantity}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Total:</strong> KES ${order.total_amount}</p>
            ${order.is_spicy ? '<p><strong>Spicy:</strong> Yes</p>' : ''}
            ${order.add_drink ? `<p><strong>Drink:</strong> ${order.selected_drink || 'Selected'}</p>` : ''}
            ${order.with_fries ? '<p><strong>With Fries:</strong> Yes</p>' : ''}
            ${order.with_salad ? '<p><strong>With Salad:</strong> Yes</p>' : ''}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleShareOrder = async () => {
    try {
      await navigator.share({
        title: `Order Status - ${order.order_number}`,
        text: `Check out my order status: ${order.order_number} - ${order.status}`,
        url: window.location.href,
      });
    } catch (err) {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast.info('Order link copied to clipboard!');
    }
  };

  const getCustomizationIcon = (type) => {
    switch (type) {
      case 'spicy': return <FaFire className="text-red-500" />;
      case 'drink': return <FaCoffee className="text-blue-500" />;
      case 'fries': return <FaHamburger className="text-yellow-500" />;
      case 'salad': return <FaLeaf className="text-green-500" />;
      case 'sauce': return <FaPepperHot className="text-orange-500" />;
      default: return <FaUtensils className="text-gray-500" />;
    }
  };

  const formatTimeRemaining = () => {
    if (!estimatedDelivery || order?.status === 'delivered' || order?.status === 'cancelled') {
      return null;
    }

    const now = new Date();
    const diff = estimatedDelivery - now;
    
    if (diff <= 0) {
      return 'Delivered or overdue';
    }

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return 'Ksh 0.00';
    }
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const calculateSubtotal = () => {
    const mealPrice = order?.total_amount || 0;
    const deliveryFee = order?.delivery_fee || 0;
    return mealPrice - deliveryFee;
  };

  const generateQRCode = () => {
    // Generate a simple QR code URL for order tracking
    const qrData = `Order:${order.order_number}|Status:${order.status}|Date:${order.date}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-green-100 p-6 mt-16 flex flex-col items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">Loading order status...</h2>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-green-100 p-6 mt-16 flex flex-col items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-8 text-center">
        <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Order</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-green-100 p-6 mt-16 flex flex-col items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Order Not Found</h2>
        <p className="text-gray-600 mb-6">The order you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );

  const statusSteps = [
    { label: 'Order Received', icon: '🛒', status: 'pending', description: "We've received your order" },
    { label: 'Preparing Your Order', icon: '👨‍🍳', status: 'preparing', description: 'The restaurant is preparing your food' },
    { label: 'On The Way', icon: '🚚', status: 'out_for_delivery', description: 'Your order will be delivered soon' },
    { label: 'Delivered', icon: '🏠', status: 'delivered', description: 'Your order has been delivered' },
  ];

  const currentStepIndex = statusSteps.findIndex(step => step.status === order.status);

  const canCancel = order.status === 'pending';
  const isCompleted = order.status === 'delivered' || order.status === 'cancelled';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-green-100 p-6 mt-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-2xl p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">Order Status</h1>
              <p className="text-gray-600 mt-2">Order #{order.order_number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last updated</p>
              <p className="text-sm font-medium">
                {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Just now'}
              </p>
            </div>
          </div>

          {/* Estimated Delivery Time */}
          {formatTimeRemaining() && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center">
                <FaClock className="text-blue-600 mr-2" />
                <span className="text-blue-800 font-semibold">
                  Estimated delivery: {formatTimeRemaining()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FaShoppingBag /> Order Summary
            </h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between border-b pb-3">
                <div>
                  <p className="font-medium">{order.meal_name}</p>
                  <p className="text-sm text-gray-500">Qty: {order.quantity}</p>
                </div>
                <div className="text-right">
                  <p>{formatCurrency(calculateSubtotal())}</p>
                  {order.quantity > 1 && (
                    <p className="text-xs text-gray-500">
                      {formatCurrency(calculateSubtotal() / order.quantity)} each
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span>{formatCurrency(order.delivery_fee || 0)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-white rounded-lg shadow-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
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
        <div className="bg-white rounded-lg shadow-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold mb-6">Order Status</h2>
          <div className="relative">
            {/* Timeline */}
            <div className="absolute left-4 h-full w-0.5 bg-gray-200 top-0"></div>
            
            {/* Timeline Steps */}
            <div className="space-y-8">
              {statusSteps.map((step, index) => (
                <div key={index} className="relative pl-10">
                  <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-white ${
                    index <= currentStepIndex ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div className={`p-4 rounded-lg border ${
                    index <= currentStepIndex 
                      ? 'bg-green-50 border-green-100' 
                      : 'bg-gray-50 border-gray-100'
                  }`}>
                    <h3 className={`font-medium ${
                      index <= currentStepIndex ? 'text-green-800' : 'text-gray-600'
                    }`}>
                      {step.label}
                    </h3>
                    <p className={`text-sm ${
                      index <= currentStepIndex ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.description}
                    </p>
                    {index === 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.date).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QR Code for Tracking */}
          <div className="mt-8 text-center">
            <h3 className="text-lg font-semibold mb-4 flex items-center justify-center gap-2">
              <FaQrcode /> Scan this code at the restaurant for order tracking
            </h3>
            <div className="bg-white p-4 rounded-lg border inline-block">
              <img 
                src={generateQRCode()} 
                alt="Order Tracking QR Code" 
                className="w-32 h-32"
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Order #{order.order_number}
            </p>
          </div>
        </div>

        {/* Interactive Buttons */}
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Cancel Order */}
            {canCancel && (
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <FaTimes />
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}

            {/* Contact Restaurant */}
            <button
              onClick={handleContactRestaurant}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPhone />
              Contact Restaurant
            </button>

            {/* Reorder */}
            {isCompleted && (
              <button
                onClick={handleReorder}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FaRedo />
                Reorder
              </button>
            )}

            {/* Print Receipt */}
            <button
              onClick={handlePrintReceipt}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <FaPrint />
              Print Receipt
            </button>

            {/* Share Order */}
            <button
              onClick={handleShareOrder}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FaShareAlt />
              Share Order
            </button>

            {/* WhatsApp Contact */}
            <button
              onClick={() => window.open(`https://wa.me/${order.restaurant_phone}?text=Hi, I have a question about my order #${order.order_number}`, '_blank')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <FaWhatsapp />
              WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}