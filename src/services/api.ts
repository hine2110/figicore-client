import axios from 'axios';

// Create Axios instance with base configuration
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor (Placeholder for Auth Token)
api.interceptors.request.use(
    (config) => {
        // Future Implementation:
        // const token = useAuthStore.getState().token;
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor (Placeholder for Error Handling)
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Normalize error format for usage in components
        // if (error.response?.status === 401) { logout() ... }
        return Promise.reject(error);
    }
);

export default api;
