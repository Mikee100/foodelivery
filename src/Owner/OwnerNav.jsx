import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUtensils, FaClipboardList, FaTruck, FaHistory, FaTags, FaHome } from 'react-icons/fa';

export default function OwnerNav({ restaurantName }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { 
      name: 'Dashboard', 
      path: '/owner/dashboard', 
      icon: <FaHome />,
      description: 'Overview and quick stats'
    },
    { 
      name: 'Meals', 
      path: '/owner/meals', 
      icon: <FaUtensils />,
      description: 'Manage your menu items'
    },
    { 
      name: 'Orders', 
      path: '/owner/orders', 
      icon: <FaClipboardList />,
      description: 'View and manage orders'
    },
    { 
      name: 'Delivery', 
      path: '/owner/delivery-persons', 
      icon: <FaTruck />,
      description: 'Manage delivery team'
    },
    { 
      name: 'History', 
      path: '/owner/processed-orders', 
      icon: <FaHistory />,
      description: 'View completed orders'
    },
    { 
      name: 'Categories', 
      path: '/owner/categories', 
      icon: <FaTags />,
      description: 'Organize your menu'
    }
  ];

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="w-64 bg-blue-600 shadow-lg fixed h-full overflow-y-auto">
      <div className="p-6">
        <h1 className="text-white text-2xl font-bold mb-6">{restaurantName}</h1>
        <p className="text-blue-200 text-sm">Restaurant Dashboard</p>
        
        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full text-left p-4 rounded-lg transition-all duration-200 flex items-center space-x-3 ${
                isActiveRoute(item.path)
                  ? 'bg-blue-700 text-white shadow-md'
                  : 'text-blue-100 hover:bg-blue-500 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <div>
                <div className="font-semibold">{item.name}</div>
                <div className="text-xs opacity-75">{item.description}</div>
              </div>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
} 