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
      console.log('fetchDashboardStats: Full response:', response);
      // Backend returns { success: true, data: { stats: {...}, recentMovements: [...], lowStockProducts: [...] } }
      // Axios response.data is the body, so we get { success: true, data: {...} }
      // We need to access response.data.stats
      if (response.data && response.data.stats) {
        console.log('fetchDashboardStats: Extracted stats:', response.data.stats);
        return response.data.stats;
      } else {
        console.error('fetchDashboardStats: Unexpected response structure:', response);
        return rejectWithValue('Unexpected response structure');
      }
    } catch (error: any) {
      console.error('fetchDashboardStats: Error:', error);
      return rejectWithValue(error.message || 'Failed to fetch dashboard stats');
    }
  }
);

export const fetchStaffDashboardStats = createAsyncThunk(
  'dashboard/fetchStaffStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardService.getStaffDashboardStats();
      // Backend returns { data: { stats: {...}, myRecentActivities: [...] } }
      return response.data.stats;
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
      console.log('dashboardSlice: Fetching stats...');
    });
    builder.addCase(fetchDashboardStats.fulfilled, (state, action) => {
      console.log('dashboardSlice: Stats received:', action.payload);
      state.stats = action.payload;
      state.isLoading = false;
    });
    builder.addCase(fetchDashboardStats.rejected, (state, action) => {
      console.error('dashboardSlice: Fetch failed:', action.payload);
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