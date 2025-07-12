# 🔐 New Authentication System

## Overview

The authentication system has been completely refactored to provide better consistency, security, and user experience.

## 🚀 Key Improvements

### 1. **Centralized Auth Context**
- Single source of truth for authentication state
- Automatic token management
- Role-based access control
- Proper error handling

### 2. **Consistent Storage**
- All auth data stored in `localStorage`
- No more mixed storage between `localStorage` and `sessionStorage`
- Automatic cleanup on logout

### 3. **Better Route Protection**
- `PrivateRoute` component with role-based access
- `PublicRoute` component for login/signup pages
- Automatic redirects based on user role

### 4. **Centralized API Service**
- All API calls go through `src/services/api.js`
- Automatic token injection
- Global error handling
- Automatic logout on 401 errors

### 5. **Custom Hooks**
- `useApi()` for one-off API calls
- `useApiState()` for API calls with persistent state
- Built-in loading and error states

## 📁 File Structure

```
src/
├── contexts/
│   └── AuthContext.jsx          # Main auth context
├── components/
│   └── PrivateRoute.jsx         # Route protection
├── services/
│   └── api.js                   # Centralized API service
├── hooks/
│   └── useApi.js                # API utility hooks
└── Login/
    ├── Login.jsx                # Updated login component
    └── SignUp.jsx               # Updated signup component
```

## 🔧 Usage Examples

### Using Auth Context
```jsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, hasRole, logout } = useAuth();
  
  if (!isAuthenticated()) {
    return <div>Please log in</div>;
  }
  
  if (hasRole('admin')) {
    return <AdminPanel />;
  }
  
  return <UserPanel />;
}
```

### Using API Service
```jsx
import { restaurantAPI } from '../services/api';

// Simple API call
const restaurants = await restaurantAPI.getAll();

// With error handling
try {
  const result = await restaurantAPI.getById(id);
  console.log(result.data);
} catch (error) {
  console.error('Failed to fetch restaurant:', error);
}
```

### Using Custom Hooks
```jsx
import { useApi } from '../hooks/useApi';
import { restaurantAPI } from '../services/api';

function RestaurantList() {
  const { loading, error, execute } = useApi();
  const [restaurants, setRestaurants] = useState([]);
  
  const fetchRestaurants = async () => {
    const result = await execute(restaurantAPI.getAll, {
      onSuccess: (data) => setRestaurants(data),
      onError: (error) => console.error(error)
    });
  };
  
  useEffect(() => {
    fetchRestaurants();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>{/* render restaurants */}</div>;
}
```

## 🛡️ Security Features

1. **Token Management**
   - Automatic token injection in API requests
   - Token validation on app initialization
   - Automatic logout on token expiration

2. **Role-Based Access**
   - Route-level protection
   - Component-level role checking
   - Automatic redirects to appropriate dashboards

3. **Error Handling**
   - Global 401 error handling
   - Automatic logout on authentication failures
   - User-friendly error messages

4. **Data Cleanup**
   - Complete cleanup on logout
   - No sensitive data left in storage
   - Session clearing

## 🔄 Migration Guide

### For Components Using Old Auth
1. Replace direct localStorage access with `useAuth()` hook
2. Replace manual API calls with service functions
3. Update route protection to use new `PrivateRoute`

### For API Calls
1. Replace direct axios calls with service functions
2. Use `useApi()` hook for better state management
3. Remove manual error handling (now handled globally)

## 🎯 Benefits

- **Consistency**: All auth logic centralized
- **Security**: Better token management and error handling
- **Maintainability**: Clean separation of concerns
- **User Experience**: Better loading states and error messages
- **Developer Experience**: Simple hooks and services

## 🚨 Breaking Changes

1. **Storage**: All auth data now in localStorage only
2. **API Calls**: Must use service functions instead of direct axios
3. **Route Protection**: New PrivateRoute component required
4. **Error Handling**: Global error handling replaces manual handling

## 🔧 Configuration

The system is configured in `src/services/api.js`:
- Base URL: `http://localhost:3000/api`
- Timeout: 10 seconds
- Automatic token injection
- Global error handling 