import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

export default function ProtectedRoute() {
    const { isAuthenticated } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect to login with proper return url
        return <Navigate to={`/guest/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
    }

    return <Outlet />;
}
