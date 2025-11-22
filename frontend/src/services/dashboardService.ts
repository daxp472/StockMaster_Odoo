import api from './api';

// Get dashboard statistics
export const getDashboardStats = async () => {
  console.log('dashboardService: Fetching /dashboard/stats...');
  const response = await api.get('/dashboard/stats');
  console.log('dashboardService: Response received:', response.data);
  return response.data;
};

// Get staff dashboard stats
export const getStaffDashboardStats = async () => {
  const response = await api.get('/dashboard/staff-stats');
  return response.data;
};

// Get inventory trends
export const getInventoryTrends = async (period?: string) => {
  const params = period ? `?period=${period}` : '';
  const response = await api.get(`/dashboard/trends${params}`);
  return response.data;
};

// Search products
export const searchProducts = async (query: string) => {
  const response = await api.get(`/dashboard/search?q=${encodeURIComponent(query)}`);
  return response.data;
};

export default {
  getDashboardStats,
  getStaffDashboardStats,
  getInventoryTrends,
  searchProducts,
};
