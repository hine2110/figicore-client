/**
 * SignUp redirect shim.
 * The register UI is now integrated into SignIn.tsx.
 * Navigating to /guest/register → sends user to /guest/login?mode=register
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function SignUp() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/guest/login?mode=register", { replace: true });
  }, [navigate]);
  return null;
}
