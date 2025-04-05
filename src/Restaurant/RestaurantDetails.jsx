import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiArrowLeft, FiClock, FiPhone, FiMapPin, FiStar, FiShoppingCart } from 'react-icons/fi';
import { FaUtensils, FaRegHeart, FaHeart } from 'react-icons/fa';
import { GiMeal } from 'react-icons/gi';

export default function RestaurantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [meals, setMeals] = useState({});
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('menu');
  const [cart, setCart] = useState([]);

  const placeholderImage = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [restaurantRes, mealsRes] = await Promise.all([
          axios.get(`http://192.168.158.75:3000/api/restaurants/${id}`),
          axios.get(`http://192.168.158.75:3000/api/restaurants/${id}/meals`)
        ]);

        setRestaurant({
          ...restaurantRes.data,
          image: restaurantRes.data.image || placeholderImage
        });

        const groupedMeals = groupMealsByCategory(mealsRes.data.map(meal => ({
          ...meal,
          image: meal.image || placeholderImage
        })));
        setMeals(groupedMeals);
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
  };

  const removeFromCart = (mealId) => {
    setCart(prev => prev.filter(item => item.id !== mealId));
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
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
      {/* Hero Section with Sticky Navigation */}
      <div className="relative h-96 md:h-screen md:max-h-[80vh] overflow-hidden mt-16">
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
    
    {/* Restaurant Info */}
    <div className="mt-auto pb-12 text-white">
      <h1 className="text-4xl md:text-6xl font-bold mb-4">{restaurant.name}</h1>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
          <FiStar className="text-yellow-400 mr-2" />
          <span>{restaurant.rating || '4.5'}</span>
        </div>
        
        <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
          <FiClock className="mr-2" />
          <span>
            {formatTime(restaurant.opening_time)} - {formatTime(restaurant.closing_time)}
          </span>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4 text-sm md:text-base">
        <div className="flex items-center">
          <FiMapPin className="mr-2" />
          <span>{restaurant.location || 'Location not specified'}</span>
        </div>
        
        <div className="flex items-center">
          <FiPhone className="mr-2" />
          <span>{restaurant.contact || 'Contact not available'}</span>
        </div>
      </div>
    </div>
  </div>
</div>

      {/* Content Section */}
      <div className="container mx-auto px-4 pt-8 pb-16"> {/* Removed -mt-16 and z-20 */}
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
              <GiMeal /> About
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'menu' ? (
              <div>
                {Object.keys(meals).length > 0 ? (
                  Object.entries(meals).map(([category, items]) => (
                    <div key={category} className="mb-12">
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
    {/* Clickable area for meal details */}
    <div 
      className="cursor-pointer"
      onClick={() => navigate(`/meal/${meal.id}`)}
    >
      <div className="relative">
        <img 
          src={meal.image} 
          alt={meal.name} 
          className="w-full h-48 object-cover"
        />
      </div>
      
      <div className="p-4">
        <h3 className="text-xl font-bold mb-2">{meal.name}</h3>
        <p className="text-gray-600 mb-4 line-clamp-2">{meal.description}</p>
      </div>
    </div>

    {/* Favorite button (needs e.stopPropagation) */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(meal.id);
      }}
      className="absolute top-3 right-3 bg-white/80 hover:bg-white rounded-full p-2"
    >
      {favorites.includes(meal.id) ? (
        <FaHeart className="text-red-500" />
      ) : (
        <FaRegHeart />
      )}
    </button>

    {/* Add to cart button (needs e.stopPropagation) */}
    <div className="px-4 pb-4">
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
                    <GiMeal className="mx-auto text-5xl text-gray-400 mb-4" />
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shopping Cart Floating Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl flex items-center justify-center"
            onClick={() => console.log('View Cart')}
          >
            <FiShoppingCart className="text-xl" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {cart.reduce((total, item) => total + item.quantity, 0)}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}