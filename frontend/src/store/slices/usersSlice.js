import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/api';

export const findAllUsers = createAsyncThunk(
  'users/findAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const findOneUser = createAsyncThunk(
  'users/findOne',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/update',
  async ({ id, updateData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/users/${id}`, updateData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const removeUser = createAsyncThunk(
  'users/remove',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    user: null,
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(findAllUsers.fulfilled, (state, action) => {
        state.users = action.payload;
      })
      .addCase(findOneUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) state.users[index] = action.payload;
      })
      .addCase(removeUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== action.meta.arg);
      });
  },
});

export default usersSlice.reducer;