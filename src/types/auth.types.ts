export type UserRole = 'SUPER_ADMIN' | 'MANAGER' | 'STAFF_POS' | 'STAFF_INVENTORY' | 'CUSTOMER';

export interface User {
    user_id: number;
    email: string;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    role_code: UserRole;
    status_code?: string;
    is_verified?: boolean;
    google_id?: string;
    customers?: {
        current_rank_code: string;
        total_spent: string | number;
        loyalty_points: number;
    } | null;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    currentRole: UserRole | 'guest';
    setUser: (user: User) => void;
    login: (role: UserRole | 'guest') => void; // Deprecated
    logout: () => void;
    switchRole: (role: UserRole | 'guest') => void;
}

export interface LoginPayload {
    email: string;
    password?: string;
}

export interface RegisterPayload {
    email: string;
    password?: string;
    fullName: string;
    phone: string;
}

export interface VerifyOtpPayload {
    email: string;
    otp: string;
}

export interface AuthResponse {
    access_token: string;
    user: User;
}
