import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Guards
import ProtectedRoute from "@/guards/ProtectedRoute";
import RoleGuard from "@/guards/RoleGuard";

// Layouts
import AdminLayout from "@/layouts/AdminLayout";
import ManagerLayout from "@/layouts/ManagerLayout";
import StaffLayout from "@/layouts/StaffLayout";

// Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import EmployeeManagement from "@/pages/admin/EmployeeManagement";
import CustomerManagement from "@/pages/admin/CustomerManagement";
import ProfileApproval from "@/pages/admin/ProfileApproval";
import ProductManagement from "@/pages/admin/ProductManagement";
import OrderOversight from "@/pages/admin/OrderOversight";
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
import StaffDashboard from "@/pages/staff/StaffDashboard";

// Customer Pages
import CustomerHome from "@/pages/customer/CustomerHome";
import CustomerShop from "@/pages/customer/Shop";
import Cart from "@/pages/customer/Cart";
import Checkout from "@/pages/customer/Checkout";
import MyOrders from "@/pages/customer/MyOrders";
import CustomerWallet from "@/pages/customer/CustomerWallet";
import CustomerProfile from "@/pages/customer/CustomerProfile";
import CustomerAuctions from "@/pages/customer/Auctions";
import CustomerProductDetail from "@/pages/customer/ProductDetail";

// Staff Pages
import OrderProcessing from "@/pages/staff/OrderProcessing";
import Inventory from "@/pages/staff/Inventory";
import PackingFulfillment from "@/pages/staff/PackingFulfillment";
import StaffPOS from "@/pages/staff/StaffPOS";
import StaffSchedule from "@/pages/staff/StaffSchedule";
import GoodsReceipt from "@/pages/staff/GoodsReceipt";
import ReturnInspection from "@/pages/staff/ReturnInspection";

// Guest Pages
import { GuestHome } from "@/pages/guest/GuestHome";
import { Browse } from "@/pages/guest/Browse";
import ProductDetail from "@/pages/guest/ProductDetail";
import { About } from "@/pages/guest/About";
import SignIn from "@/pages/guest/SignIn";
import { SignUp } from "@/pages/guest/SignUp";

export default function App() {
    return (
        <BrowserRouter>
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
                    <Route path="signup" element={<SignUp />} />
                </Route>

                {/* 2. PROTECTED ROUTES */}
                <Route element={<ProtectedRoute />}>

                    {/* ADMIN Routes */}
                    <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN']} />}>
                        <Route path="/admin" element={<AdminLayout />}>
                            <Route index element={<Navigate to="/admin/dashboard" replace />} />
                            <Route path="dashboard" element={<AdminDashboard />} />
                            <Route path="employees" element={<EmployeeManagement />} />
                            <Route path="customers" element={<CustomerManagement />} />
                            <Route path="approvals" element={<ProfileApproval />} />
                            <Route path="products" element={<ProductManagement />} />
                            <Route path="orders" element={<OrderOversight />} />
                            <Route path="auctions" element={<AuctionManagement />} />
                            <Route path="refunds" element={<ManualRefund />} />
                            <Route path="settings" element={<SystemSettings />} />
                            <Route path="logs" element={<AuditLogs />} />
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
                        </Route>
                    </Route>

                    {/* STAFF Routes */}
                    <Route element={<RoleGuard allowedRoles={['STAFF_POS', 'STAFF_INVENTORY', 'MANAGER', 'SUPER_ADMIN']} />}>
                        <Route path="/staff" element={<StaffLayout />}>
                            <Route index element={<Navigate to="/staff/dashboard" replace />} />
                            <Route path="dashboard" element={<StaffDashboard />} />
                            <Route path="orders" element={<OrderProcessing />} />
                            <Route path="inventory" element={<Inventory />} />
                            <Route path="packing" element={<PackingFulfillment />} />
                            <Route path="pos" element={<StaffPOS />} />
                            <Route path="receipt" element={<GoodsReceipt />} />
                            <Route path="returns" element={<ReturnInspection />} />
                            <Route path="schedule" element={<StaffSchedule />} />
                        </Route>
                    </Route>

                    {/* CUSTOMER Routes */}
                    <Route element={<RoleGuard allowedRoles={['CUSTOMER']} />}>
                        <Route path="/customer">
                            <Route index element={<Navigate to="/customer/home" replace />} />
                            <Route path="home" element={<CustomerHome />} />
                            <Route path="shop" element={<CustomerShop />} />
                            <Route path="product/:id" element={<CustomerProductDetail />} />
                            <Route path="cart" element={<Cart />} />
                            <Route path="checkout" element={<Checkout />} />
                            <Route path="orders" element={<MyOrders />} />
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
