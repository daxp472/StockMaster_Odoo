import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DashboardStats, FilterOptions } from '../../types';
import * as dashboardService from '../../services/dashboardService';

interface DashboardState {
  stats: DashboardStats;
  filters: FilterOptions;
  isLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  stats: {
    totalProducts: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    scheduledTransfers: 0,
  },
  filters: {
    documentType: [],
    status: [],
    warehouse: [],
    category: [],
  },
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardService.getDashboardStats();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch dashboard stats');
    }
  }
);

export const fetchStaffDashboardStats = createAsyncThunk(
  'dashboard/fetchStaffStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardService.getStaffDashboardStats();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch staff dashboard stats');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setStats: (state, action: PayloadAction<DashboardStats>) => {
      state.stats = action.payload;
    },
    setFilters: (state, action: PayloadAction<FilterOptions>) => {
      state.filters = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch dashboard stats
    builder.addCase(fetchDashboardStats.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchDashboardStats.fulfilled, (state, action) => {
      state.stats = action.payload;
      state.isLoading = false;
    });
    builder.addCase(fetchDashboardStats.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch staff dashboard stats
    builder.addCase(fetchStaffDashboardStats.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchStaffDashboardStats.fulfilled, (state, action) => {
      state.stats = action.payload;
      state.isLoading = false;
    });
    builder.addCase(fetchStaffDashboardStats.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { setStats, setFilters, setLoading } = dashboardSlice.actions;
export default dashboardSlice.reducer;