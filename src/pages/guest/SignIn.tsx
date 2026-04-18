import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLE_LANDING_PATHS, getRoleBaseRoute } from "@/routes";
import { GuestLayout } from "@/layouts/GuestLayout";
import {
  Mail, Lock, User, Phone, ArrowRight,
} from "lucide-react";
import "./auth-ui.css";

// ─────────────── FigiCore Box Logo ───────────────
function FigiLogo() {
  return (
    <div className="auth-panel-logo">
      Figi<span>Core</span>
    </div>
  );
}

// ─────────────── Google SVG ───────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// ─────────────── Spinner ───────────────
function Spinner() {
  return <span className="auth-spinner" />;
}

// ══════════════════════════════════════════════════════
//  Main Combined Auth Page
// ══════════════════════════════════════════════════════
export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // "active" = showing Register panel
  const initialActive = searchParams.get("mode") === "register";
  const [isActive, setIsActive] = useState(initialActive);

  // ─── Login state ───────────────────────────────────
  const fromState = location.state?.from?.pathname
    ? `${location.state.from.pathname}${location.state.from.search}`
    : null;
  const redirectUrl = searchParams.get("redirect") || fromState || "/";

  const [loginLoading, setLoginLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const response = await authService.login({
        email: loginForm.email,
        password: loginForm.password,
      });
      const responseData = (response as any).data || response;
      const accessToken = responseData.access_token || responseData.token;
      const user = responseData.user;

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("accessToken", accessToken);
      storage.setItem("user", JSON.stringify(user));

      const otherStorage = rememberMe ? sessionStorage : localStorage;
      otherStorage.removeItem("accessToken");
      otherStorage.removeItem("user");

      useAuthStore.getState().setUser(user);

      const userRole = user?.role_code || "GUEST";
      const landingPath = ROLE_LANDING_PATHS[userRole] || "/";
      const roleSafeBase = getRoleBaseRoute(userRole);

      let target = landingPath;
      if (redirectUrl && redirectUrl !== "/") {
        const redirectBase = redirectUrl.split("/").filter(Boolean)[0];
        if (roleSafeBase && redirectBase === roleSafeBase) {
          target = redirectUrl;
        }
      }

      setLoginMessage("Login successful! Redirecting...");
      setTimeout(() => navigate(target), 1000);
    } catch (err: any) {
      setLoginError(err.response?.data?.message || "Invalid email or password");
      setLoginLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (redirectUrl && redirectUrl !== "/") {
      localStorage.setItem("auth_return_url", redirectUrl);
    }
    window.location.href = `${import.meta.env.VITE_API_BASE_URL || "https://figicore.com"}/auth/google`;
  };

  // ─── Register state ────────────────────────────────
  const [regLoading, setRegLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [regForm, setRegForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });
  const [regErrors, setRegErrors] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });
  const [regGenError, setRegGenError] = useState<string | null>(null);
  const [regMessage, setRegMessage] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((p) => p - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const validateRegField = (name: string, value: string) => {
    let msg = "";
    switch (name) {
      case "email":
        if (!value.trim()) msg = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) msg = "Invalid email";
        break;
      case "phone":
        if (!value.trim()) msg = "Phone is required";
        else if (!/^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/.test(value))
          msg = "Invalid Vietnam phone number";
        break;
      case "password":
        if (!value) msg = "Password is required";
        else if (value.length < 8) msg = "Minimum 8 characters";
        else if (!/[A-Z]/.test(value)) msg = "Needs at least 1 uppercase letter";
        else if (!/[a-z]/.test(value)) msg = "Needs at least 1 lowercase letter";
        else if (!/\d/.test(value)) msg = "Needs at least 1 number";
        else if (!/[^A-Za-z0-9]/.test(value)) msg = "Needs at least 1 special character (@, #, $, etc.)";
        break;
      case "confirmPassword":
        if (!value) msg = "Required";
        else if (value !== regForm.password) msg = "Passwords do not match";
        break;
      case "fullName":
        if (!value.trim()) msg = "Full Name is required";
        else if (value.trim().length < 2) msg = "Full name must be at least 2 characters";
        else if (!/^[\p{L}\s]+$/u.test(value)) msg = "Name cannot contain special characters or numbers";
        break;
      case "otp":
        if (otpSent && (!value || value.length !== 6)) msg = "OTP must be 6 digits";
        break;
    }
    setRegErrors((prev) => ({ ...prev, [name]: msg }));
    return msg === "";
  };

  const handleRegChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setRegForm((prev) => ({ ...prev, [id]: value }));
    if (regErrors[id as keyof typeof regErrors]) {
      setRegErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const handleSendOtp = async (e: React.MouseEvent) => {
    e.preventDefault();
    setRegGenError(null);
    setRegMessage(null);

    const v = [
      validateRegField("fullName", regForm.fullName),
      validateRegField("email", regForm.email),
      validateRegField("phone", regForm.phone),
      validateRegField("password", regForm.password),
      validateRegField("confirmPassword", regForm.confirmPassword),
    ];
    if (v.includes(false)) return;

    setRegLoading(true);
    try {
      await authService.sendOtp({
        email: regForm.email,
        password: regForm.password,
        fullName: regForm.fullName,
        phone: regForm.phone,
      });
      setOtpSent(true);
      setTimer(300);
      setRegMessage(`OTP sent to ${regForm.email}. Check your inbox.`);
    } catch (err: any) {
      setRegGenError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setRegLoading(false);
    }
  };

  const handleRegSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) return;
    setRegGenError(null);
    if (!validateRegField("otp", regForm.otp)) return;

    setRegLoading(true);
    try {
      await authService.register({ email: regForm.email, otp: regForm.otp });
      navigate("/guest/home");
    } catch (err: any) {
      setRegGenError(err.response?.data?.message || "Registration failed");
    } finally {
      setRegLoading(false);
    }
  };

  // Show success msg if redirected from register
  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setLoginMessage("Account created! Please sign in.");
    }
  }, []);

  return (
    <GuestLayout activePage="login">
      <div className="auth-page">
        <div className={`auth-container ${isActive ? "active" : ""}`}>

          {/* ── Register Panel (Sign Up) ── */}
          <div className="auth-form-container auth-sign-up">
            <form className="auth-form-inner" onSubmit={handleRegSubmit}>
              <h2>Create Account</h2>
              <p className="auth-subtitle">Join the FigiCore community today</p>

              {/* Google */}
              <button type="button" className="auth-google-btn" onClick={handleGoogleLogin}>
                <GoogleIcon /> Sign up with Google
              </button>

              <div className="auth-divider"><span>or register with email</span></div>

              {regGenError && <div className="auth-alert auth-alert-error">{regGenError}</div>}
              {regMessage && <div className="auth-alert auth-alert-success">{regMessage}</div>}

              {/* Full Name */}
              <div className="auth-input-group">
                <label>Full Name</label>
                <div className="auth-input-wrapper">
                  <User size={16} />
                  <input
                    id="fullName"
                    className={`auth-input ${regErrors.fullName ? "auth-input-error" : ""}`}
                    placeholder="Your full name"
                    value={regForm.fullName}
                    onChange={handleRegChange}
                    onBlur={(e) => validateRegField("fullName", e.target.value)}
                  />
                </div>
                {regErrors.fullName && <p className="auth-error-text">{regErrors.fullName}</p>}
              </div>

              {/* Phone */}
              <div className="auth-input-group">
                <label>Phone</label>
                <div className="auth-input-wrapper">
                  <Phone size={16} />
                  <input
                    id="phone"
                    className={`auth-input ${regErrors.phone ? "auth-input-error" : ""}`}
                    placeholder="Vietnam phone number"
                    value={regForm.phone}
                    onChange={handleRegChange}
                    onBlur={(e) => validateRegField("phone", e.target.value)}
                  />
                </div>
                {regErrors.phone && <p className="auth-error-text">{regErrors.phone}</p>}
              </div>

              {/* Email */}
              <div className="auth-input-group">
                <label>Email</label>
                <div className="auth-input-wrapper">
                  <Mail size={16} />
                  <input
                    id="email"
                    type="email"
                    className={`auth-input ${regErrors.email ? "auth-input-error" : ""}`}
                    placeholder="Enter email address"
                    value={regForm.email}
                    onChange={handleRegChange}
                    onBlur={(e) => validateRegField("email", e.target.value)}
                  />
                </div>
                {regErrors.email && <p className="auth-error-text">{regErrors.email}</p>}
              </div>

              {/* Password row */}
              <div className="auth-row">
                <div className="auth-input-group">
                  <label>Password</label>
                  <div className="auth-input-wrapper">
                    <Lock size={16} />
                    <input
                      id="password"
                      type="password"
                      className={`auth-input ${regErrors.password ? "auth-input-error" : ""}`}
                      placeholder="Min 6 chars"
                      value={regForm.password}
                      onChange={handleRegChange}
                      onBlur={(e) => validateRegField("password", e.target.value)}
                    />
                  </div>
                  {regErrors.password && <p className="auth-error-text">{regErrors.password}</p>}
                </div>
                <div className="auth-input-group">
                  <label>Confirm</label>
                  <div className="auth-input-wrapper">
                    <Lock size={16} />
                    <input
                      id="confirmPassword"
                      type="password"
                      className={`auth-input ${regErrors.confirmPassword ? "auth-input-error" : ""}`}
                      placeholder="Repeat password"
                      value={regForm.confirmPassword}
                      onChange={handleRegChange}
                      onBlur={(e) => validateRegField("confirmPassword", e.target.value)}
                    />
                  </div>
                  {regErrors.confirmPassword && <p className="auth-error-text">{regErrors.confirmPassword}</p>}
                </div>
              </div>

              {/* OTP Section */}
              {!otpSent ? (
                <button
                  type="button"
                  className="auth-btn-secondary"
                  onClick={handleSendOtp}
                  disabled={regLoading}
                  style={{ marginTop: 4 }}
                >
                  {regLoading ? <Spinner /> : "Send Verification Code"}
                </button>
              ) : (
                <div className="auth-otp-box">
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                    Enter OTP from your email
                  </label>
                  <div className="auth-input-wrapper">
                    <Mail size={16} />
                    <input
                      id="otp"
                      className={`auth-input auth-otp-input ${regErrors.otp ? "auth-input-error" : ""}`}
                      placeholder="• • • • • •"
                      value={regForm.otp}
                      onChange={handleRegChange}
                      maxLength={6}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 8, color: "#64748b" }}>
                    <span>Expires in {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}</span>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={timer > 0}
                      style={{ background: "none", border: "none", color: "#1e3a8a", fontWeight: 700, cursor: "pointer", fontSize: 11 }}
                    >
                      Resend
                    </button>
                  </div>
                  {regErrors.otp && <p className="auth-error-text">{regErrors.otp}</p>}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="auth-btn-primary"
                disabled={!otpSent || regLoading}
              >
                {regLoading ? <Spinner /> : <><span>Complete Registration</span> <ArrowRight size={14} /></>}
              </button>

              <p className="auth-footer-text">
                Already have an account?{" "}
                <button type="button" className="auth-footer-link" onClick={() => setIsActive(false)}>
                  Sign In
                </button>
              </p>
            </form>
          </div>

          {/* ── Login Panel (Sign In) ── */}
          <div className="auth-form-container auth-sign-in">
            <form className="auth-form-inner" onSubmit={handleLogin}>
              <h2>Welcome Back</h2>
              <p className="auth-subtitle">Sign in to continue your collection</p>

              {/* Google */}
              <button type="button" className="auth-google-btn" onClick={handleGoogleLogin}>
                <GoogleIcon /> Continue with Google
              </button>

              <div className="auth-divider"><span>or use email</span></div>

              {loginError && <div className="auth-alert auth-alert-error">{loginError}</div>}
              {loginMessage && <div className="auth-alert auth-alert-success">{loginMessage}</div>}

              {/* Email */}
              <div className="auth-input-group">
                <label>Email Address</label>
                <div className="auth-input-wrapper">
                  <Mail size={16} />
                  <input
                    id="login-email"
                    type="email"
                    className="auth-input"
                    placeholder="Enter your email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="auth-input-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label>Password</label>
                  <Link to="/guest/forgot-password" className="auth-forgot">Forgot?</Link>
                </div>
                <div className="auth-input-wrapper">
                  <Lock size={16} />
                  <input
                    id="login-password"
                    type="password"
                    className="auth-input"
                    placeholder="Enter password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Remember Me */}
              <label className="auth-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember Me</span>
              </label>

              {/* Submit */}
              <button type="submit" className="auth-btn-primary" disabled={loginLoading}>
                {loginLoading ? <Spinner /> : <><span>Sign In</span><ArrowRight size={14} /></>}
              </button>

              <p className="auth-footer-text">
                Don't have an account?{" "}
                <button type="button" className="auth-footer-link" onClick={() => setIsActive(true)}>
                  Register Now
                </button>
              </p>
            </form>
          </div>

          {/* ── Toggle Sliding Panel ── */}
          <div className="auth-toggle-container">
            <div className="auth-toggle">
              {/* Left: shown when Register is active → prompt to Sign In */}
              <div className="auth-toggle-panel auth-toggle-left">
                <FigiLogo />
                <h2>Welcome Back!</h2>
                <p>Already have an account? Sign in to continue your figure collection journey.</p>
                <button className="auth-toggle-btn" type="button" onClick={() => setIsActive(false)}>
                  Sign In
                </button>
              </div>

              {/* Right: default → prompt to Register */}
              <div className="auth-toggle-panel auth-toggle-right">
                <FigiLogo />
                <h2>Hello!</h2>
                <p>New to FigiCore? Create an account and explore thousands of premium figures.</p>
                <button className="auth-toggle-btn" type="button" onClick={() => setIsActive(true)}>
                  Sign Up
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </GuestLayout>
  );
}
