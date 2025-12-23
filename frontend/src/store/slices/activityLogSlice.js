import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/api";

export const getUserActivities = createAsyncThunk(
    "activityLog/getUserActivities",
    async ({ limit = 50 } = {}, { rejectWithValue }) => {
        try {
            const response = await api.get(`/user-activity/me?limit=${limit}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch activities");
        }
    }
);

const activityLogSlice = createSlice({
    name: "activityLog",
    initialState: {
        activities: [],
        loading: false,
        error: null,
    },
    reducers: {
        clearActivities: (state) => {
            state.activities = [];
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getUserActivities.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getUserActivities.fulfilled, (state, action) => {
                state.loading = false;
                // Safety check: ensure payload is an array
                if (Array.isArray(action.payload)) {
                    state.activities = action.payload;
                } else if (action.payload && Array.isArray(action.payload.data)) {
                    // Handle { data: [...] } wrapper
                    state.activities = action.payload.data;
                } else if (action.payload && Array.isArray(action.payload.activities)) {
                    // Handle { activities: [...] } wrapper
                    state.activities = action.payload.activities;
                } else {
                    console.error('Invalid activities format:', action.payload);
                    state.activities = [];
                }
            })
            .addCase(getUserActivities.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearActivities } = activityLogSlice.actions;
export default activityLogSlice.reducer;
