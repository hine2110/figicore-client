import { create } from 'zustand';
import { AuthState, User, UserRole } from '@/types/auth.types';

// Helper to safely parse user from local storage
const getInitialUser = (): User | null => {
    try {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
        console.error("Failed to parse user from local storage", e);
        return null;
    }
}

const initialUser = getInitialUser();
const initialRole = initialUser?.role_code || 'guest';

export const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: !!initialUser,
    user: initialUser,
    currentRole: initialRole,

    // Login now expects a real User object
    login: (role: UserRole) => {
        // This 'login' signature in AuthState might need changing if we want to pass the whole user
        // But for now, let's keep it simple or just rely on 'user' being set by SignIn.tsx
        // Actually, SignIn.tsx sets localStorage, but doesn't call store.login()!
        // We should just reload from localStorage or provide a setUser action.
        // For strictly following the interface:
        console.warn("useAuthStore.login(role) is deprecated. Use syncWithLocalStorage or reload page.");
    },

    // New action to sync state after component login
    setUser: (user: User) => {
        set({
            isAuthenticated: true,
            user: user,
            currentRole: user.role_code
        });
    },

    logout: () => {
        set({
            isAuthenticated: false,
            user: null,
            currentRole: 'guest',
        });
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
    },

    switchRole: (role: UserRole) => {
        console.warn("Dev Switch Role is disabled in production mode.");
    }
}));
