// src/components/Layout/Layout.js
import React from "react";
import { Outlet } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { findCart } from "../../store/slices/cartSlice";
import { findWishlist } from "../../store/slices/wishlistSlice";
import { findAllNotifications } from "../../store/slices/notificationsSlice";
import Navbar from "./Navbar";
import ChatWidget from "../Chat/ChatWidget";

const Layout = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  React.useEffect(() => {
    if (token) {
      dispatch(findCart());
      dispatch(findWishlist());
      dispatch(findAllNotifications());
    }
  }, [dispatch, token]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-body">
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-auto">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center text-gray-500">
          <p>&copy; 2025 E-Shop. Crafted with ❤️ for excellence.</p>
        </div>
      </footer>
      <ChatWidget /> {/* Render ChatWidget at the bottom */}
    </div>
  );
};

export default Layout;
