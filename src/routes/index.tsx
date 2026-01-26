export const ROLE_LANDING_PATHS: Record<string, string> = {
    SUPER_ADMIN: '/admin/dashboard',
    MANAGER: '/manager/dashboard',
    STAFF_INVENTORY: '/warehouse/dashboard',
    STAFF_POS: '/pos/dashboard',
    CUSTOMER: '/customer/home',
};

// Helper to check if a path belongs to a specific root (Security)
export const getRoleBaseRoute = (role: string) => {
    // e.g., STAFF_INVENTORY -> '/warehouse'
    const path = ROLE_LANDING_PATHS[role];
    if (!path) return '';
    return path.split('/')[1] || '';
};
