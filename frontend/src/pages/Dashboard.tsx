import React, { useEffect } from 'react';
import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, RotateCcw, TrendingUp } from 'lucide-react';
import { useTypedSelector } from '../hooks/useTypedSelector';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { KPICard } from '../components/Dashboard/KPICard';
import { FilterBar } from '../components/Dashboard/FilterBar';
import { fetchDashboardStats } from '../store/slices/dashboardSlice';
import { fetchProducts } from '../store/slices/productSlice';

export const Dashboard: React.FC = () => {
  const { stats } = useTypedSelector((state) => state.dashboard);
  const { products } = useTypedSelector((state) => state.products);
  const { receipts, deliveries, movements } = useTypedSelector((state) => state.operations);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchProducts());
  }, [dispatch]);

  const lowStockProducts = products.filter(p => p.currentStock <= (p.minStock || 0));
  const recentMovements = movements.slice(0, 10);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800';
      case 'ready': return 'bg-blue-100 text-blue-800';
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <KPICard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          color="bg-blue-500"
          trend={{ value: 5, isPositive: true }}
        />
        <KPICard
          title="Low Stock Items"
          value={stats.lowStockItems}
          icon={AlertTriangle}
          color="bg-orange-500"
        />
        <KPICard
          title="Out of Stock"
          value={stats.outOfStockItems}
          icon={AlertTriangle}
          color="bg-red-500"
        />
        <KPICard
          title="Pending Receipts"
          value={stats.pendingReceipts}
          icon={ArrowDownToLine}
          color="bg-green-500"
        />
        <KPICard
          title="Pending Deliveries"
          value={stats.pendingDeliveries}
          icon={ArrowUpFromLine}
          color="bg-purple-500"
        />
        <KPICard
          title="Scheduled Transfers"
          value={stats.scheduledTransfers}
          icon={RotateCcw}
          color="bg-indigo-500"
        />
      </div>

      {/* Filters */}
      <FilterBar onFilterChange={(filters) => console.log(filters)} />

      {/* Recent Activity and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alert</h3>
            <div className="space-y-3">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-600">
                        {product.currentStock} / {product.minStock} units
                      </p>
                      <p className="text-xs text-gray-500">{product.location}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No low stock items</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Movements */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Stock Movements</h3>
            <div className="space-y-3">
              {recentMovements.length > 0 ? (
                recentMovements.map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full mr-3 ${
                        movement.type === 'receipt' ? 'bg-green-100' :
                        movement.type === 'delivery' ? 'bg-blue-100' :
                        movement.type === 'transfer' ? 'bg-purple-100' :
                        'bg-orange-100'
                      }`}>
                        {movement.type === 'receipt' && <ArrowDownToLine className="w-4 h-4 text-green-600" />}
                        {movement.type === 'delivery' && <ArrowUpFromLine className="w-4 h-4 text-blue-600" />}
                        {movement.type === 'transfer' && <RotateCcw className="w-4 h-4 text-purple-600" />}
                        {movement.type === 'adjustment' && <TrendingUp className="w-4 h-4 text-orange-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{movement.productName}</p>
                        <p className="text-sm text-gray-500">{movement.reference}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(movement.status)}`}>
                        {movement.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No recent movements</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};