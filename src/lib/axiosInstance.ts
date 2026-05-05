import axios from 'axios';

// Định nghĩa base URL từ biến môi trường
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.figicore.com';

/**
 * Standard Axios Instance for the whole application.
 * Pre-configured:
 * - Base URL
 * - Timeout
 * - Default Headers
 */
export const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 60000, // Increased to 60s to wait for AI model to process image
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request Interceptor
 * Automatically attach Bearer Token if available
 */
axiosInstance.interceptors.request.use(
    (config) => {
        // TODO: Get token from real storage when implementing login
        // TODO: Get token from real storage when implementing login
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Response Interceptor
 * Global Error Handling
 */
axiosInstance.interceptors.response.use(
    (response) => {
        // Return data directly to keep code clean (optional)
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized (Token expired or Banned)
        if (error.response?.status === 401 && !originalRequest._retry) {

            // 1. SAFETY CHECK: Do not redirect if on Login page (to show wrong pass error)
            const currentPath = window.location.pathname;
            if (!currentPath.includes('/guest/home') && !currentPath.includes('/guest/login')) {
                // Added Logging to identify the culprit
                console.warn(`[Auth] 401 Unauthorized detected at: ${originalRequest.url || 'unknown URL'}. Redirecting to login.`);

                // 2. CLEANUP: Clear all auth data
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                localStorage.removeItem('auth-storage'); // Clear Zustand Persist cache
                sessionStorage.removeItem('accessToken');
                sessionStorage.removeItem('user');

                // 3. FORCE REDIRECT: Redirect to system Login page
                // Use replace to avoid returning to error page when clicking back
                window.location.replace('/guest/home');
                return Promise.reject(error); // Reject to stop executing next logic
            }

        }

        // Handle general error
        if (error.response?.data?.message) {
            console.error('API Error:', error.response.data.message);
        }

        return Promise.reject(error);
    }
);
