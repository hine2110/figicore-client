import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Guards
import ProtectedRoute from "@/guards/ProtectedRoute";
import RoleGuard from "@/guards/RoleGuard";

// Layouts
import AdminLayout from "@/layouts/AdminLayout";
import ManagerLayout from "@/layouts/ManagerLayout";
import WarehouseLayout from "@/layouts/WarehouseLayout";
import PosLayout from "@/layouts/PosLayout";

// Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";

import AccountManagement from "@/pages/admin/AccountManagement";
import ProfileApproval from "@/pages/admin/ProfileApproval";
import ProductManagement from "@/pages/admin/ProductManagement";
import OrderOversight from "@/pages/admin/OrderOversight";
import ProfilePage from "@/pages/common/ProfilePage";
import AuctionManagement from "@/pages/admin/AuctionManagement";
import ManualRefund from "@/pages/admin/ManualRefund";
import SystemSettings from "@/pages/admin/SystemSettings";
import AuditLogs from "@/pages/admin/AuditLogs";
import ManagerDashboard from "@/pages/manager/ManagerDashboard";
import TeamManagement from "@/pages/manager/TeamManagement";
import SalesReports from "@/pages/manager/SalesReports";
import GlobalInventory from "@/pages/manager/GlobalInventory";
import MarketingCampaigns from "@/pages/manager/MarketingCampaigns";
import ReturnApprovals from "@/pages/manager/ReturnApprovals";
import ShiftManagement from "@/pages/manager/ShiftManagement";
import CustomerFeedback from "@/pages/manager/CustomerFeedback";
// import StaffDashboard from "@/pages/staff/StaffDashboard"; // Deprecated

// Customer Pages
import CustomerHome from "@/pages/customer/CustomerHome";

import RetailShop from "@/pages/customer/RetailShop";
import BlindBoxShop from "@/pages/customer/BlindBoxShop";
import PreOrderShop from "@/pages/customer/PreOrderShop";
import Cart from "@/pages/customer/Cart";
import Checkout from "@/pages/customer/Checkout";

import CustomerWallet from "@/pages/customer/CustomerWallet";
import CustomerProfile from "@/pages/customer/CustomerProfile";
import CustomerAuctions from "@/pages/customer/Auctions";
import CustomerProductDetail from "@/pages/customer/ProductDetail";
import OrderDetail from "@/pages/customer/OrderDetail"; // New Import
import PreOrderPayment from "@/pages/customer/PreOrderPayment";
import OrderSuccess from "@/pages/customer/OrderSuccess";
import ScrollToTop from "@/components/ScrollToTop";

// Staff Pages
// Warehouse Pages
import Inventory from "@/pages/warehouse/Inventory";
import PackingFulfillment from "@/pages/warehouse/PackingFulfillment";
import GoodsReceipt from "@/pages/warehouse/GoodsReceipt";
import ReturnInspection from "@/pages/warehouse/ReturnInspection";
import WarehouseDashboard from "@/pages/warehouse/WarehouseDashboard";
import WarehouseSchedule from "@/pages/warehouse/WarehouseSchedule";

// POS Pages
import OrderProcessing from "@/pages/pos/OrderProcessing";
import PosSystem from "@/pages/pos/PosSystem";
import PosDashboard from "@/pages/pos/PosDashboard";
import PosSchedule from "@/pages/pos/PosSchedule";

// Guest Pages
import { GuestHome } from "@/pages/guest/GuestHome";
import { Browse } from "@/pages/guest/Browse";
import ProductDetail from "@/pages/guest/ProductDetail";
import { About } from "@/pages/guest/About";
import SignIn from "@/pages/guest/SignIn";
import { SignUp } from "@/pages/guest/SignUp";
import ForgotPassword from "@/pages/guest/ForgotPassword";
import ResetPassword from "@/pages/guest/ResetPassword";
import AuthSuccess from "@/pages/guest/AuthSuccess";
import ActivationPage from "@/pages/auth/ActivationPage";
import { Toaster } from "@/components/ui/toaster";

export default function App() {
    return (
        <BrowserRouter>
            <ScrollToTop />
            <Toaster />
            <Routes>
                {/* Default Redirect handled by RoleBasedRedirect, but keep fallback */}
                <Route path="/" element={<Navigate to="/guest/home" replace />} />

                {/* 1. PUBLIC ROUTES (Guest) */}
                <Route path="/guest">
                    <Route index element={<Navigate to="/guest/home" replace />} />
                    <Route path="home" element={<GuestHome />} />
                    <Route path="browse" element={<Browse />} />
                    <Route path="product/:id" element={<ProductDetail />} />
                    <Route path="about" element={<About />} />
                    <Route path="login" element={<SignIn />} />
                    <Route path="register" element={<SignUp />} />
                    <Route path="forgot-password" element={<ForgotPassword />} />
                    <Route path="reset-password" element={<ResetPassword />} />
                </Route>

                {/* 1.5. AUTH CALLBACK */}
                <Route path="/auth/success" element={<AuthSuccess />} />
                <Route path="/auth/activate" element={<ActivationPage />} />

                {/* 2. PROTECTED ROUTES */}
                <Route element={<ProtectedRoute />}>

                    {/* ADMIN Routes */}
                    <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN']} />}>
                        <Route path="/admin" element={<AdminLayout />}>
                            <Route index element={<Navigate to="/admin/dashboard" replace />} />
                            <Route path="dashboard" element={<AdminDashboard />} />

                            <Route path="approvals" element={<ProfileApproval />} />
                            <Route path="products" element={<ProductManagement />} />
                            <Route path="orders" element={<OrderOversight />} />
                            <Route path="auctions" element={<AuctionManagement />} />
                            <Route path="refunds" element={<ManualRefund />} />
                            <Route path="settings" element={<SystemSettings />} />
                            <Route path="logs" element={<AuditLogs />} />
                            <Route path="accounts" element={<AccountManagement />} />
                            <Route path="profile" element={<ProfilePage />} />
                        </Route>
                    </Route>

                    {/* MANAGER Routes */}
                    <Route element={<RoleGuard allowedRoles={['MANAGER', 'SUPER_ADMIN']} />}>
                        <Route path="/manager" element={<ManagerLayout />}>
                            <Route index element={<Navigate to="/manager/dashboard" replace />} />
                            <Route path="dashboard" element={<ManagerDashboard />} />
                            <Route path="team" element={<TeamManagement />} />
                            <Route path="reports" element={<SalesReports />} />
                            <Route path="inventory" element={<GlobalInventory />} />
                            <Route path="campaigns" element={<MarketingCampaigns />} />
                            <Route path="returns" element={<ReturnApprovals />} />
                            <Route path="shifts" element={<ShiftManagement />} />
                            <Route path="feedback" element={<CustomerFeedback />} />
                            <Route path="profile" element={<ProfilePage />} />
                        </Route>
                    </Route>

                    {/* WAREHOUSE Routes */}
                    <Route element={<RoleGuard allowedRoles={['STAFF_INVENTORY', 'MANAGER', 'SUPER_ADMIN']} />}>
                        <Route path="/warehouse" element={<WarehouseLayout />}>
                            <Route index element={<Navigate to="/warehouse/dashboard" replace />} />
                            <Route path="dashboard" element={<WarehouseDashboard />} />
                            <Route path="inventory" element={<Inventory />} />
                            <Route path="packing" element={<PackingFulfillment />} />
                            <Route path="imports" element={<GoodsReceipt />} />
                            <Route path="returns" element={<ReturnInspection />} />
                            <Route path="profile" element={<ProfilePage />} />
                            <Route path="schedule" element={<WarehouseSchedule />} />
                        </Route>
                    </Route>

                    {/* POS Routes */}
                    <Route element={<RoleGuard allowedRoles={['STAFF_POS', 'MANAGER', 'SUPER_ADMIN']} />}>
                        <Route path="/pos" element={<PosLayout />}>
                            <Route index element={<Navigate to="/pos/counter" replace />} />
                            <Route path="dashboard" element={<PosDashboard />} />
                            <Route path="counter" element={<PosSystem />} />
                            <Route path="orders" element={<OrderProcessing />} />
                            <Route path="schedule" element={<PosSchedule />} />
                            <Route path="profile" element={<ProfilePage />} />
                        </Route>
                    </Route>

                    {/* CUSTOMER Routes */}
                    <Route element={<RoleGuard allowedRoles={['CUSTOMER']} />}>
                        <Route path="/customer">
                            <Route index element={<Navigate to="/customer/home" replace />} />
                            <Route path="home" element={<CustomerHome />} />
                            {/* <Route path="shop" element={<CustomerShop />} /> */}
                            <Route path="retail" element={<RetailShop />} />
                            <Route path="blindbox" element={<BlindBoxShop />} />
                            <Route path="preorder" element={<PreOrderShop />} />
                            <Route path="product/:id" element={<CustomerProductDetail />} />
                            <Route path="cart" element={<Cart />} />
                            <Route path="checkout" element={<Checkout />} />
                            <Route path="order-success" element={<OrderSuccess />} />

                            <Route path="orders/:id" element={<OrderDetail />} /> {/* New Route */}
                            <Route path="preorders/:id/pay" element={<PreOrderPayment />} />
                            <Route path="wallet" element={<CustomerWallet />} />
                            <Route path="profile" element={<CustomerProfile />} />
                            <Route path="auctions" element={<CustomerAuctions />} />
                        </Route>
                    </Route>

                </Route>

                {/* Catch All */}
                <Route path="*" element={<div className="p-10 text-center">404 - Not Found</div>} />
            </Routes>
        </BrowserRouter>
    );
}
