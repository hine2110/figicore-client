import axios from 'axios';

// Định nghĩa base URL từ biến môi trường
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Axios Instance chuẩn cho toàn bộ ứng dụng.
 * Đã cấu hình sẵn:
 * - Base URL
 * - Timeout
 * - Headers mặc định
 */
export const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request Interceptor
 * Tự động đính kèm Bearer Token nếu có
 */
axiosInstance.interceptors.request.use(
    (config) => {
        // TODO: Lấy token từ storage thật khi implement login
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

/**
 * Response Interceptor
 * Xử lý lỗi tập trung (Global Error Handling)
 */
axiosInstance.interceptors.response.use(
    (response) => {
        // Trả về data trực tiếp để clean code (tùy chọn)
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Xử lý lỗi 401 Unauthorized (Token hết hạn)
        if (error.response?.status === 401 && !originalRequest._retry) {
            // TODO: Implement Refresh Token flow logic here
            // 1. Gọi API refresh token
            // 2. Nếu thành công -> Update token & retry request cũ
            // 3. Nếu thất bại -> Logout user & Redirect về login
            console.warn('Unauthorized - Redirecting to login...');
            localStorage.removeItem('accessToken'); // Clear invalid token
            window.location.href = '/login';
        }

        // Xử lý lỗi chung
        if (error.response?.data?.message) {
            console.error('API Error:', error.response.data.message);
        }

        return Promise.reject(error);
    }
);
