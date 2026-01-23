import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

export default function ProtectedRoute() {
    const { isAuthenticated } = useAuthStore();
    const location = useLocation();

    // Dev Override: If dev role is set, bypass authentication check
    // This allows seamless role switching without re-login
    const devRole = localStorage.getItem('dev_current_role');
    const isDevAuthenticated = !!devRole;

    if (!isAuthenticated && !isDevAuthenticated) {
        // Redirect to login (or home in this simplified version) while saving the attempted location
        return <Navigate to="/guest/home" state={{ from: location }} replace />;
    }

    return <Outlet />;
}
