import { BrowserRouter, Route, Routes } from 'react-router-dom';
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

// Import new auth components
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute, PublicRoute } from './components/PrivateRoute';
import UserLayout from './UserLayout';
import OwnerLayout from './Owner/OwnerLayout';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/signup" element={
            <PublicRoute>
              <SignUp />
            </PublicRoute>
          } />

          {/* User Routes - With Navbar */}
          <Route path="/" element={
            <UserLayout>
              <MainPage />
            </UserLayout>
          } />
          <Route path="/restaurant/:id" element={
            <UserLayout>
              <RestaurantDetails />
            </UserLayout>
          } />
          <Route path="/meal/:id" element={
            <UserLayout>
              <MealDetails />
            </UserLayout>
          } />
          <Route path="/order/:orderNumber" element={
            <UserLayout>
              <OrderStatus />
            </UserLayout>
          } />
          <Route path="/order-confirmation/:orderId" element={
            <UserLayout>
              <OrderConfirmation />
            </UserLayout>
          } />
          <Route path="/search" element={
            <UserLayout>
              <SearchResults />
            </UserLayout>
          } />

          {/* Protected User Routes */}
          <Route path="/user/dashboard" element={
            <PrivateRoute roles={['user']}>
              <UserLayout>
                <UserDashboard />
              </UserLayout>
            </PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute roles={['user']}>
              <UserLayout>
                <UserDetails />
              </UserLayout>
            </PrivateRoute>
          } /> 
          <Route path="/orders" element={
            <PrivateRoute roles={['user']}>
              <UserLayout>
                <UserOrders />
              </UserLayout>
            </PrivateRoute>
          } /> 

          {/* Admin Routes - No Navbar */}
          <Route path="/admin/restaurantcreation" element={
            <PrivateRoute roles={['admin']}>
              <RestaurantCreation />
            </PrivateRoute>
          } />
          <Route path="/admin/dashboard" element={
            <PrivateRoute roles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          } />

          {/* Owner Routes - With OwnerLayout */}
          <Route path="/owner" element={
            <PrivateRoute roles={['restaurant_owner']}>
              <OwnerLayout />
            </PrivateRoute>
          }>
            <Route path="dashboard" element={<OwnerDashboard />} />
            <Route path="meals" element={<MealsPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="delivery-persons" element={<DeliveryPersonsPage />} />
            <Route path="processed-orders" element={<ProcessedOrdersPage />} />
            <Route path="categories" element={<CategoriesPage />} />
          </Route>

          {/* Legacy Owner Routes - For backward compatibility */}
          <Route path="/restaurant/:id/addmeal" element={
            <PrivateRoute roles={['restaurant_owner']}>
              <AddMeal />
            </PrivateRoute>
          } />
          <Route path="/modify-meal/:mealId" element={
            <PrivateRoute roles={['restaurant_owner']}>
              <ModifyMeal />
            </PrivateRoute>
          } />
          <Route path="/admin/restaurant/:restaurantId/orders" element={
            <PrivateRoute roles={['restaurant_owner']}>
              <ManageOrders />
            </PrivateRoute>
          } />

          {/* Delivery Routes - No Navbar */}
          <Route path="/delivery/dashboard" element={
            <PrivateRoute roles={['delivery_person']}>
              <DeliveryDashboard />
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;