import axios from 'axios';

const API_BASE_URL = "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,

});


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 422) {
      const validationErrors = error.response?.data?.errors;
      if (validationErrors) {
        const errorMessages = Object.values(validationErrors).flat().join(', ');
        console.error('Validation Error:', errorMessages);
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/register', userData),
  login: (credentials) => api.post('/login', credentials),
  logout: () => api.post('/logout'),
  profile: () => api.get('/profile'),
  getCsrfCookie: () => api.get('/sanctum/csrf-cookie'),
};

export default api;