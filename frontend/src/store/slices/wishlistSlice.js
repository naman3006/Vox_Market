import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/api';

export const findWishlist = createAsyncThunk(
  'wishlist/findOne',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/wishlist');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const addToWishlist = createAsyncThunk(
  'wishlist/add',
  async (payload, { rejectWithValue }) => {
    try {
      const productId = typeof payload === 'string' ? payload : payload.productId;
      const wishlistId = typeof payload === 'object' ? payload.wishlistId : undefined;

      const response = await api.post(`/wishlist/add/${productId}`, { wishlistId });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);


export const createWishlist = createAsyncThunk(
  'wishlist/create',
  async (name, { rejectWithValue }) => {
    try {
      const response = await api.post('/wishlist', { name });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const removeFromWishlist = createAsyncThunk(
  'wishlist/remove',
  async (payload, { rejectWithValue }) => {
    try {
      const productId = typeof payload === 'string' ? payload : payload.productId;
      const wishlistId = typeof payload === 'object' ? payload.wishlistId : undefined;

      const response = await api.delete(`/wishlist/remove/${productId}`, { data: { wishlistId } });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    wishlist: null, 
    wishlists: [],
    items: [], 
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(findWishlist.fulfilled, (state, action) => {
        const data = Array.isArray(action.payload) ? action.payload : [action.payload];
        state.wishlists = data;
        const allIds = new Set();
        data.forEach(list => {
          if (list.items) {
            list.items.forEach(item => allIds.add(item.productId._id || item.productId));
          } else if (list.productIds) {
            list.productIds.forEach(p => allIds.add(typeof p === 'string' ? p : p._id));
          }
        });
        state.items = Array.from(allIds);
        state.wishlist = data[0] || null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        const updatedList = action.payload;
        const index = state.wishlists.findIndex(w => w._id === updatedList._id);
        if (index !== -1) {
          state.wishlists[index] = updatedList;
        } else {
          state.wishlists.push(updatedList);
        }
        if (updatedList.items) {
          updatedList.items.forEach(item => {
            const id = item.productId._id || item.productId;
            if (!state.items.includes(id)) state.items.push(id);
          });
        } else if (updatedList.productIds) {
          updatedList.productIds.forEach(p => {
            const id = typeof p === 'string' ? p : p._id;
            if (!state.items.includes(id)) state.items.push(id);
          });
        }
        state.wishlist = updatedList;
      })
      .addCase(createWishlist.fulfilled, (state, action) => {
        state.wishlists.push(action.payload);
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        const updatedList = action.payload;
        const index = state.wishlists.findIndex(w => w._id === updatedList._id);
        if (index !== -1) {
          state.wishlists[index] = updatedList;
        }
        const allIds = new Set();
        state.wishlists.forEach(list => {
          if (list.items) {
            list.items.forEach(item => allIds.add(item.productId._id || item.productId));
          } else if (list.productIds) {
            list.productIds.forEach(p => allIds.add(typeof p === 'string' ? p : p._id));
          }
        });
        state.items = Array.from(allIds);
        state.wishlist = updatedList;
      });
  },
});

export default wishlistSlice.reducer;