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
        <Route path="/admin/restaurant/:restaurantId/orders" element={<PrivateRoute role="restaurant_owner"><ManageOrders /></PrivateRoute>} />
        <Route path="/admin/dashboard" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
        <Route path="/owner/dashboard" element={<PrivateRoute role="restaurant_owner"><OwnerDashboard /></PrivateRoute>} />
        <Route path="/delivery/dashboard" element={<PrivateRoute role="delivery_person"><DeliveryDashboard /></PrivateRoute>} />
        <Route path="/user/dashboard" element={<PrivateRoute role="user"><UserDashboard /></PrivateRoute>} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/profile" element={<PrivateRoute role="user"><UserDetails /></PrivateRoute>} /> 
        <Route path="/orders" element={<PrivateRoute role="user"><UserOrders /></PrivateRoute>} /> 
      </Routes>
    </BrowserRouter>
  );
}

export default App;