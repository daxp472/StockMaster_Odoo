import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';
import * as authService from '../../services/authService';
import { getUserData } from '../../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  warehouseStaff: User[];
}

const storedUser = getUserData();

const initialState: AuthState = {
  user: storedUser,
  isAuthenticated: !!storedUser,
  isLoading: false,
  error: null,
  warehouseStaff: [],
};

// =====================
//  AUTH THUNKS
// =====================

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response.data.user;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getCurrentUser();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user');
    }
  }
);

// =====================
//  STAFF THUNKS
// =====================

export const fetchWarehouseStaff = createAsyncThunk(
  'auth/fetchWarehouseStaff',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getWarehouseStaff();
      // Map _id to id for consistent usage
      const staffData = response.data.map((staff: any) => ({
        ...staff,
        id: staff._id || staff.id
      }));
      return staffData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch staff');
    }
  }
);

export const registerStaff = createAsyncThunk(
  'auth/registerStaff',
  async (userData: any, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      const staffData = {
        ...response.data,
        id: response.data._id || response.data.id
      };
      return staffData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const updateStaffStatus = createAsyncThunk(
  'auth/updateStaffStatus',
  async (
    { staffId, isActive }: { staffId: string; isActive: boolean },
    { rejectWithValue }
  ) => {
    try {
      const response = await authService.updateStaffStatus(staffId, isActive);
      const staffData = {
        ...response.data,
        id: response.data._id || response.data.id
      };
      return staffData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update staff status');
    }
  }
);

// ❗ NEW: Delete staff
export const deleteWarehouseStaff = createAsyncThunk(
  'auth/deleteWarehouseStaff',
  async (staffId: string, { rejectWithValue }) => {
    try {
      await authService.deleteStaff(staffId); // Make sure your backend supports this
      return staffId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete staff');
    }
  }
);

// =====================
//  SLICE
// =====================

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    logout: (state) => {
      authService.logout();
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.warehouseStaff = [];
    },
    clearError: (state) => {
      state.error = null;
    },
    setWarehouseStaff: (state, action: PayloadAction<User[]>) => {
      state.warehouseStaff = action.payload;
    },
  },

  extraReducers: (builder) => {
    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch User
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    });

    // Staff load
    builder.addCase(fetchWarehouseStaff.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchWarehouseStaff.fulfilled, (state, action) => {
      state.warehouseStaff = action.payload;
      state.isLoading = false;
    });
    builder.addCase(fetchWarehouseStaff.rejected, (state, action) => {
      state.error = action.payload as string;
      state.isLoading = false;
    });

    // Register staff
    builder.addCase(registerStaff.fulfilled, (state, action) => {
      state.warehouseStaff.push(action.payload);
    });

    // Update Active/Inactive
    builder.addCase(updateStaffStatus.fulfilled, (state, action) => {
      const index = state.warehouseStaff.findIndex(
        (staff) => staff.id === action.payload.id
      );
      if (index !== -1) {
        state.warehouseStaff[index] = action.payload;
      }
    });

    // 🔥 Delete staff
    builder.addCase(deleteWarehouseStaff.fulfilled, (state, action) => {
      state.warehouseStaff = state.warehouseStaff.filter(
        (staff) => staff.id !== action.payload
      );
    });
  },
});

export const {
  setLoading,
  setError,
  loginSuccess,
  logout,
  clearError,
  setWarehouseStaff,
} = authSlice.actions;

export default authSlice.reducer;
