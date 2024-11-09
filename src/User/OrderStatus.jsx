import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function OrderStatus() {
  const { id } = useParams();
  const [order, setOrder] = useState();

  useEffect(() => {
    const fetchOrderStatus = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/orders/${id}`);
        setOrder(response.data);
        
      } catch (error) {
        console.error('Error fetching order status:', error);
      }
    };

    fetchOrderStatus();

    // Set up WebSocket connection
    const ws = new WebSocket('ws://localhost:3000');

    ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.orderId === id) {
        setOrder((prevOrder) => ({ ...prevOrder, status: data.status }));
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.close();
    };
  }, [id]);

  if (!order) {
    return <div>Loading...</div>;
  }


  const statusSteps = ['Order Placed', 'In the Kitchen', 'Out for Delivery', 'Delivered'];

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-400 to-blue-500 p-6 flex flex-col items-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl">
        <h1 className="text-5xl font-extrabold text-center text-gray-800 mb-12">Order Status</h1>
        <div className="space-y-4">
         
          {statusSteps.map((step, index) => (
            <div key={index} className={`p-4 rounded-lg ${order.status >= index ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}