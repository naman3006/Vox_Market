// src/store/slices/cartSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/api';

export const findCart = createAsyncThunk(
  'cart/findCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/cart');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/add',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const response = await api.post('/cart/add', { productId, quantity });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/update',
  async ({ id, updateData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/cart/update/${id}`, updateData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/remove',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/cart/remove/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clear',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.delete('/cart/clear');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const validateCoupon = createAsyncThunk(
  'cart/validateCoupon',
  async ({ code, cartTotal, categoryIds, productIds }, { rejectWithValue }) => {
    try {
      const response = await api.post('/coupons/validate', {
        code,
        cartTotal,
        categoryIds,
        productIds,
      });
      return response.data.data; // Expecting { valid: true, discount: number, message: string, coupon: object }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Invalid coupon');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    cart: null,
    loading: false,
    error: null,
    coupon: null, // { code: string, discount: number, type: string }
    discountAmount: 0,
    couponError: null,
    couponLoading: false,
  },
  reducers: {
    removeCoupon: (state) => {
      state.coupon = null;
      state.discountAmount = 0;
      state.couponError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(findCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(findCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
      })
      .addCase(findCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.cart = action.payload;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.cart = action.payload;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.cart = action.payload;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.cart = null;
        state.coupon = null;
        state.discountAmount = 0;
        state.couponError = null;
      })
      // Coupon Reducers
      .addCase(validateCoupon.pending, (state) => {
        state.couponLoading = true;
        state.couponError = null;
      })
      .addCase(validateCoupon.fulfilled, (state, action) => {
        state.couponLoading = false;
        if (action.payload.valid) {
          state.coupon = action.payload.coupon;
          state.discountAmount = action.payload.discount;
          state.couponError = null;
        } else {
          state.coupon = null;
          state.discountAmount = 0;
          state.couponError = action.payload.message;
        }
      })
      .addCase(validateCoupon.rejected, (state, action) => {
        state.couponLoading = false;
        state.coupon = null;
        state.discountAmount = 0;
        state.couponError = action.payload;
      });
  },
});

export const { removeCoupon } = cartSlice.actions;

export default cartSlice.reducer;