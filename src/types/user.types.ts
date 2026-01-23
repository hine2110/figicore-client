export type UserRole = 'admin' | 'manager' | 'staff' | 'customer' | 'guest';

// User DTO (Data Transfer Object)
export interface UserDTO {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    phoneNumber?: string;
    avatarUrl?: string;
    isActive: boolean;
    createdAt: string;
}

// Params for listing users
export interface UserListParams {
    role?: UserRole;
    search?: string;
    page?: number;
    limit?: number;
}
