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

        // Xử lý lỗi 401 Unauthorized (Token hết hạn hoăc bị Ban)
        if (error.response?.status === 401 && !originalRequest._retry) {
            
            // 1. SAFETY CHECK: Không redirect nếu đang ở trang Login (để hiển thị lỗi sai pass)
            if (!window.location.pathname.includes('/login')) {
                console.warn('Unauthorized (401) detected - Logging out...');

                // 2. CLEANUP: Xóa mọi data xác thực
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                localStorage.removeItem('auth-storage'); // Xóa cache của Zustand Persist

                // 3. FORCE REDIRECT: Đá về Login
                window.location.href = '/login';
                return Promise.reject(error); // Reject để không chạy logic tiếp theo
            }

        }

        // Xử lý lỗi chung
        if (error.response?.data?.message) {
            console.error('API Error:', error.response.data.message);
        }

        return Promise.reject(error);
    }
);
