import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/login', credentials),
  signup: (userData) => api.post('/signup', userData),
  logout: () => api.post('/logout'),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  getOrders: () => api.get('/user/orders'),
  getOrder: (orderId) => api.get(`/user/orders/${orderId}`),
};

// Restaurant API
export const restaurantAPI = {
  getAll: () => api.get('/restaurants'),
  getById: (id) => api.get(`/restaurants/${id}`),
  getMeals: (restaurantId) => api.get(`/restaurants/${restaurantId}/meals`),
  search: (query) => api.get(`/restaurants/search?q=${query}`),
};

// Meal API
export const mealAPI = {
  getById: (id) => api.get(`/meals/${id}`),
  create: (data) => api.post('/meals', data),
  update: (id, data) => api.put(`/meals/${id}`, data),
  delete: (id) => api.delete(`/meals/${id}`),
  getByRestaurant: (restaurantId) => api.get(`/restaurants/${restaurantId}/meals`),
};

// Order API
export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getById: (id) => api.get(`/orders/${id}`),
  update: (id, data) => api.put(`/orders/${id}`, data),
  getByRestaurant: (restaurantId) => api.get(`/restaurants/${restaurantId}/orders`),
  getByUser: () => api.get('/user/orders'),
  getByDeliveryPerson: () => api.get('/delivery/orders'),
};

// Owner API
export const ownerAPI = {
  getDashboard: () => api.get('/owner/dashboard'),
  getMeals: () => api.get('/owner/meals'),
  getOrders: () => api.get('/owner/orders'),
  getDeliveryPersons: () => api.get('/owner/delivery-persons'),
  getProcessedOrders: () => api.get('/owner/processed-orders'),
  getCategories: () => api.get('/owner/categories'),
  updateOrderStatus: (orderId, status) => api.put(`/orders/${orderId}/status`, { status }),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  createRestaurant: (data) => api.post('/admin/restaurants', data),
  getRestaurants: () => api.get('/admin/restaurants'),
  updateRestaurant: (id, data) => api.put(`/admin/restaurants/${id}`, data),
  deleteRestaurant: (id) => api.delete(`/admin/restaurants/${id}`),
};

// Delivery API
export const deliveryAPI = {
  getDashboard: () => api.get('/delivery/dashboard'),
  getOrders: () => api.get('/delivery/orders'),
  updateOrderStatus: (orderId, status) => api.put(`/delivery/orders/${orderId}/status`, { status }),
  updateLocation: (location) => api.put('/delivery/location', location),
};

export default api; 