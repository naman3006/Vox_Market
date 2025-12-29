import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/api";

const STORAGE_USERS = "auth.users";
const STORAGE_ACTIVE = "auth.active";

const loadUsers = () =>
  JSON.parse(sessionStorage.getItem(STORAGE_USERS) || "{}");

const saveUsers = (data) =>
  sessionStorage.setItem(STORAGE_USERS, JSON.stringify(data));

const setActive = (email) =>
  sessionStorage.setItem(STORAGE_ACTIVE, email);

const getActive = () => {
  const users = loadUsers();
  const email = sessionStorage.getItem(STORAGE_ACTIVE);
  return users[email] || null;
};

export const register = createAsyncThunk(
  "auth/register",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/register", data);

      return {
        email: res.data.data.user.email,
        user: res.data.data.user,
        token: res.data.data.token,
      };
    } catch (err) {
      let message = "Registration failed";

      if (err.response?.data?.message) {
        const msg = err.response.data.message;
        message = typeof msg === 'string'
          ? msg
          : (typeof msg === 'object' && msg.message ? msg.message : JSON.stringify(msg));
      } else if (err.message) {
        message = err.message;
      }

      return rejectWithValue({ message });
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/login", data);

      if (res.data.data.isTwoFactorAuthenticationEnabled) {
        return {
          isTwoFactorAuthenticationEnabled: true,
          user: res.data.data.user,
          twoFactorAuthUrl: res.data.data.twoFactorAuthUrl,
        };
      }

      return {
        email: res.data.data.user.email,
        user: res.data.data.user,
        token: res.data.data.token,
      };
    } catch (err) {
      let message = "Login failed";

      if (err.response?.data?.message) {
        const msg = err.response.data.message;
        message = typeof msg === 'string'
          ? msg
          : (typeof msg === 'object' && msg.message ? msg.message : JSON.stringify(msg));
      } else if (err.message) {
        message = err.message;
      }

      return rejectWithValue({ message });
    }
  }
);
export const getProfile = createAsyncThunk(
  "auth/profile",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/auth/profile");

      return res.data.data;

    } catch (err) {
      let message = "Failed to fetch profile";
      if (err.response?.data?.message) {
        const msg = err.response.data.message;
        message = typeof msg === 'string' ? msg : JSON.stringify(msg);
      } else if (err.message) message = err.message;
      return rejectWithValue({ message });
    }
  }
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/users/${id}`, data);
      return res.data.data;
    } catch (err) {
      let message = "Failed to update profile";
      if (err.response?.data?.message) {
        const msg = err.response.data.message;
        message = typeof msg === 'string' ? msg : JSON.stringify(msg);
      } else if (err.message) message = err.message;
      return rejectWithValue({ message });
    }
  }
);

export const uploadAvatar = createAsyncThunk(
  "auth/uploadAvatar",
  async ({ id, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post(`/users/${id}/avatar`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data.data;
    } catch (err) {
      let message = "Failed to upload avatar";
      if (err.response?.data?.message) {
        const msg = err.response.data.message;
        message = typeof msg === 'string' ? msg : JSON.stringify(msg);
      } else if (err.message) message = err.message;
      return rejectWithValue({ message });
    }
  }
);

export const deleteAccount = createAsyncThunk(
  "auth/deleteAccount",
  async ({ id, password }, { rejectWithValue }) => {
    try {
      await api.post(`/users/${id}/delete`, { password });
      return id;
    } catch (err) {
      let message = "Failed to delete account";
      if (err.response?.data?.message) {
        const msg = err.response.data.message;
        message = typeof msg === 'string' ? msg : JSON.stringify(msg);
      } else if (err.message) message = err.message;
      return rejectWithValue({ message });
    }
  }
);

export const switchUser = createAsyncThunk(
  "auth/switch",
  async (email) => email
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { getState, rejectWithValue }) => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      // Even if API fails, we proceed to logout locally
      console.error("Logout API failed", err);
    }
    return;
  }
);


const active = getActive();

const initialState = {
  users: loadUsers(),
  user: active?.user || null,
  token: active?.token || null,
  activeEmail: active ? active.user.email : null,
  loading: false,
  error: null,
  isAuthenticated: !!active,
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    // Reducer removal: We will replace this with async thunk handling
    // logout: (state) => ... removed from here
  },

  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;

        state.users[action.payload.email] = {
          user: action.payload.user,
          token: action.payload.token,
        };

        saveUsers(state.users);
        setActive(action.payload.email);

        state.user = action.payload.user;
        state.token = action.payload.token;
        state.activeEmail = action.payload.email;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;

        if (action.payload.isTwoFactorAuthenticationEnabled) {
          return;
        }

        state.users[action.payload.email] = {
          user: action.payload.user,
          token: action.payload.token,
        };

        saveUsers(state.users);
        setActive(action.payload.email);

        state.user = action.payload.user;
        state.token = action.payload.token;
        state.activeEmail = action.payload.email;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // SWITCH
      .addCase(switchUser.fulfilled, (state, action) => {
        const email = action.payload;

        if (!state.users[email]) return;

        state.user = state.users[email].user;
        state.token = state.users[email].token;

        state.activeEmail = email;

        setActive(email);
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;

        if (state.activeEmail && state.users[state.activeEmail]) {
          state.users[state.activeEmail].user = action.payload;
          saveUsers(state.users);
        }
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.error = action.payload;
        state.user = null;
      })

      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;

        if (state.activeEmail && state.users[state.activeEmail]) {
          state.users[state.activeEmail].user = action.payload;
          const oldEmail = state.activeEmail;
          const newEmail = action.payload.email;

          if (oldEmail !== newEmail) {
            const userData = state.users[oldEmail];
            delete state.users[oldEmail];
            state.users[newEmail] = { ...userData, user: action.payload };
            state.activeEmail = newEmail;
            setActive(newEmail);
          } else {
            state.users[state.activeEmail].user = action.payload;
          }
          saveUsers(state.users);
        }

        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(uploadAvatar.pending, (state) => {
        state.loading = true;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;

        if (state.activeEmail && state.users[state.activeEmail]) {
          state.users[state.activeEmail].user = action.payload;
          saveUsers(state.users);
        }
        state.error = null;
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // DELETE ACCOUNT
      .addCase(deleteAccount.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.loading = false;
        // reuse logout logic
        state.user = null;
        state.token = null;
        state.activeEmail = null;
        state.isAuthenticated = false;
        sessionStorage.removeItem(STORAGE_ACTIVE);
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // LOGOUT
      .addCase(logout.fulfilled, (state) => {
        if (state.activeEmail) {
          delete state.users[state.activeEmail];
          saveUsers(state.users);
        }
        state.user = null;
        state.token = null;
        state.activeEmail = null;
        sessionStorage.removeItem(STORAGE_ACTIVE);
        state.isAuthenticated = false;
      });

  },
});

// ------------------------------------------------------
export const { } = authSlice.actions;

export const selectUser = (s) => s.auth.user;
export const selectToken = (s) => s.auth.token;
export const selectAllUsers = (s) => s.auth.users;

export default authSlice.reducer;
