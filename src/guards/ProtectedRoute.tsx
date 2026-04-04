import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

export default function ProtectedRoute() {
    const { isAuthenticated } = useAuthStore();

    if (!isAuthenticated) {
        // Safe redirect to guest login page. 
        // Note: encoding search parameters was occasionally causing routing 404s depending on the current path setup.
        return <Navigate to={`/guest/home`} replace />;
    }

    return <Outlet />;
}
