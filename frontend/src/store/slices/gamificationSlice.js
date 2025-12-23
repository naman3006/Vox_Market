import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/api";

// Helper to extract error message
// Helper to extract error message
const getErrorMessage = (error) => {
    const responseData = error.response?.data;

    if (!responseData) {
        return error.message || "An error occurred";
    }

    // Handle NestJS standard { statusCode, message, error }
    if (responseData.message) {
        if (Array.isArray(responseData.message)) {
            return responseData.message.join(', ');
        }
        return responseData.message;
    }

    if (typeof responseData === 'string') {
        return responseData;
    }

    return "An error occurred";
};

export const getGamificationProfile = createAsyncThunk(
    "gamification/getProfile",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get("/gamification/profile");
            return response.data;
        } catch (error) {
            return rejectWithValue(getErrorMessage(error));
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
            return rejectWithValue(getErrorMessage(error));
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
            return rejectWithValue(getErrorMessage(error));
        }
    }
);

export const scratchCard = createAsyncThunk(
    "gamification/scratchCard",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.post("/gamification/scratch");
            return response.data;
        } catch (error) {
            return rejectWithValue(getErrorMessage(error));
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
            return rejectWithValue(getErrorMessage(error));
        }
    }
);

export const getRecentActivities = createAsyncThunk(
    "gamification/getRecentActivities",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get("/gamification/activities");
            return response.data;
        } catch (error) {
            return rejectWithValue(getErrorMessage(error));
        }
    }
);

const gamificationSlice = createSlice({
    name: "gamification",
    initialState: {
        profile: null,
        leaderboard: [],
        recentActivities: [],
        loading: false,
        spinResult: null,
        scratchResult: null,
        error: null,
    },
    reducers: {
        clearSpinResult: (state) => {
            state.spinResult = null;
        },
        clearScratchResult: (state) => {
            state.scratchResult = null;
        },
        updateGamificationData: (state, action) => {
            if (action.payload) {
                state.profile = { ...state.profile, ...action.payload };
            }
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
                state.loading = false;
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
            // Scratch Card
            .addCase(scratchCard.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(scratchCard.fulfilled, (state, action) => {
                state.loading = false;
                state.scratchResult = action.payload.result;
                state.profile = action.payload.profile;
            })
            .addCase(scratchCard.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Leaderboard
            .addCase(getLeaderboard.fulfilled, (state, action) => {
                state.leaderboard = Array.isArray(action.payload) ? action.payload : [];
            })
            // Recent Activities
            .addCase(getRecentActivities.fulfilled, (state, action) => {
                state.recentActivities = Array.isArray(action.payload) ? action.payload : [];
            });
    },
});

export const { clearSpinResult, clearScratchResult, updateGamificationData } = gamificationSlice.actions;
export default gamificationSlice.reducer;
