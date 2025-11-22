import React, { useEffect, useState } from 'react';
import { useTypedSelector } from '../hooks/useTypedSelector';
import { History, Package, TrendingUp, TrendingDown, RotateCcw, Calendar, Filter } from 'lucide-react';
import operationService from '../services/operationService';

interface MovementHistory {
  _id: string;
  type: 'receipt' | 'delivery' | 'adjustment' | 'transfer';
  product: {
    _id: string;
    name: string;
    sku: string;
    unitOfMeasure: string;
  };
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  reference: string;
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  supplier?: string;
  customer?: string;
  notes?: string;
}

interface ActivityStats {
  receiptsProcessed: number;
  deliveriesProcessed: number;
  adjustmentsMade: number;
  totalMovements: number;
}

export const MyActivity: React.FC = () => {
  const { user } = useTypedSelector((state) => state.auth);
  
  const [movements, setMovements] = useState<MovementHistory[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    receiptsProcessed: 0,
    deliveriesProcessed: 0,
    adjustmentsMade: 0,
    totalMovements: 0
  });
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('week');

  useEffect(() => {
    fetchMyActivity();
  }, [filterType, dateFilter]);

  const fetchMyActivity = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      let startDate: Date | undefined;
      const now = new Date();
      
      if (dateFilter === 'today') {
        startDate = new Date(now.setHours(0, 0, 0, 0));
      } else if (dateFilter === 'week') {
        startDate = new Date(now.setDate(now.getDate() - 7));
      } else if (dateFilter === 'month') {
        startDate = new Date(now.setMonth(now.getMonth() - 1));
      }

      const response = await operationService.getMovementHistory({
        type: filterType === 'all' ? undefined : filterType,
        startDate: startDate?.toISOString(),
        limit: 100
      });

      const allMovements = response.data?.data || [];
      
      // Filter by current user
      const myMovements = allMovements.filter(
        (m: MovementHistory) => m.createdBy?._id === user?.id
      );

      setMovements(myMovements);

      // Calculate stats
      const statsData = {
        receiptsProcessed: myMovements.filter((m: MovementHistory) => m.type === 'receipt').length,
        deliveriesProcessed: myMovements.filter((m: MovementHistory) => m.type === 'delivery').length,
        adjustmentsMade: myMovements.filter((m: MovementHistory) => m.type === 'adjustment').length,
        totalMovements: myMovements.length
      };

      setStats(statsData);
    } catch (error: any) {
      console.error('Error fetching activity:', error);
      alert('Error fetching activity: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'receipt':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'delivery':
        return <TrendingDown className="w-5 h-5 text-blue-600" />;
      case 'adjustment':
        return <RotateCcw className="w-5 h-5 text-yellow-600" />;
      case 'transfer':
        return <Package className="w-5 h-5 text-purple-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'receipt':
        return 'bg-green-50 border-green-200';
      case 'delivery':
        return 'bg-blue-50 border-blue-200';
      case 'adjustment':
        return 'bg-yellow-50 border-yellow-200';
      case 'transfer':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatMovementDescription = (movement: MovementHistory) => {
    switch (movement.type) {
      case 'receipt':
        return `Received ${Math.abs(movement.quantity)} ${movement.product.unitOfMeasure} from ${movement.supplier || 'Supplier'}`;
      case 'delivery':
        return `Delivered ${Math.abs(movement.quantity)} ${movement.product.unitOfMeasure} to ${movement.customer || 'Customer'}`;
      case 'adjustment':
        return `Adjusted ${movement.quantity > 0 ? '+' : ''}${movement.quantity} ${movement.product.unitOfMeasure}`;
      case 'transfer':
        return `Transferred ${Math.abs(movement.quantity)} ${movement.product.unitOfMeasure} from ${movement.fromLocation} to ${movement.toLocation}`;
      default:
        return `Moved ${Math.abs(movement.quantity)} ${movement.product.unitOfMeasure}`;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <History className="w-7 h-7 text-purple-600" />
          My Activity
        </h1>
        <p className="text-gray-600 mt-1">Your stock movement history and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Movements</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMovements}</p>
            </div>
            <Package className="w-10 h-10 text-purple-200" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Receipts Processed</p>
              <p className="text-2xl font-bold text-green-600">{stats.receiptsProcessed}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-200" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Deliveries Picked</p>
              <p className="text-2xl font-bold text-blue-600">{stats.deliveriesProcessed}</p>
            </div>
            <TrendingDown className="w-10 h-10 text-blue-200" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Adjustments Made</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.adjustmentsMade}</p>
            </div>
            <RotateCcw className="w-10 h-10 text-yellow-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="receipt">Receipts</option>
            <option value="delivery">Deliveries</option>
            <option value="adjustment">Adjustments</option>
            <option value="transfer">Transfers</option>
          </select>

          <button
            onClick={fetchMyActivity}
            className="ml-auto px-4 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Activity Timeline</h2>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading activity...</div>
        ) : movements.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <History className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No activity found</p>
            <p className="text-sm mt-2">Your completed tasks will appear here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {movements.map((movement) => (
              <div
                key={movement._id}
                className={`flex items-start gap-4 p-4 rounded-lg border ${getMovementColor(movement.type)}`}
              >
                <div className="mt-1">
                  {getMovementIcon(movement.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="font-medium text-gray-900">{movement.product.name}</h3>
                      <p className="text-sm text-gray-600">{formatMovementDescription(movement)}</p>
                    </div>
                    <span className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-700 capitalize">
                      {movement.type}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                    <span className="font-mono">{movement.product.sku}</span>
                    <span>•</span>
                    <span>Ref: {movement.reference}</span>
                    <span>•</span>
                    <span>{new Date(movement.createdAt).toLocaleString()}</span>
                  </div>

                  {movement.notes && (
                    <div className="mt-2 text-xs text-gray-600 italic">
                      Note: {movement.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
