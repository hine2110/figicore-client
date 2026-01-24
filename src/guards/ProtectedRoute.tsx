import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

export default function ProtectedRoute() {
    const { isAuthenticated } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect to login (or home in this simplified version) while saving the attempted location
        return <Navigate to="/guest/home" state={{ from: location }} replace />;
    }

    return <Outlet />;
}
