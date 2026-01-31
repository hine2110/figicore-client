import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRole } from '@/types/auth.types';

interface RoleGuardProps {
    allowedRoles: UserRole[];
}

export default function RoleGuard({ allowedRoles }: RoleGuardProps) {
    const { currentRole } = useAuthStore();

    if (!allowedRoles.includes(currentRole as UserRole)) {
        // Redirect to unauthorized page or fallback to guest home
        // In a real app, this might show a 403 Forbidden page
        return <Navigate to="/guest/home" replace />;
    }

    return <Outlet />;
}
