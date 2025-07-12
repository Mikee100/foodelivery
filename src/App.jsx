import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import MainPage from './User/MainPage';
import RestaurantCreation from './Admin/RestaurantCreation';
import RestaurantDetails from './Restaurant/RestaurantDetails';
import AddMeal from './Admin/AddMeal';
import MealDetails from './Restaurant/MealDetails';
import OrderStatus from './User/OrderStatus';
import ManageOrders from './Owner/ManageOrders';
import Login from './Login/Login';
import AdminDashboard from './Admin/AdminDashboard';
import OwnerDashboard from './Owner/OwnerDashboard';
import DeliveryDashboard from './Delivery/DeliveryDashboard';
import UserDashboard from './User/UserDashboard';
import SignUp from './Login/SignUp';
import Navbar from './Navigation/Navbar';
import ModifyMeal from './Owner/ModifyMeal';
import SearchResults from './Navigation/SearchResults ';

import UserOrders from './User/UserOrders';
import UserDetails from './User/UserDetails';
import OrderConfirmation from './Restaurant/OrderConfirmation';

// Import new owner pages
import MealsPage from './Owner/MealsPage';
import OrdersPage from './Owner/OrdersPage';
import DeliveryPersonsPage from './Owner/DeliveryPersonsPage';
import ProcessedOrdersPage from './Owner/ProcessedOrdersPage';
import CategoriesPage from './Owner/CategoriesPage';

const PrivateRoute = ({ children, role }) => {
  const userRole = localStorage.getItem('role');
  return userRole === role ? children : <Navigate to="/login" />;
};



function App() {
  return (
    <BrowserRouter>
     <Navbar />
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/admin/restaurantcreation" element={<PrivateRoute role="admin"><RestaurantCreation /></PrivateRoute>} />
        <Route path="/restaurant/:id" element={<RestaurantDetails />} />
        <Route path="/restaurant/:id/addmeal" element={<PrivateRoute role="restaurant_owner"><AddMeal /></PrivateRoute>} />
        <Route path="/meal/:id" element={<MealDetails />} />
        <Route path="/modify-meal/:mealId" element={<ModifyMeal />} />
        <Route path="/order/:orderNumber" element={<OrderStatus />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
        <Route path="/admin/restaurant/:restaurantId/orders" element={<PrivateRoute role="restaurant_owner"><ManageOrders /></PrivateRoute>} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/owner/dashboard" element={<OwnerDashboard />} />
        <Route path="/owner/meals" element={<PrivateRoute role="restaurant_owner"><MealsPage /></PrivateRoute>} />
        <Route path="/owner/orders" element={<PrivateRoute role="restaurant_owner"><OrdersPage /></PrivateRoute>} />
        <Route path="/owner/delivery-persons" element={<PrivateRoute role="restaurant_owner"><DeliveryPersonsPage /></PrivateRoute>} />
        <Route path="/owner/processed-orders" element={<PrivateRoute role="restaurant_owner"><ProcessedOrdersPage /></PrivateRoute>} />
        <Route path="/owner/categories" element={<PrivateRoute role="restaurant_owner"><CategoriesPage /></PrivateRoute>} />
        <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
        <Route path="/user/dashboard" element={<UserDashboard />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/profile" element={<PrivateRoute role="user"><UserDetails /></PrivateRoute>} /> 
        <Route path="/orders" element={<PrivateRoute role="user"><UserOrders /></PrivateRoute>} /> 
      </Routes>
    </BrowserRouter>
  );
}

export default App;