import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/api';

export const createOrder = createAsyncThunk(
  'orders/create',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const findMyOrders = createAsyncThunk(
  'orders/findMy',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/orders/my');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const findAllOrders = createAsyncThunk(
  'orders/findAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/orders');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const findSellerOrders = createAsyncThunk(
  'orders/findSeller',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/orders/seller');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateStatus',
  async ({ id, statusData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/orders/${id}/status`, statusData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancel',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/orders/${orderId}/cancel`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    myOrders: [],
    allOrders: [],
    sellerOrders: [],
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.fulfilled, (state, action) => {
        state.myOrders.push(action.payload);
      })
      .addCase(findMyOrders.fulfilled, (state, action) => {
        state.myOrders = action.payload;
      })
      .addCase(findAllOrders.fulfilled, (state, action) => {
        state.allOrders = action.payload;
      })
      .addCase(findSellerOrders.fulfilled, (state, action) => {
        state.sellerOrders = action.payload;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const index = state.allOrders.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) state.allOrders[index] = action.payload;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const index = state.myOrders.findIndex((o) => o._id === action.payload._id || o.id === action.payload.id);
        if (index !== -1) {
          state.myOrders[index] = action.payload;
        }
      });
  },
});

export default ordersSlice.reducer;