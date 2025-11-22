import React, { useEffect, useState } from 'react';
import { Plus, Eye, Check, Package } from 'lucide-react';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { useDispatch } from 'react-redux';
import { addDelivery, updateDelivery, setDeliveries } from '../../store/slices/operationSlice';
import { fetchProducts } from '../../store/slices/productSlice';
import { AppDispatch } from '../../store';
import operationService from '../../services/operationService';
import warehouseService from '../../services/warehouseService';

export const Deliveries: React.FC = () => {
  const { deliveries } = useTypedSelector((state) => state.operations);
  const { products } = useTypedSelector((state) => state.products);
  const { user } = useTypedSelector((state) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const [showModal, setShowModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
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
        await operationService.cancelDelivery(id);
        const fetchDeliveries = async () => {
          const resp = await operationService.getDeliveries();
          const list = (resp && resp.data) ? resp.data : resp;
          const mapped = (list || []).map((d: any) => {
            const totalQuantity = (d.items || []).reduce((sum: number, it: any) => sum + (it.quantityDemand || 0), 0);
            return {
              id: d._id || d.id,
              reference: d.reference,
              customer: d.customer,
              status: d.status || 'draft',
              date: d.scheduledDate || d.createdAt || new Date().toISOString(),
              totalQuantity,
              items: (d.items || []).map((it: any) => ({
                id: it._id || it.id || `${d._id || d.id}-${it.product?._id || it.product}`,
                productId: it.product?._id || it.product,
                productName: it.product?.name || (products.find(p => p.id === (it.product?._id || it.product))?.name || ''),
                productSku: it.product?.sku || (products.find(p => p.id === (it.product?._id || it.product))?.sku || ''),
                quantityDemand: it.quantityDemand || 0,
                quantityDone: it.quantityDone || 0,
              })),
            };
          });
          dispatch(setDeliveries(mapped));
        };
        fetchDeliveries();
        return;
      }
      const updated = await operationService.updateDelivery(id, { status: newStatus } as any);
      const mapped = {
        id: updated.data?._id || updated._id,
        reference: updated.data?.reference || updated.reference,
        customer: updated.data?.customer?.name || updated.customer,
        status: updated.data?.status || updated.status,
        date: updated.data?.scheduledDate || updated.scheduledDate,
        items: (updated.data?.items || updated.items || []).map((it: any) => ({
          id: it._id || `${id}-${it.product?._id || it.productId}`,
          productId: it.product?._id || it.productId,
          productName: it.product?.name || it.productName,
          productSku: it.product?.sku || it.productSku,
          quantityDemand: it.quantityDemand,
          quantityDone: it.quantityDone || 0,
        })),
        totalQuantity: (updated.data?.items || updated.items || []).reduce((sum: number, it: any) => sum + (it.quantityDemand || 0), 0),
        notes: updated.data?.notes || updated.notes,
      };
      dispatch(updateDelivery(mapped as any));
    } catch (err: any) {
      console.error('Failed to update delivery status', err);
      alert('Failed to update delivery status: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleProcessDelivery = async (delivery: any) => {
    try {
      // Process the delivery with all items at their demanded quantities
      const items = delivery.items.map((item: any) => ({
        productId: item.productId,
        quantityDone: item.quantityDemand
      }));
      
      await operationService.processDelivery(delivery.id, items);
      
      // Refresh the deliveries list
      const resp = await operationService.getDeliveries();
      const list = (resp && resp.data) ? resp.data : resp;
      const mapped = (list || []).map((d: any) => {
        const totalQuantity = (d.items || []).reduce((sum: number, it: any) => sum + (it.quantityDemand || 0), 0);
        return {
          id: d._id || d.id,
          reference: d.reference,
          customer: d.customer,
          status: d.status || 'draft',
          date: d.scheduledDate || d.createdAt || new Date().toISOString(),
          totalQuantity,
          items: (d.items || []).map((it: any) => ({
            id: it._id || it.id || `${d._id || d.id}-${it.product?._id || it.product}`,
            productId: it.product?._id || it.product,
            productName: it.product?.name || (products.find(p => p.id === (it.product?._id || it.product))?.name || ''),
            productSku: it.product?.sku || (products.find(p => p.id === (it.product?._id || it.product))?.sku || ''),
            quantityDemand: it.quantityDemand || 0,
            quantityDone: it.quantityDone || 0,
          })),
        };
      });
      dispatch(setDeliveries(mapped));
      
      // Refresh products to show updated stock
      dispatch(fetchProducts());
      
      alert('✅ Delivery processed successfully! Stock has been updated.');
    } catch (err: any) {
      console.error('Failed to process delivery', err);
      alert('Failed to process delivery: ' + (err.response?.data?.message || err.message));
    }
  };

  // Fetch deliveries and products from backend
  useEffect(() => {
    dispatch(fetchProducts());
    
    const fetchDeliveries = async () => {
      try {
        const resp = await operationService.getDeliveries();
        const list = (resp && resp.data) ? resp.data : resp;

        const mapped = (list || []).map((d: any) => {
          const totalQuantity = (d.items || []).reduce((sum: number, it: any) => sum + (it.quantityDemand || 0), 0);
          return {
            id: d._id || d.id,
            reference: d.reference,
            customer: d.customer,
            status: d.status || 'draft',
            date: d.scheduledDate || d.createdAt || new Date().toISOString(),
            totalQuantity,
            items: (d.items || []).map((it: any) => ({
              id: it._id || it.id || `${d._id || d.id}-${it.product?._id || it.product}`,
              productId: it.product?._id || it.product,
              productName: it.product?.name || (products.find(p => p.id === (it.product?._id || it.product))?.name || ''),
              productSku: it.product?.sku || (products.find(p => p.id === (it.product?._id || it.product))?.sku || ''),
              quantityDemand: it.quantityDemand || 0,
              quantityDone: it.quantityDone || 0,
            })),
          };
        });

        dispatch(setDeliveries(mapped));
      } catch (error: any) {
        console.error('Failed to fetch deliveries', error);
      }
    };
    fetchDeliveries();
  }, [dispatch]); // FIXED: Removed 'products' dependency to prevent infinite loop

  const CreateDeliveryModal = () => {
    const [formData, setFormData] = useState({
      customer: '',
      reference: '',
      warehouse: '',
      date: new Date().toISOString().split('T')[0],
      items: [{ productId: '', quantityDemand: 0, quantityDone: 0 }]
    });

    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
      const fetchWarehouses = async () => {
        try {
          const response = await warehouseService.getWarehouses();
          setWarehouses(response.data?.data || []);
        } catch (error: any) {
          console.error('Failed to load warehouses', error);
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
          customer: formData.customer,
          reference: formData.reference || undefined,
          scheduledDate: formData.date,
          warehouse: formData.warehouse,
          items: formData.items.map((item) => ({
            product: item.productId,
            quantityDemand: item.quantityDemand,
          })),
        };

        const response = await operationService.createDelivery(payload);
        const created = response?.data;

        if (!created) {
          throw new Error('No delivery returned from server');
        }

        // Map backend delivery to local UI shape
        const totalQuantity = (created.items || []).reduce((sum: number, it: any) => sum + (it.quantityDemand || 0), 0);
        const mappedDelivery = {
          id: created._id || Date.now().toString(),
          customer: created.customer,
          reference: created.reference || `DEL-${(created._id || Date.now()).toString().slice(-6)}`,
          date: created.scheduledDate || created.createdAt || formData.date,
          status: created.status || 'draft',
          totalQuantity,
          items: (created.items || []).map((it: any) => ({
            id: it._id || Date.now().toString(),
            productId: it.product?._id || it.product,
            productName: it.product?.name || (products.find(p => p.id === (it.product?._id || it.product))?.name || ''),
            productSku: it.product?.sku || (products.find(p => p.id === (it.product?._id || it.product))?.sku || ''),
            quantityDemand: it.quantityDemand || 0,
            quantityDone: it.quantityDone || 0,
          })),
        } as const;

        dispatch(addDelivery(mappedDelivery));
        setShowModal(false);
        alert('Delivery created and stored successfully ✅');
      } catch (error: any) {
        alert('Error creating delivery: ' + (error.response?.data?.message || error.message));
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Delivery Order</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer</label>
                <input
                  type="text"
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700">Delivery Date</label>
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
                <div key={index} className="grid grid-cols-2 gap-4 mb-3 p-3 border border-gray-200 rounded-md">
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
                    {products
                      .filter(product => product.currentStock > 0)
                      .map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku}) - Stock: {product.currentStock}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Quantity to Deliver"
                    value={item.quantityDemand}
                    onChange={(e) => {
                      const newItems = [...formData.items];
                      newItems[index].quantityDemand = parseInt(e.target.value) || 0;
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
                  items: [...formData.items, { productId: '', quantityDemand: 0, quantityDone: 0 }]
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
                {submitting ? 'Creating...' : 'Create Delivery'}
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
        <h1 className="text-2xl font-bold text-gray-900">Delivery Orders (Outgoing Stock)</h1>
        {isManager && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Delivery
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
                  Customer
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
              {deliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {delivery.reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {delivery.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(delivery.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {delivery.totalQuantity} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {delivery.status === 'draft' ? (
                      <select
                        value={delivery.status}
                        onChange={(e) => handleStatusChange(delivery.id, e.target.value as any)}
                        className="text-xs px-2 py-1 border rounded-md"
                      >
                        <option value="draft">draft</option>
                        <option value="waiting">waiting</option>
                        <option value="ready">ready</option>
                        <option value="done">done</option>
                        <option value="canceled">canceled</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(delivery.status)}`}>
                        {delivery.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedDelivery(delivery)}
                        className="text-indigo-600 hover:text-indigo-900 p-1"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {(delivery.status === 'ready' || delivery.status === 'waiting') && (
                        <button
                          onClick={() => handleProcessDelivery(delivery)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Process Delivery (Update Stock)"
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

      {showModal && <CreateDeliveryModal />}

      {/* Delivery Details Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Order Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Reference:</span>
                  <p className="text-sm text-gray-900">{selectedDelivery.reference}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Customer:</span>
                  <p className="text-sm text-gray-900">{selectedDelivery.customer}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Date:</span>
                  <p className="text-sm text-gray-900">{new Date(selectedDelivery.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Status:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedDelivery.status)}`}>
                    {selectedDelivery.status}
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
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Demanded</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Done</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDelivery.items.map((item: any) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm">{item.productName}</td>
                          <td className="px-4 py-2 text-sm">{item.quantityDemand}</td>
                          <td className="px-4 py-2 text-sm">{item.quantityDone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedDelivery(null)}
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