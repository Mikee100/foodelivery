import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function OrderStatus() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderStatus = async () => {
      try {
        const response = await axios.get(`http://192.168.158.75:3000/api/orders/${orderNumber}`);
        setOrder(response.data);
      } catch (error) {
        console.error('Error fetching order status:', error);
        setError('Error fetching order status');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderStatus();

    const ws = new WebSocket('ws://192.168.158.75:3000');

    ws.onopen = () => console.log('WebSocket connection established');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.orderNumber === orderNumber) {
        setOrder((prevOrder) => ({ ...prevOrder, status: data.status }));
      }
    };

    ws.onerror = (error) => console.error('WebSocket error:', error);
    ws.onclose = () => console.log('WebSocket connection closed');

    return () => ws.close();
  }, [orderNumber]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!order) return <div>Order not found</div>;

  const statusSteps = [
    { label: 'Order Placed', icon: '🛒' },
    { label: 'In the Kitchen', icon: '👨‍🍳' },
    { label: 'Out for Delivery', icon: '🚚' },
    { label: 'Delivered', icon: '🏠' },
  ];

  const currentStepIndex = statusSteps.findIndex(step => step.label === order.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-green-100 p-6 mt-16 flex flex-col items-center">
      <div className="bg-gray-50 rounded-lg shadow-2xl w-full max-w-2xl p-8">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">Order Status</h1>

        <div className="flex flex-col items-center space-y-10 relative">
          {statusSteps.map((step, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className={`flex flex-col items-center p-4 rounded-lg shadow ${index <= currentStepIndex ? 'bg-green-100' : 'bg-gray-200'}`}>
                <span className={`text-5xl ${index <= currentStepIndex ? 'text-green-600' : 'text-gray-400'}`}>
                  {step.icon}
                </span>
                <p className="mt-2 text-lg font-semibold text-gray-700">{step.label}</p>
              </div>

              {index < statusSteps.length - 1 && (
                <div className="flex-1 w-1 bg-gray-300 h-20 relative">
                  <div
                    className={`absolute top-0 left-0 h-full w-1 transition-all duration-500 ease-in-out ${index < currentStepIndex ? 'bg-green-500' : 'bg-gray-300'}`}
                    style={{
                      height: `${index < currentStepIndex ? 100 : index === currentStepIndex ? 50 : 0}%`,
                    }}
                  ></div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-2xl text-gray-700">
            Current Status:
            <span className="ml-2 font-bold bg-green-500 text-white py-1 px-3 rounded-lg">
              {order.status}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}