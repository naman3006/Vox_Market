import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/api';

export const createReview = createAsyncThunk(
  'reviews/create',
  async (reviewData, { rejectWithValue }) => {
    try {
      const response = await api.post('/reviews', reviewData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const findReviewsByProduct = createAsyncThunk(
  'reviews/findByProduct',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/reviews/product/${productId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const removeReview = createAsyncThunk(
  'reviews/remove',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/reviews/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState: {
    reviews: [],
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createReview.fulfilled, (state, action) => {
        state.reviews.push(action.payload);
      })
      .addCase(findReviewsByProduct.fulfilled, (state, action) => {
        state.reviews = action.payload;
      })
      .addCase(removeReview.fulfilled, (state, action) => {
        state.reviews = state.reviews.filter((r) => r.id !== action.meta.arg);
      });
  },
});

export default reviewsSlice.reducer;