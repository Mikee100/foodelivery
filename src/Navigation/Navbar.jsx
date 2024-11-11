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
      <nav className="bg-white shadow-lg fixed w-full top-0 left-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button onClick={toggleSidebar} className="text-blue-500 text-2xl">
                <FaBars />
              </button>
              <Link to="/" className="text-blue-500 font-bold text-xl ml-4">
                Home
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {token && role === 'user' && <SearchBar />}
              {!token ? (
                <>
                  <Link to="/login" className="text-blue-500 font-bold">
                    Login
                  </Link>
                  <Link to="/signup" className="text-blue-500 font-bold">
                    Sign Up
                  </Link>
                </>
              ) : (
                <button
                  onClick={handleLogout}
                  className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div
        className={`fixed top-0 left-0 w-64 bg-white shadow-lg h-full z-20 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out`}
      >
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Menu</h2>
          <ul>
            <li className="mb-2">
              <Link to="/profile" className="text-blue-500 font-bold" onClick={toggleSidebar}>
                Profile
              </Link>
            </li>
            <li className="mb-2">
              <Link to="/orders" className="text-blue-500 font-bold" onClick={toggleSidebar}>
                Orders
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-10"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
}