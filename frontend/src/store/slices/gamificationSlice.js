import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/api";

export const getGamificationProfile = createAsyncThunk(
    "gamification/getProfile",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get("/gamification/profile");
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

export const checkIn = createAsyncThunk(
    "gamification/checkIn",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.post("/gamification/check-in");
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

export const spinWheel = createAsyncThunk(
    "gamification/spinWheel",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.post("/gamification/spin");
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

export const getLeaderboard = createAsyncThunk(
    "gamification/getLeaderboard",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get("/gamification/leaderboard");
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

const gamificationSlice = createSlice({
    name: "gamification",
    initialState: {
        profile: null,
        leaderboard: [],
        loading: false,
        spinResult: null,
        error: null,
    },
    reducers: {
        clearSpinResult: (state) => {
            state.spinResult = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getGamificationProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getGamificationProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.profile = action.payload;
            })
            .addCase(getGamificationProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Check In
            .addCase(checkIn.pending, (state) => {
                state.error = null;
            })
            .addCase(checkIn.fulfilled, (state, action) => {
                state.profile = action.payload.profile;
            })
            .addCase(checkIn.rejected, (state, action) => {
                state.error = action.payload;
            })
            // Spin Wheel
            .addCase(spinWheel.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(spinWheel.fulfilled, (state, action) => {
                state.loading = false;
                state.spinResult = action.payload.result;
                state.profile = action.payload.profile;
            })
            .addCase(spinWheel.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Leaderboard
            .addCase(getLeaderboard.fulfilled, (state, action) => {
                state.leaderboard = Array.isArray(action.payload) ? action.payload : [];
            });
    },
});

export const { clearSpinResult } = gamificationSlice.actions;
export default gamificationSlice.reducer;
