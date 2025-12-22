import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/api';

export const initiatePayment = createAsyncThunk(
  'payments/initiate',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/initiate', { orderId });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const verifyPayment = createAsyncThunk(
  'payments/verify',
  async (verifyData, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/verify', verifyData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getPaymentStatus = createAsyncThunk(
  'payments/getStatus',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/payments/order/${orderId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const paymentsSlice = createSlice({
  name: 'payments',
  initialState: {
    payment: null,
    status: null,
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(initiatePayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initiatePayment.fulfilled, (state, action) => {
        state.loading = false;
        state.payment = action.payload;
      })
      .addCase(initiatePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getPaymentStatus.fulfilled, (state, action) => {
        state.status = action.payload;
      });
  },
});

export default paymentsSlice.reducer;