import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FiArrowLeft, FiClock, FiPhone, FiMapPin, FiStar, 
  FiShoppingCart, FiPlus, FiMinus, FiX, FiInfo, FiShare2 
} from 'react-icons/fi';
import { FaUtensils, FaRegHeart, FaHeart, FaFacebook, FaTwitter, FaWhatsapp } from 'react-icons/fa';
import { GiMeal, GiHotMeal } from 'react-icons/gi';
import { IoFastFoodOutline, IoRestaurantOutline } from 'react-icons/io5';
import { MdDeliveryDining } from 'react-icons/md';
import { FaBoxOpen } from 'react-icons/fa'

import { BiTimeFive } from 'react-icons/bi';

export default function RestaurantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [meals, setMeals] = useState({});
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('menu');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const menuRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const placeholderImage = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';

  // Scroll listener for header effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [restaurantRes, mealsRes] = await Promise.all([
          axios.get(`http://localhost:3000/api/restaurants/${id}`),
          axios.get(`http://localhost:3000/api/restaurants/${id}/meals`)
        ]);

        setRestaurant({
          ...restaurantRes.data,
          image: restaurantRes.data.image || placeholderImage
        });

        const groupedMeals = groupMealsByCategory(mealsRes.data.map(meal => ({
          ...meal,
          image: meal.image || placeholderImage,
          isVeg: meal.category_name?.toLowerCase().includes('veg') || false,
          isSpicy: meal.name?.toLowerCase().includes('spicy') || false
        })));
        setMeals(groupedMeals);
        setSelectedCategory(Object.keys(groupedMeals)[0] || null);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const groupMealsByCategory = (meals) => {
    return meals.reduce((acc, meal) => {
      const category = meal.category_name || 'Uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(meal);
      return acc;
    }, {});
  };

  const toggleFavorite = (id) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  const addToCart = (meal) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.id === meal.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === meal.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { ...meal, quantity: 1 }];
    });
    // Show cart temporarily when adding items
    setShowCart(true);
    setTimeout(() => setShowCart(false), 2000);
  };

  const updateQuantity = (mealId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(mealId);
      return;
    }
    setCart(prev => 
      prev.map(item => 
        item.id === mealId 
          ? { ...item, quantity: newQuantity } 
          : item
      )
    );
  };

  const removeFromCart = (mealId) => {
    setCart(prev => prev.filter(item => item.id !== mealId));
  };

  const scrollToCategory = (category) => {
    setSelectedCategory(category);
    const element = document.getElementById(`category-${category}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  const shareRestaurant = () => {
    if (navigator.share) {
      navigator.share({
        title: restaurant.name,
        text: `Check out ${restaurant.name} on our app!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      alert(`Share this link: ${window.location.href}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-t-blue-600 border-gray-300 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Restaurant Not Found</h2>
          <p className="text-gray-700 mb-6">The restaurant details are currently unavailable.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Sticky Header (appears on scroll) */}
      <div className={`fixed top-0 left-0 right-0 bg-white shadow-md z-50 transition-all duration-300 ${isScrolled ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-700">
            <FiArrowLeft className="text-xl" />
          </button>
          <h1 className="text-lg font-bold text-gray-800 truncate max-w-xs">{restaurant.name}</h1>
          <div className="w-6"></div> {/* Spacer for balance */}
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-96 md:h-screen md:max-h-[70vh] overflow-hidden">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent"></div>
        
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col pt-16">
          {/* Navigation Bar */}
          <div className="flex justify-between items-center pt-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full p-3 transition-all"
            >
              <FiArrowLeft className="text-xl" />
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={shareRestaurant}
                className="text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full p-3 transition-all"
              >
                <FiShare2 className="text-xl" />
              </button>
              <button
                onClick={() => toggleFavorite(restaurant.id)}
                className="text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full p-3 transition-all"
              >
                {favorites.includes(restaurant.id) ? (
                  <FaHeart className="text-xl text-red-500" />
                ) : (
                  <FaRegHeart className="text-xl" />
                )}
              </button>
            </div>
          </div>
          
          {/* Restaurant Info */}
          <div className="mt-auto pb-12 text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{restaurant.name}</h1>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <FiStar className="text-yellow-400 mr-2" />
                <span>{restaurant.rating || '4.5'}</span>
              </div>
              
              <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <BiTimeFive className="mr-2" />
                <span>
                  {formatTime(restaurant.opening_time)} - {formatTime(restaurant.closing_time)}
                </span>
              </div>




<div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
  {restaurant.delivery_available ? (
    <MdDeliveryDining className="mr-2 text-green-400" />
  ) : (
    
    <FaBoxOpen className="mr-2" />
  )}
  <span>{restaurant.delivery_available ? 'Delivery' : 'Pickup Only'}</span>
</div>


<div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
  {restaurant.delivery_available ? (
    <MdDeliveryDining className="mr-2 text-green-400" />
  ) : (
    <FaBoxOpen className="mr-2" />
  )}
  <span>{restaurant.delivery_available ? 'Delivery' : 'Pickup Only'}</span>
</div>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm md:text-base">
              <div className="flex items-center">
                <FiMapPin className="mr-2" />
                <span>{restaurant.location || 'Location not specified'}</span>
              </div>
              
              <div className="flex items-center">
                <FiPhone className="mr-2" />
                <a href={`tel:${restaurant.contact}`} className="hover:underline">
                  {restaurant.contact || 'Contact not available'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 pt-8 pb-16">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex-1 py-4 font-medium flex items-center justify-center gap-2 ${activeTab === 'menu' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              <FaUtensils /> Menu
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`flex-1 py-4 font-medium flex items-center justify-center gap-2 ${activeTab === 'about' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              <IoRestaurantOutline /> About
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'menu' ? (
              <div ref={menuRef}>
                {/* Category Navigation (Sticky) */}
                <div className="sticky top-0 bg-white z-10 pt-2 pb-4 mb-6 border-b">
                  <div className="flex overflow-x-auto gap-2 pb-2">
                    {Object.keys(meals).map(category => (
                      <button
                        key={category}
                        onClick={() => scrollToCategory(category)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full font-medium ${selectedCategory === category ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
                
                {Object.keys(meals).length > 0 ? (
                  Object.entries(meals).map(([category, items]) => (
                    <div key={category} id={`category-${category}`} className="mb-12">
                      <div className="flex items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">{category}</h2>
                        <div className="ml-4 h-px bg-gray-300 flex-1"></div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map(meal => (
                          <div 
                            key={meal.id} 
                            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow relative"
                          >
                            {/* Meal Image with Badges */}
                            <div 
                              className="cursor-pointer relative"
                              onClick={() => navigate(`/meal/${meal.id}`)}
                            >
                              <img 
                                src={meal.image} 
                                alt={meal.name} 
                                className="w-full h-48 object-cover"
                              />
                              <div className="absolute top-2 left-2 flex gap-2">
                                {meal.isVeg && (
                                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                                    Veg
                                  </span>
                                )}
                                {meal.isSpicy && (
                                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                                    Spicy
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Meal Details */}
                            <div className="p-4">
                              <div className="flex justify-between items-start">
                                <h3 
                                  onClick={() => navigate(`/meal/${meal.id}`)}
                                  className="text-xl font-bold mb-2 cursor-pointer hover:text-blue-600"
                                >
                                  {meal.name}
                                </h3>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(meal.id);
                                  }}
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  {favorites.includes(meal.id) ? (
                                    <FaHeart className="text-red-500" />
                                  ) : (
                                    <FaRegHeart />
                                  )}
                                </button>
                              </div>
                              
                              <p 
                                onClick={() => navigate(`/meal/${meal.id}`)}
                                className="text-gray-600 mb-4 line-clamp-2 cursor-pointer"
                              >
                                {meal.description}
                              </p>
                              
                              <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-900">Ksh {meal.price}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(meal);
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                  <FiShoppingCart /> Add
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <GiHotMeal className="mx-auto text-5xl text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700">No meals available</h3>
                    <p className="text-gray-500">This restaurant hasn't added any meals yet.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="prose max-w-none">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">About {restaurant.name}</h2>
                <p className="text-gray-700 mb-6">
                  {restaurant.description || 'We are committed to providing exceptional dining experiences with our carefully crafted menu and warm hospitality.'}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <FiClock /> Operating Hours
                    </h3>
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span>Monday - Friday</span>
                        <span>{formatTime(restaurant.opening_time)} - {formatTime(restaurant.closing_time)}</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Weekends</span>
                        <span>{formatTime(restaurant.weekend_opening_time)} - {formatTime(restaurant.weekend_closing_time)}</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <FiMapPin /> Location
                    </h3>
                    <p>{restaurant.location || 'City Center'}</p>
                    <button className="mt-3 text-blue-600 hover:text-blue-800 font-medium">
                      View on Map
                    </button>
                  </div>
                </div>

                {/* Social Sharing */}
                <div className="mt-8">
                  <h3 className="font-medium text-gray-700 mb-2">Share this restaurant</h3>
                  <div className="flex gap-3">
                    <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-3 rounded-full">
                      <FaFacebook className="text-xl" />
                    </button>
                    <button className="bg-blue-100 hover:bg-blue-200 text-blue-400 p-3 rounded-full">
                      <FaTwitter className="text-xl" />
                    </button>
                    <button className="bg-green-100 hover:bg-green-200 text-green-600 p-3 rounded-full">
                      <FaWhatsapp className="text-xl" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shopping Cart Panel */}
      {showCart && cart.length > 0 && (
        <div className="fixed bottom-20 right-6 w-80 bg-white rounded-xl shadow-2xl z-50 border border-gray-200">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Your Order</h3>
              <button onClick={() => setShowCart(false)} className="text-gray-500">
                <FiX />
              </button>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center py-3 border-b">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-gray-600 text-sm">Ksh {item.price} × {item.quantity}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="text-gray-500 hover:text-red-500 p-1"
                    >
                      <FiMinus size={14} />
                    </button>
                    <span className="w-6 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="text-gray-500 hover:text-green-500 p-1"
                    >
                      <FiPlus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between font-bold mb-4">
                <span>Total:</span>
                <span>Ksh {cart.reduce((total, item) => total + (item.price * item.quantity), 0)}</span>
              </div>
              <button 
                onClick={() => navigate('/checkout')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shopping Cart Floating Button */}
      {cart.length > 0 && (
        <div 
          className="fixed bottom-6 right-6 z-40 cursor-pointer"
          onClick={() => setShowCart(!showCart)}
        >
          <div className="relative">
            <div className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105">
              <FiShoppingCart className="text-xl" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {cart.reduce((total, item) => total + item.quantity, 0)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}