import React, { useEffect, useState } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { fetchProducts } from '../../store/slices/productSlice';
import operationService from '../../services/operationService';
import warehouseService from '../../services/warehouseService';

export const Adjustments: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { products } = useTypedSelector((state) => state.products);
  const { user } = useTypedSelector((state) => state.auth);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const isManager = user?.role === 'inventory_manager';

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    items: [
      {
        productId: '',
        currentStock: 0,
        countedQuantity: 0,
      },
    ],
    reason: 'counting_error',
    reasonDescription: '',
    warehouse: '',
    location: '',
  });

  useEffect(() => {
    // Fetch products when component mounts
    dispatch(fetchProducts({}));
    
    const fetchAdjustments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await operationService.getAdjustments({ page: 1, limit: 50 });
        const list = (response.data || []).map((adj: any) => ({
          id: adj._id,
          reference: adj.reference,
          warehouse: adj.warehouse?.name || '—',
          location: adj.location || '—',
          reason: adj.reason,
          itemsCount: adj.items?.length || 0,
          totalAdjustment: adj.totalAdjustment || 0,
          status: adj.status,
          date: adj.adjustmentDate || adj.createdAt,
          notes: adj.reasonDescription || '',
          items: adj.items || [],
        }));
        setAdjustments(list);
      } catch (err: any) {
        setError(err.message || 'Failed to load adjustments');
      } finally {
        setLoading(false);
      }
    };
    
    const fetchWarehouses = async () => {
      try {
        const resp = await warehouseService.getWarehouses();
        const data = resp?.data?.data || resp?.data || [];
        setWarehouses(data);
      } catch (e) {
        console.error('Failed to fetch warehouses:', e);
      }
    };
    
    fetchAdjustments();
    fetchWarehouses();
  }, [dispatch]);

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setFormData(prev => {
        const items = [...prev.items];
        items[index] = {
          ...items[index],
          productId,
          currentStock: product.currentStock,
        };
        return { ...prev, items };
      });
    }
  };

  const addProductRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', currentStock: 0, countedQuantity: 0 }]
    }));
  };

  const removeProductRow = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      // Validate warehouse as ObjectId string
      const wh = warehouses.find((w: any) => (w._id || w.id) === formData.warehouse);
      const warehouseId = wh?._id || wh?.id || formData.warehouse;

      // Prepare items (filter out empty rows)
      const items = formData.items
        .filter(it => it.productId)
        .map(it => {
          const product = products.find(p => p.id === it.productId);
          const currentStock = product ? product.currentStock : it.currentStock || 0;
          const countedQuantity = it.countedQuantity || 0;
          return {
            product: it.productId,
            currentStock,
            countedQuantity,
          };
        });

      if (!warehouseId || !formData.location || items.length === 0) {
        setError('Please select warehouse, location, and at least one product row');
        setLoading(false);
        return;
      }

      const payload = {
        warehouse: warehouseId,
        location: formData.location,
        reason: formData.reason,
        reasonDescription: formData.reasonDescription || undefined,
        items,
      };

      const created = await operationService.createAdjustment(payload);
      const createdId = created?.data?._id || created?._id;
      if (createdId) {
        await operationService.processAdjustment(createdId, []);
      }

      // Refresh adjustments and products
      const response = await operationService.getAdjustments({ page: 1, limit: 50 });
      const list = (response.data || []).map((adj: any) => ({
        id: adj._id,
        reference: adj.reference,
        productName: adj.items?.[0]?.product?.name || '—',
        productSku: adj.items?.[0]?.product?.sku || '—',
        quantity: adj.items?.[0]?.difference ?? 0,
        date: adj.adjustmentDate || adj.createdAt,
        notes: adj.reasonDescription || adj.reason,
      }));
      setAdjustments(list);
      dispatch(fetchProducts({}));

      setShowModal(false);
      setFormData({
        items: [
          { productId: '', currentStock: 0, countedQuantity: 0 },
        ],
        reason: 'counting_error',
        reasonDescription: '',
        warehouse: '',
        location: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create adjustment');
    } finally {
      setLoading(false);
    }
  };

  const CreateAdjustmentModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create Stock Adjustment</h3>
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Products Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Products to Adjust</label>
              <button
                type="button"
                onClick={addProductRow}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                + Add Product
              </button>
            </div>
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Product</label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        required
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">-- Select Product --</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.sku}) - Stock: {product.currentStock}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Current</label>
                        <input
                          type="number"
                          value={item.currentStock}
                          readOnly
                          className="block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Counted</label>
                        <input
                          type="number"
                          value={item.countedQuantity}
                          onChange={(e) => setFormData(prev => {
                            const items = [...prev.items];
                            items[index] = {
                              ...items[index],
                              countedQuantity: parseInt(e.target.value) || 0,
                            };
                            return { ...prev, items };
                          })}
                          required
                          min="0"
                          className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Difference</label>
                        <input
                          type="text"
                          value={item.countedQuantity - item.currentStock}
                          readOnly
                          className={`block w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-bold ${
                            item.countedQuantity - item.currentStock > 0 ? 'text-green-600' :
                            item.countedQuantity - item.currentStock < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}
                        />
                      </div>
                    </div>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProductRow(index)}
                        className="text-xs text-red-600 hover:text-red-700 text-left"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Warehouse</label>
            <select
              value={formData.warehouse}
              onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select Warehouse</option>
              {(warehouses as any[]).map((w: any) => (
                <option key={w._id || w.id} value={w._id || w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., Aisle 3 - Shelf B"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Reason</label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value as any })}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="counting_error">Counting Error</option>
              <option value="damaged">Damaged</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
              <option value="expired">Expired</option>
              <option value="theft">Theft</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.reasonDescription}
              onChange={(e) => setFormData({ ...formData, reasonDescription: e.target.value })}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Explain the reason for this adjustment..."
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-60"
            >
              {loading ? 'Applying...' : 'Apply Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Adjustments</h1>
        {isManager && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Adjustment
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warehouse / Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center text-sm text-gray-600">Loading adjustments...</td>
                </tr>
              ) : adjustments.length > 0 ? (
                adjustments.map((adjustment) => (
                  <tr key={adjustment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono font-medium text-gray-900">{adjustment.reference}</div>
                      {adjustment.notes && (
                        <div className="text-xs text-gray-500 mt-1">{adjustment.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{adjustment.warehouse}</div>
                      <div className="text-xs text-gray-500">{adjustment.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{adjustment.itemsCount} product(s)</div>
                      <div className="text-xs text-gray-500">
                        Total: <span className={`font-bold ${
                          adjustment.totalAdjustment > 0 ? 'text-green-600' : 
                          adjustment.totalAdjustment < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {adjustment.totalAdjustment}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700 capitalize">
                        {adjustment.reason.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        adjustment.status === 'done' ? 'bg-green-100 text-green-800' :
                        adjustment.status === 'canceled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {adjustment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(adjustment.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <RotateCcw className="w-12 h-12 text-gray-300 mb-4" />
                      <h3 className="text-sm font-medium text-gray-900 mb-1">No adjustments found</h3>
                      <p className="text-sm text-gray-500">Create your first inventory adjustment to get started.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <CreateAdjustmentModal />}
    </div>
  );
};