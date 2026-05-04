import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: 'http://localhost:8443/api',
  timeout: 10000,
  withCredentials: true, // Send cookies for session management
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add CSRF token
api.interceptors.request.use(
  async (config) => {
    // Skip CSRF for GET requests and specific endpoints
    if (config.method !== 'get' && !config.url.includes('/csrf-token')) {
      try {
        const csrfResponse = await api.get('/auth/csrf-token');
        config.headers['X-CSRF-Token'] = csrfResponse.data.csrfToken;
      } catch (error) {
        console.error('Failed to get CSRF token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle different error types
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - only redirect if not on login page and it's a session issue
          if (window.location.pathname !== '/login' && data.code !== 'AUTH_REQUIRED') {
            toast.error('Session expired. Please login again.');
            window.location.href = '/login';
          }
          break;
        case 403:
          // Forbidden
          toast.error(data.error || 'Access denied');
          break;
        case 429:
          // Rate limited
          toast.error(data.error || 'Too many requests. Please try again later.');
          break;
        case 400:
          // Bad request - validation errors
          if (data.details && Array.isArray(data.details)) {
            data.details.forEach(detail => {
              toast.error(`${detail.field}: ${detail.message}`);
            });
          } else {
            toast.error(data.error || 'Invalid request');
          }
          break;
        case 500:
          // Server error
          toast.error(data.error || 'Server error. Please try again later.');
          break;
        default:
          toast.error(data.error || 'An error occurred');
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.');
    } else {
      // Other error
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  getCsrfToken: () => api.get('/auth/csrf-token'),
};

// Payment API calls
export const paymentAPI = {
  createPayment: (paymentData) => api.post('/payments', paymentData),
  getPayments: (page = 1, limit = 10) => 
    api.get(`/payments?page=${page}&limit=${limit}`),
  getPayment: (id) => api.get(`/payments/${id}`),
  getCurrencies: () => api.get('/payments/currencies/list'),
  getProviders: () => api.get('/payments/providers/list'),
};

// Health check
export const healthCheck = () => api.get('/health');

export { api };
