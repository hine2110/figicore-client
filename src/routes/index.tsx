/**
 * This file serves as the documentation for the routing strategy.
 * The actual implementation is currently centralized in src/App.tsx for simplicity during scaffolding.
 * 
 * Future Scalability:
 * In Phase 5+, we can split routes into separate files:
 * - src/routes/adminRoutes.tsx
 * - src/routes/customerRoutes.tsx
 * etc.
 * 
 * Current Map:
 * /admin/*    -> AdminLayout    (Guarded: admin)
 * /manager/*  -> ManagerLayout  (Guarded: manager, admin)
 * /staff/*    -> StaffLayout    (Guarded: staff, manager, admin)
 * /customer/* -> CustomerLayout (Guarded: customer)
 * /guest/*    -> GuestLayout    (Public)
 */

export const ROUTE_MAP = {
    ADMIN: '/admin',
    MANAGER: '/manager',
    STAFF: '/staff',
    CUSTOMER: '/customer',
    GUEST: '/guest'
};
