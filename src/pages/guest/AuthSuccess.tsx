import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/services/auth.service";

export default function AuthSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");

    useEffect(() => {
        const handleAuth = async () => {
            if (!token) {
                navigate("/guest/login?error=NoToken");
                return;
            }

            try {
                // 1. Save Token
                localStorage.setItem("accessToken", token);

                // 2. Fetch User Profile
                // Assuming authService has a method to get profile, or we decode the token?
                // Actually, standard practice is to use the token to fetch "me".
                // If authService.getProfile doesn't exist, we might need to add it or rely on a "verify" endpoint.
                // However, usually the backend returns user info in the payload too if we used a POST.
                // Since this is a redirect, we only have the token strings.
                // Strategy: Let's assume the token isvalid and we can decode it OR fetch /auth/me.
                // BUT, looking at `auth.service.ts`, we don't have a `me` method visible in previous view.
                // Let's implement a quick fetch or decode. Ideally fetch.
                // For now, let's TRY to use the store if possible, but the store needs the user object.

                // Workaround: If we don't have a specific "getMe" endpoint yet, 
                // we might rely on the fact that we can define one or just navigate to home and let the App fetch it?
                // User requirement: "Call authService.getProfile() (or me) to get the User Role."

                // 2. Fetch User Profile
                // Use getCurrentUser which calls /auth/me or similar
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

                if (ADMIN_ROLES.includes(role)) {
                    navigate("/admin/dashboard");
                } else {
                    navigate("/customer/home");
                }

            } catch (error) {
                console.error("Auth Success Error:", error);
                navigate("/guest/login?error=AuthFailed");
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
