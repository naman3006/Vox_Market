import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import addressSlice from './slices/addressSlice';
import adminSlice from './slices/adminSlice';
import cartSlice from './slices/cartSlice';
import categoriesSlice from './slices/categoriesSlice';
import notificationsSlice from './slices/notificationsSlice';
import ordersSlice from './slices/ordersSlice';
import paymentsSlice from './slices/paymentsSlice';
import productsSlice from './slices/productsSlice';
import reviewsSlice from './slices/reviewsSlice';
import usersSlice from './slices/usersSlice';
import wishlistSlice from './slices/wishlistSlice';
import gamificationSlice from './slices/gamificationSlice';


export const store = configureStore({
  reducer: {
    auth: authSlice,
    address: addressSlice,
    admin: adminSlice,
    cart: cartSlice,
    categories: categoriesSlice,
    notifications: notificationsSlice,
    orders: ordersSlice,
    payments: paymentsSlice,
    products: productsSlice,
    reviews: reviewsSlice,
    users: usersSlice,
    wishlist: wishlistSlice,
    gamification: gamificationSlice,
  },
});