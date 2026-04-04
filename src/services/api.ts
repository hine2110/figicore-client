import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// Create Axios instance with base configuration
// Create Axios instance with base configuration
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor (Attach Auth Token)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor (Handling Global Auto-Logout for 401s)
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // If the server rejects the token (e.g., expired or user is banned)
        if (error.response?.status === 401) {
            // Prevent redirect loop if already on a login page or activation page (which handles 401s uniquely)
            const currentPath = window.location.pathname;
            if (!currentPath.includes('/login') && !currentPath.includes('/guest/login') && !currentPath.includes('/activate')) {
                // Clear zustand auth state and local storage
                const store = useAuthStore.getState();
                if (store.logout) {
                    store.logout();
                } else {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('user');
                }
                // Redirect user to the correct login page, not just the non-existent /login
                window.location.href = '/guest/home';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

// GHN Sandbox Token (Hardcoded for Thesis Demo)
export const GHN_TOKEN = '8bbce3ff-f8fd-11f0-a3d6-dac90fb956b5';
