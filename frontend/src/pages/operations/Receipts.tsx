import React, { useEffect, useState } from 'react';
import { Plus, Eye, CreditCard as Edit, Check, Package } from 'lucide-react';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { useDispatch } from 'react-redux';
import { addReceipt, updateReceipt, setReceipts } from '../../store/slices/operationSlice';
import { fetchProducts } from '../../store/slices/productSlice';
import { AppDispatch } from '../../store';
import operationService from '../../services/operationService';
import warehouseService from '../../services/warehouseService';

export const Receipts: React.FC = () => {
  const { receipts } = useTypedSelector((state) => state.operations);
  const { products } = useTypedSelector((state) => state.products);
  const { user } = useTypedSelector((state) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const [showModal, setShowModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const isManager = user?.role === 'inventory_manager';

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
 
  const handleStatusChange = async (id: string, newStatus: 'draft' | 'waiting' | 'ready' | 'done' | 'canceled') => {
    try {
      if (newStatus === 'canceled') {
        await operationService.cancelReceipt(id);
        const fetchReceipts = async () => {
          const resp = await operationService.getReceipts();
          const list = (resp && resp.data) ? resp.data : resp;
          const mapped = (list || []).map((r: any) => {
            const totalQuantity = (r.items || []).reduce((sum: number, it: any) => sum + (it.quantityOrdered || 0), 0);
            return {
              id: r._id || r.id,
              reference: r.reference,
              supplier: r.supplier,
              status: r.status || 'draft',
              date: r.expectedDate || r.createdAt || new Date().toISOString(),
              totalQuantity,
              items: (r.items || []).map((it: any) => ({
                id: it._id || it.id || `${r._id || r.id}-${it.product?._id || it.product}`,
                productId: it.product?._id || it.product,
                productName: it.product?.name || (products.find(p => p.id === (it.product?._id || it.product))?.name || ''),
                productSku: it.product?.sku || (products.find(p => p.id === (it.product?._id || it.product))?.sku || ''),
                quantityOrdered: it.quantityOrdered || 0,
                quantityReceived: it.quantityReceived || 0,
                unitCost: it.unitCost || 0,
              })),
            };
          });
          dispatch(setReceipts(mapped));
        };
        fetchReceipts();
        return;
      }
      const updated = await operationService.updateReceipt(id, { status: newStatus } as any);
      const mapped = {
        id: updated.data?._id || updated._id,
        reference: updated.data?.reference || updated.reference,
        supplier: updated.data?.supplier?.name || updated.supplier,
        status: updated.data?.status || updated.status,
        date: updated.data?.expectedDate || updated.expectedDate,
        items: (updated.data?.items || updated.items || []).map((it: any) => ({
          id: it._id || `${id}-${it.product?._id || it.productId}`,
          productId: it.product?._id || it.productId,
          productName: it.product?.name || it.productName,
          productSku: it.product?.sku || it.productSku,
          quantityOrdered: it.quantityOrdered,
          quantityDone: it.quantityDone || 0,
          unitCost: it.unitCost,
        })),
        totalQuantity: (updated.data?.items || updated.items || []).reduce((sum: number, it: any) => sum + (it.quantityOrdered || 0), 0),
        notes: updated.data?.notes || updated.notes,
      };
      dispatch(updateReceipt(mapped as any));
    } catch (err) {
      console.error('Failed to update receipt status', err);
      alert('Failed to update receipt status');
    }
  };

  const handleProcessReceipt = async (receipt: any) => {
    try {
      // Process the receipt with all items at their ordered quantities
      const items = receipt.items.map((item: any) => ({
        productId: item.productId,
        quantityReceived: item.quantityOrdered
      }));
      
      await operationService.processReceipt(receipt.id, items);
      
      // Refresh the receipts list
      const resp = await operationService.getReceipts();
      const list = (resp && resp.data) ? resp.data : resp;
      const mapped = (list || []).map((r: any) => {
        const totalQuantity = (r.items || []).reduce((sum: number, it: any) => sum + (it.quantityOrdered || 0), 0);
        return {
          id: r._id || r.id,
          reference: r.reference,
          supplier: r.supplier,
          status: r.status || 'draft',
          date: r.expectedDate || r.createdAt || new Date().toISOString(),
          totalQuantity,
          items: (r.items || []).map((it: any) => ({
            id: it._id || it.id || `${r._id || r.id}-${it.product?._id || it.product}`,
            productId: it.product?._id || it.product,
            productName: it.product?.name || (products.find(p => p.id === (it.product?._id || it.product))?.name || ''),
            productSku: it.product?.sku || (products.find(p => p.id === (it.product?._id || it.product))?.sku || ''),
            quantityOrdered: it.quantityOrdered || 0,
            quantityReceived: it.quantityReceived || 0,
            unitCost: it.unitCost || 0,
          })),
        };
      });
      dispatch(setReceipts(mapped));
      
      // Refresh products to show updated stock
      dispatch(fetchProducts());
      
      alert('✅ Receipt processed successfully! Stock has been updated.');
    } catch (err: any) {
      console.error('Failed to process receipt', err);
      alert('Failed to process receipt: ' + (err.response?.data?.message || err.message));
    }
  };

  // Fetch receipts and products from backend
  useEffect(() => {
    dispatch(fetchProducts());
    
    const fetchReceipts = async () => {
      try {
        const resp = await operationService.getReceipts();
        const list = (resp && resp.data) ? resp.data : resp; // support both shapes

        const mapped = (list || []).map((r: any) => {
          const totalQuantity = (r.items || []).reduce((sum: number, it: any) => sum + (it.quantityOrdered || 0), 0);
          return {
            id: r._id || r.id,
            reference: r.reference,
            supplier: r.supplier,
            status: r.status || 'draft',
            date: r.expectedDate || r.createdAt || new Date().toISOString(),
            totalQuantity,
            items: (r.items || []).map((it: any) => ({
              id: it._id || it.id || `${r._id || r.id}-${it.product?._id || it.product}`,
              productId: it.product?._id || it.product,
              productName: it.product?.name || (products.find(p => p.id === (it.product?._id || it.product))?.name || ''),
              productSku: it.product?.sku || (products.find(p => p.id === (it.product?._id || it.product))?.sku || ''),
              quantityOrdered: it.quantityOrdered || 0,
              quantityReceived: it.quantityReceived || 0,
              unitCost: it.unitCost || 0,
            })),
          };
        });

        dispatch(setReceipts(mapped));
      } catch (error: any) {
        console.error('Failed to fetch receipts', error);
      }
    };
    fetchReceipts();
  }, [dispatch]); // FIXED: Removed 'products' dependency to prevent infinite loop

  const CreateReceiptModal = () => {
    const [formData, setFormData] = useState({
      supplier: '',
      reference: '',
      warehouse: '',
      date: new Date().toISOString().split('T')[0],
      items: [{ productId: '', quantityOrdered: 0, quantityReceived: 0, unitCost: 0 }]
    });

    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
      const fetchWarehouses = async () => {
        try {
          console.log('Fetching warehouses...');
          const response = await warehouseService.getWarehouses();
          console.log('Warehouse response:', response);
          console.log('Warehouse data:', response.data);
          const warehouseList = response.data?.data || [];
          console.log('Extracted warehouses:', warehouseList);
          setWarehouses(warehouseList);
        } catch (error: any) {
          console.error('Failed to load warehouses:', error);
          console.error('Error response:', error.response);
          alert('Failed to load warehouses. Please check console for details.');
        }
      };
      fetchWarehouses();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.warehouse) {
        alert('Please select a warehouse');
        return;
      }

      try {
        setSubmitting(true);
        const payload = {
          supplier: formData.supplier,
          reference: formData.reference || undefined,
          expectedDate: formData.date,
          warehouse: formData.warehouse,
          items: formData.items.map((item) => ({
            product: item.productId,
            quantityOrdered: item.quantityOrdered,
            unitCost: item.unitCost,
          })),
        };

        const response = await operationService.createReceipt(payload);
        const created = response?.data;

        if (!created) {
          throw new Error('No receipt returned from server');
        }

        // Map backend receipt to local UI shape
        const totalQuantity = (created.items || []).reduce((sum: number, it: any) => sum + (it.quantityOrdered || 0), 0);
        const mappedReceipt = {
          id: created._id || Date.now().toString(),
          supplier: created.supplier,
          reference: created.reference || `RCP-${(created._id || Date.now()).toString().slice(-6)}`,
          date: created.expectedDate || created.createdAt || formData.date,
          status: created.status || 'draft',
          totalQuantity,
          items: (created.items || []).map((it: any) => ({
            id: it._id || Date.now().toString(),
            productId: it.product?._id || it.product,
            productName: it.product?.name || (products.find(p => p.id === (it.product?._id || it.product))?.name || ''),
            productSku: it.product?.sku || (products.find(p => p.id === (it.product?._id || it.product))?.sku || ''),
            quantityOrdered: it.quantityOrdered || 0,
            quantityReceived: it.quantityReceived || 0,
            unitCost: it.unitCost || 0,
          })),
        } as const;

        dispatch(addReceipt(mappedReceipt));
        setShowModal(false);
        alert('Receipt created and stored successfully ✅');
      } catch (error: any) {
        alert('Error creating receipt: ' + (error.response?.data?.message || error.message));
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Receipt</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Supplier</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reference</label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="Auto-generated if empty"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Expected Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
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
                {warehouses.map((w: any) => (
                  <option key={w._id} value={w._id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Products</label>
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 mb-3 p-3 border border-gray-200 rounded-md">
                  <select
                    value={item.productId}
                    onChange={(e) => {
                      const newItems = [...formData.items];
                      newItems[index].productId = e.target.value;
                      setFormData({ ...formData, items: newItems });
                    }}
                    required
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select Product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Quantity Ordered"
                    value={item.quantityOrdered}
                    onChange={(e) => {
                      const newItems = [...formData.items];
                      newItems[index].quantityOrdered = parseInt(e.target.value) || 0;
                      setFormData({ ...formData, items: newItems });
                    }}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Unit Cost"
                    value={item.unitCost}
                    onChange={(e) => {
                      const newItems = [...formData.items];
                      newItems[index].unitCost = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, items: newItems });
                    }}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  items: [...formData.items, { productId: '', quantityOrdered: 0, quantityReceived: 0, unitCost: 0 }]
                })}
                className="text-purple-600 text-sm hover:text-purple-700"
              >
                + Add Product
              </button>
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
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Receipt'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Receipts (Incoming Stock)</h1>
        {isManager && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Receipt
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
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {receipts.map((receipt) => (
                <tr key={receipt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {receipt.reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {receipt.supplier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(receipt.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {receipt.totalQuantity} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {receipt.status === 'draft' ? (
                      <select
                        value={receipt.status}
                        onChange={(e) => handleStatusChange(receipt.id, e.target.value as any)}
                        className="text-xs px-2 py-1 border rounded-md"
                      >
                        <option value="draft">draft</option>
                        <option value="waiting">waiting</option>
                        <option value="ready">ready</option>
                        <option value="done">done</option>
                        <option value="canceled">canceled</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(receipt.status)}`}>
                        {receipt.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedReceipt(receipt)}
                        className="text-indigo-600 hover:text-indigo-900 p-1"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {(receipt.status === 'ready' || receipt.status === 'waiting') && (
                        <button
                          onClick={() => handleProcessReceipt(receipt)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Process Receipt (Update Stock)"
                        >
                          <Package className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <CreateReceiptModal />}

      {/* Receipt Details Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Receipt Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Reference:</span>
                  <p className="text-sm text-gray-900">{selectedReceipt.reference}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Supplier:</span>
                  <p className="text-sm text-gray-900">{selectedReceipt.supplier}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Date:</span>
                  <p className="text-sm text-gray-900">{new Date(selectedReceipt.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Status:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedReceipt.status)}`}>
                    {selectedReceipt.status}
                  </span>
                </div>
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-2">Items</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ordered</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Received</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Unit Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReceipt.items.map((item: any) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm">{item.productName}</td>
                          <td className="px-4 py-2 text-sm">{item.quantityOrdered}</td>
                          <td className="px-4 py-2 text-sm">{item.quantityReceived}</td>
                          <td className="px-4 py-2 text-sm">${item.unitCost}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};