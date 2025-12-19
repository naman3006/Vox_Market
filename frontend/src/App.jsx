// src/App.js
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

// Layout Components
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
// Lazy Load Pages
// Keep Home eager loaded for LCP (Largest Contentful Paint)
import Home from "./pages/Home";

// Lazy load everything else
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetails = lazy(() => import("./pages/OrderDetails"));
const Profile = lazy(() => import("./pages/Profile"));
const Addresses = lazy(() => import("./pages/Addresses"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Register = lazy(() => import("./pages/Register"));
const Notifications = lazy(() => import("./pages/Notifications"));
const ProductManagement = lazy(() => import("./pages/ProductManagement"));
const OrderManagement = lazy(() => import("./pages/OrderManagement"));
const SellerOrders = lazy(() => import("./pages/SellerOrders"));
const CategoryManagement = lazy(() => import("./pages/CategoryManagement"));
const CouponManagement = lazy(() => import("./components/CouponManagement/CouponManagement"));
const RewardsCenter = lazy(() => import("./pages/RewardsCenter"));
const WishlistDetail = lazy(() => import("./pages/WishlistDetail"));
const SharedWishlist = lazy(() => import("./pages/SharedWishlist"));
import { getProfile } from "./store/slices/authSlice";
import { findWishlist } from "./store/slices/wishlistSlice";

// import { io } from "socket.io-client"; // Removed, using Context
import { useSocket } from "./contexts/SocketContext";
import { addNotification } from "./store/slices/notificationsSlice";
import { toast, ToastContainer } from "react-toastify";
import VoiceOverlay from "./components/VoiceAssistant/VoiceOverlay";
import ActivityToast from "./components/common/ActivityToast";

import { useCoBrowsing } from "./hooks/useCoBrowsing";
import ShopTogether from "./components/co-browsing/ShopTogether";
import CursorOverlay from "./components/co-browsing/CursorOverlay";

const App = () => {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  // Co-Browsing Hook
  const {
    socket: coSocket,
    isConnected: isCoConnected,
    session,
    participants,
    reactions,
    createSession,
    joinSession,
    emitCursorMove,
    sendReaction,
    leaveSession
  } = useCoBrowsing();

  useEffect(() => {
    if (token && !user) {
      // Fetch profile if we have a token but no user (page reload)
      dispatch(getProfile());
    }
    // Also fetch wishlist to sync state
    if (token) {
      dispatch(findWishlist());
    }
  }, [dispatch, token, user]);

  // Global Mouse Tracking for Co-Browsing
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Calculate relative position (0-1)
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      emitCursorMove(x, y);
    };

    if (session) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [session, emitCursorMove]);

  /* 
   * Socket logic is now handled in SocketContext.
   * We can use the useSocket hook here if we need to listen for global events
   * or just rely on the context to maintain the connection.
   * For this implementation, we'll let SocketContext handle the connection,
   * and components can use useSocket() to listen to specific events.
   * 
   * However, to keep the existing notification toast logic working globally:
   */
  const socket = useSocket();

  useEffect(() => {
    if (socket) {
      const handleNotification = (notification) => {
        // The notification object is sent directly, not wrapped in a payload property
        dispatch(addNotification(notification));
        toast.info(notification.message || "New notification");
      };

      socket.on("notification", handleNotification);

      return () => {
        socket.off("notification", handleNotification);
      };
    }
  }, [socket, dispatch]);

  return (
    <div>
      <Suspense fallback={
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route
              path="products/manage"
              element={
                <ProtectedRoute>
                  {(user?.role === "admin" || user?.role === "seller") ? (
                    <ProductManagement />
                  ) : (
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
                      <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
                    </div>
                  )}
                </ProtectedRoute>
              }
            />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route
              path="cart"
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders/:id"
              element={
                <ProtectedRoute>
                  <OrderDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="addresses"
              element={
                <ProtectedRoute>
                  <Addresses />
                </ProtectedRoute>
              }
            />
            <Route
              path="rewards"
              element={
                <ProtectedRoute>
                  <RewardsCenter />
                </ProtectedRoute>
              }
            />
            <Route
              path="wishlists"
              element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              }
            />
            <Route
              path="wishlist"
              element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              }
            />
            <Route
              path="wishlists/:id"
              element={
                <ProtectedRoute>
                  <WishlistDetail />
                </ProtectedRoute>
              }
            />
            <Route path="wishlist/share/:token" element={<SharedWishlist />} />
            <Route
              path="notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            {user?.role === "admin" && (
              <>
                <Route
                  path="admin/dashboard"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/orders"
                  element={
                    <ProtectedRoute>
                      <OrderManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="categories/manage"
                  element={
                    <ProtectedRoute>
                      <CategoryManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/coupons"
                  element={
                    <ProtectedRoute>
                      <CouponManagement />
                    </ProtectedRoute>
                  }
                />
              </>
            )}
            {user?.role === "seller" && (
              <Route
                path="seller/orders"
                element={
                  <ProtectedRoute>
                    <SellerOrders />
                  </ProtectedRoute>
                }
              />
            )}
            <Route path="login" element={token ? <Navigate to="/" /> : <Login />} />
            <Route
              path="register"
              element={token ? <Navigate to="/" /> : <Register />}
            />
            <Route
              path="forgot-password"
              element={token ? <Navigate to="/" /> : <ForgotPassword />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>

        </Routes>
      </Suspense>
      <VoiceOverlay />
      <ToastContainer />
      <ActivityToast />
      <ShopTogether
        session={session}
        isConnected={isCoConnected}
        onCreateSession={createSession}
        onJoinSession={joinSession}
        onLeaveSession={leaveSession}
        onSendReaction={sendReaction}
      />
      {session && <CursorOverlay participants={participants} reactions={reactions} myId={coSocket?.id} />}
    </div >
  );
};

export default App;
