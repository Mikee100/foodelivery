import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';
import SearchBar from './SearchBar';

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <>
      <nav className="bg-white shadow-lg fixed w-full top-0 left-0 z-50 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center">
              <button 
                onClick={toggleSidebar} 
                className="text-blue-500 hover:text-blue-700 text-2xl mr-4"
                aria-label="Toggle menu"
              >
                <FaBars />
              </button>
              <Link 
                to="/" 
                className="text-blue-500 font-bold text-xl hover:text-blue-700"
              >
                Home
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {token && role === 'user' && <SearchBar />}
              {!token ? (
                <>
                  <Link 
                    to="/login" 
                    className="text-blue-500 font-bold hover:text-blue-700"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/signup" 
                    className="text-blue-500 font-bold hover:text-blue-700 ml-4"
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <button
                  onClick={handleLogout}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 w-64 bg-white shadow-lg h-full z-40 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out`}
      >
        <div className="p-4 pt-20"> {/* Added pt-20 to account for navbar height */}
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Menu</h2>
          <ul className="space-y-4">
            <li>
              <Link 
                to="/profile" 
                className="block text-blue-500 font-bold hover:text-blue-700 hover:bg-blue-50 p-2 rounded"
                onClick={toggleSidebar}
              >
                Profile
              </Link>
            </li>
            <li>
              <Link 
                to="/orders" 
                className="block text-blue-500 font-bold hover:text-blue-700 hover:bg-blue-50 p-2 rounded"
                onClick={toggleSidebar}
              >
                Orders
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Add padding to main content to account for navbar */}
      <style jsx>{`
        main {
          padding-top: 4rem; /* 64px - matches h-16 */
        }
      `}</style>
    </>
  );
}