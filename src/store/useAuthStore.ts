import { create } from 'zustand';
import { AuthState, User, UserRole } from '@/types/auth.types';

// Mock users for different roles
const MOCK_USERS: Record<UserRole, User> = {
    admin: {
        id: 'admin-1',
        name: 'System Admin',
        email: 'admin@figicore.com',
        role: 'admin',
        avatarUrl: 'https://github.com/shadcn.png',
    },
    manager: {
        id: 'manager-1',
        name: 'Store Manager',
        email: 'manager@figicore.com',
        role: 'manager',
    },
    staff: {
        id: 'staff-1',
        name: 'Staff Member',
        email: 'staff@figicore.com',
        role: 'staff',
    },
    customer: {
        id: 'cust-1',
        name: 'Loyal Customer',
        email: 'customer@gmail.com',
        role: 'customer',
    },
    guest: {
        id: 'guest-0',
        name: 'Guest User',
        email: '',
        role: 'guest',
    },
};

// Initialize state from local storage to persist role across reloads
const storedRole = localStorage.getItem('figi_role') as UserRole | null;
const initialRole = storedRole || 'guest';
const initialUser = initialRole !== 'guest' ? MOCK_USERS[initialRole] : null;

export const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: initialRole !== 'guest',
    user: initialUser,
    currentRole: initialRole,

    login: (role: UserRole) => {
        const user = MOCK_USERS[role];
        set({
            isAuthenticated: role !== 'guest',
            user: role !== 'guest' ? user : null,
            currentRole: role,
        });
        localStorage.setItem('figi_role', role);
    },

    logout: () => {
        set({
            isAuthenticated: false,
            user: null,
            currentRole: 'guest',
        });
        localStorage.removeItem('figi_role');
    },

    switchRole: (role: UserRole) => {
        const user = MOCK_USERS[role];
        set({
            isAuthenticated: role !== 'guest',
            user: role !== 'guest' ? user : null,
            currentRole: role,
        });
        localStorage.setItem('figi_role', role);
    }
}));
