export type UserRole = 'SUPER_ADMIN' | 'MANAGER' | 'STAFF_POS' | 'STAFF_INVENTORY' | 'CUSTOMER';

export interface User {
    id: number;
    fullName: string;
    email: string;
    role_code: UserRole;
    avatarUrl?: string; // Optional, might come from google
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
    user: {
        id: number;
        email: string;
        fullName: string;
        role_code: string;
    };
}
