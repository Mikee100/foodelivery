import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FaUtensils,
  FaClipboardList,
  FaTruck,
  FaCheckCircle,
  FaTags,
  FaSignOutAlt,
  FaHome
} from 'react-icons/fa';

const navItems = [
  {
    path: '/owner/dashboard',
    icon: FaHome,
    label: 'Dashboard',
    description: 'Overview and analytics'
  },
  {
    path: '/owner/meals',
    icon: FaUtensils,
    label: 'Meals',
    description: 'Manage your menu items'
  },
  {
    path: '/owner/orders',
    icon: FaClipboardList,
    label: 'Orders',
    description: 'View and manage orders'
  },
  {
    path: '/owner/delivery-persons',
    icon: FaTruck,
    label: 'Delivery',
    description: 'Manage delivery personnel'
  },
  {
    path: '/owner/processed-orders',
    icon: FaCheckCircle,
    label: 'Processed',
    description: 'Completed orders history'
  },
  {
    path: '/owner/categories',
    icon: FaTags,
    label: 'Categories',
    description: 'Manage meal categories'
  }
];

const OwnerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-52 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-800">Owner Panel</h1>
          <p className="text-xs text-gray-500 mt-1">Manage your restaurant</p>
        </div>
        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center px-3 py-2 rounded-md transition-all duration-150 group text-sm font-medium ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-700'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        {/* Logout Button at the bottom of the sidebar */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-150 group text-sm font-medium"
          >
            <FaSignOutAlt className="w-5 h-5 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto">
        <div className="p-6 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default OwnerLayout; 