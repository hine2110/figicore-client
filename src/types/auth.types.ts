export type UserRole = 'admin' | 'manager' | 'staff' | 'customer' | 'guest';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatarUrl?: string;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    currentRole: UserRole;
    login: (role: UserRole) => void;
    logout: () => void;
    switchRole: (role: UserRole) => void;
}

export interface LoginPayload {
    email: string;
    password?: string;
}

export interface RegisterPayload {
    email: string;
    password?: string;
    firstName?: string;
    lastName?: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}
