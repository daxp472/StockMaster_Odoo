import React, { useEffect } from 'react';
import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, RotateCcw, TrendingUp } from 'lucide-react';
import { useTypedSelector } from '../hooks/useTypedSelector';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { KPICard } from '../components/Dashboard/KPICard';
import { FilterBar } from '../components/Dashboard/FilterBar';
import { fetchDashboardStats } from '../store/slices/dashboardSlice';
import { fetchProducts } from '../store/slices/productSlice';
import { setReceipts, setDeliveries } from '../store/slices/operationSlice';
import operationService from '../services/operationService';

export const Dashboard: React.FC = () => {
  const { stats, isLoading, error } = useTypedSelector((state) => state.dashboard);
  const { products } = useTypedSelector((state) => state.products);
  const { receipts, deliveries, movements } = useTypedSelector((state) => state.operations);
  const { user } = useTypedSelector((state) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    console.log('Dashboard: Fetching dashboard stats...');
    dispatch(fetchDashboardStats());
    dispatch(fetchProducts({}));
    
    // Fetch pending receipts and deliveries for task list
    const fetchPendingTasks = async () => {
      try {
        const [receiptsResp, deliveriesResp] = await Promise.all([
          operationService.getReceipts(),
          operationService.getDeliveries()
        ]);
        
        const receiptsList = receiptsResp && receiptsResp.data ? receiptsResp.data : receiptsResp;
        const deliveriesList = deliveriesResp && deliveriesResp.data ? deliveriesResp.data : deliveriesResp;
        
        // Map and set receipts
        const mappedReceipts = (receiptsList || []).map((r: any) => ({
          id: r._id || r.id,
          reference: r.reference,
          supplier: r.supplier,
          status: r.status || 'draft',
          date: r.expectedDate || r.createdAt,
          totalQuantity: (r.items || []).reduce((sum: number, it: any) => sum + (it.quantityOrdered || 0), 0),
          items: (r.items || []).map((it: any) => ({
            id: it._id || it.id,
            productId: it.product?._id || it.product,
            productName: it.product?.name || '',
            productSku: it.product?.sku || '',
            quantityOrdered: it.quantityOrdered || 0,
            quantityReceived: it.quantityReceived || 0,
            unitCost: it.unitCost || 0,
          })),
        }));
        
        // Map and set deliveries
        const mappedDeliveries = (deliveriesList || []).map((d: any) => ({
          id: d._id || d.id,
          reference: d.reference,
          customer: d.customer,
          status: d.status || 'draft',
          date: d.scheduledDate || d.createdAt,
          totalQuantity: (d.items || []).reduce((sum: number, it: any) => sum + (it.quantityDemand || 0), 0),
          items: (d.items || []).map((it: any) => ({
            id: it._id || it.id,
            productId: it.product?._id || it.product,
            productName: it.product?.name || '',
            productSku: it.product?.sku || '',
            quantityDemand: it.quantityDemand || 0,
            quantityDone: it.quantityDone || 0,
          })),
        }));
        
        dispatch(setReceipts(mappedReceipts));
        dispatch(setDeliveries(mappedDeliveries));
      } catch (err) {
        console.error('Failed to fetch pending tasks:', err);
      }
    };
    
    fetchPendingTasks();
  }, [dispatch]);

  useEffect(() => {
    console.log('Dashboard stats updated:', stats);
    console.log('Loading:', isLoading, 'Error:', error);
  }, [stats, isLoading, error]);

  const lowStockProducts = products.filter(p => p.currentStock <= (p.minStock || 0));
  const recentMovements = movements.slice(0, 10);
  
  // Get pending tasks for staff
  const pendingReceipts = receipts.filter(r => ['waiting', 'ready'].includes(r.status));
  const pendingDeliveries = deliveries.filter(d => ['waiting', 'ready'].includes(d.status));
  const allPendingTasks = [...pendingReceipts, ...pendingDeliveries];

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
          value={stats?.totalProducts || 0}
          icon={Package}
          color="bg-blue-500"
          trend={{ value: 5, isPositive: true }}
        />
        <KPICard
          title="Low Stock Items"
          value={stats?.lowStockItems || 0}
          icon={AlertTriangle}
          color="bg-orange-500"
        />
        <KPICard
          title="Out of Stock"
          value={stats?.outOfStockItems || 0}
          icon={AlertTriangle}
          color="bg-red-500"
        />
        <KPICard
          title="Pending Receipts"
          value={stats?.pendingReceipts || 0}
          icon={ArrowDownToLine}
          color="bg-green-500"
        />
        <KPICard
          title="Pending Deliveries"
          value={stats?.pendingDeliveries || 0}
          icon={ArrowUpFromLine}
          color="bg-purple-500"
        />
        <KPICard
          title="Scheduled Transfers"
          value={stats?.scheduledTransfers || 0}
          icon={RotateCcw}
          color="bg-indigo-500"
        />
      </div>

      {/* Filters */}
      <FilterBar onFilterChange={(filters) => console.log(filters)} />

      {/* Pending Tasks Section - Only for Warehouse Staff */}
      {user?.role === 'warehouse_staff' && allPendingTasks.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Pending Tasks</h3>
            <div className="space-y-3">
              {allPendingTasks.map((task: any) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-3 ${task.supplier ? 'bg-green-100' : 'bg-purple-100'}`}>
                      {task.supplier ? (
                        <ArrowDownToLine className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowUpFromLine className="w-4 h-4 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {task.supplier ? `Receipt: ${task.supplier}` : `Delivery: ${task.customer}`}
                      </p>
                      <p className="text-sm text-gray-500">Ref: {task.reference}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{task.totalQuantity} items</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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