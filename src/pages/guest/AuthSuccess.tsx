import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/services/auth.service";

export default function AuthSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");
    const processingRef = useRef(false);

    useEffect(() => {
        // Prevent double execution in StrictMode
        if (processingRef.current) return;
        processingRef.current = true;

        const handleAuth = async () => {
            if (!token) {
                navigate("/guest/home");
                return;
            }

            try {
                // 1. Save Token
                localStorage.setItem("accessToken", token);

                // 2. Fetch User Profile
                const response = await authService.getCurrentUser();
                const user = (response as any).user || (response as any).data || response;

                if (!user || !user.role_code) {
                    throw new Error("Invalid user data received");
                }

                // 3. Save User & Sync Store
                localStorage.setItem("user", JSON.stringify(user));
                useAuthStore.getState().setUser(user);

                // 4. Smart Redirect
                const role = user.role_code;
                const ADMIN_ROLES = ['SUPER_ADMIN', 'MANAGER', 'STAFF_POS', 'STAFF_INVENTORY'];

                // Check for stored redirect (Local Storage based)
                const storedRedirect = localStorage.getItem('auth_return_url');
                if (storedRedirect) {
                    localStorage.removeItem('auth_return_url');
                    navigate(storedRedirect);
                    return;
                }

                if (ADMIN_ROLES.includes(role)) {
                    navigate("/admin/dashboard");
                } else {
                    navigate("/customer/home");
                }

            } catch (error) {
                console.error("Auth Success Error:", error);
                navigate("/guest/home");
            }
        };

        handleAuth();
    }, [token, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">Authenticating...</h2>
                <p className="text-gray-500">Please wait while we log you in.</p>
            </div>
        </div>
    );
}
