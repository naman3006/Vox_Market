import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/api";

export const findMyAddresses = createAsyncThunk(
  "address/findMy",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/address/my");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createAddress = createAsyncThunk(
  "address/create",
  async (addressData, { rejectWithValue }) => {
    try {
      const response = await api.post("/address", addressData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateAddress = createAsyncThunk(
  "address/update",
  async ({ id, updateData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/address/${id}`, updateData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const removeAddress = createAsyncThunk(
  "address/remove",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/address/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const addressSlice = createSlice({
  name: "address",
  initialState: {
    addresses: [],
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(findMyAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(findMyAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = action.payload;
      })
      .addCase(findMyAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Similar for create, update, remove...
      .addCase(createAddress.fulfilled, (state, action) => {
        state.addresses.push(action.payload);
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        const index = state.addresses.findIndex(
          (addr) => addr._id === action.payload._id
        );
        if (index !== -1) state.addresses[index] = action.payload;
      })
      .addCase(removeAddress.fulfilled, (state, action) => {
        state.addresses = state.addresses.filter(
          (addr) => addr._id !== action.meta.arg
        );
      });
  },
});

export default addressSlice.reducer;
