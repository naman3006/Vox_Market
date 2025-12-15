// src/store/slices/notificationsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from '../api/api';

export const findAllNotifications = createAsyncThunk(
  "notifications/findAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/notifications');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const markAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.patch('/notifications/read-all');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    notifications: [],
    loading: false,
    error: null,
  },
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(findAllNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(findAllNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
      })
      .addCase(findAllNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markAsRead.pending, (state, action) => {
        // Optimistic update
        const index = state.notifications.findIndex(
          (n) => (n._id || n.id) === action.meta.arg
        );
        if (index !== -1) state.notifications[index].read = true;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        // Already handled in pending, but we can ensure consistency or do nothing
      })
      .addCase(markAsRead.rejected, (state, action) => {
        // Revert on failure
        const index = state.notifications.findIndex(
          (n) => (n._id || n.id) === action.meta.arg
        );
        if (index !== -1) state.notifications[index].read = false;
        state.error = action.payload;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach(n => n.read = true);
      });
  },
});

export const { addNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
