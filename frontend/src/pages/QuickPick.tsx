import React, { useEffect, useState } from 'react';
import { ShoppingCart, CheckCircle, XCircle, AlertCircle, Scan, Package } from 'lucide-react';
import operationService from '../services/operationService';

interface DeliveryItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    sku: string;
    unitOfMeasure: string;
    currentStock: number;
  };
  quantityDemand: number;
  quantityDone: number;
}

interface Delivery {
  _id: string;
  reference: string;
  customer: string;
  status: string;
  scheduledDate: string;
  items: DeliveryItem[];
  notes?: string;
}

export const QuickPick: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [pickingQuantities, setPickingQuantities] = useState<Record<string, number>>({});
  const [barcodeScan, setBarcodeScan] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingDeliveries();
  }, []);

  const fetchPendingDeliveries = async () => {
    try {
      setLoading(true);
      const response = await operationService.getDeliveries({
        status: 'waiting'
      });
      setDeliveries(response.data?.data || []);
    } catch (error: any) {
      alert('Error fetching deliveries: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDelivery = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    // Initialize quantities
    const quantities: Record<string, number> = {};
    delivery.items.forEach(item => {
      quantities[item.product._id] = item.quantityDemand;
    });
    setPickingQuantities(quantities);
  };

  const handleQuantityChange = (productId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setPickingQuantities(prev => ({
      ...prev,
      [productId]: numValue
    }));
  };

  const handleBarcodeInput = (value: string) => {
    setBarcodeScan(value);
    if (!selectedDelivery) return;

    // Find product by SKU
    const item = selectedDelivery.items.find(i => i.product.sku === value);
    if (item) {
      setPickingQuantities(prev => ({
        ...prev,
        [item.product._id]: (prev[item.product._id] || 0) + 1
      }));
      setBarcodeScan('');
    }
  };

  const handleProcessDelivery = async () => {
    if (!selectedDelivery) return;

    try {
      setProcessing(true);

      // Prepare items for processing
      const items = Object.entries(pickingQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([productId, quantity]) => ({
          productId,
          quantityDone: quantity
        }));

      if (items.length === 0) {
        alert('Please enter at least one quantity to pick');
        return;
      }

      // Check if any quantity exceeds available stock
      for (const [productId, qty] of Object.entries(pickingQuantities)) {
        const item = selectedDelivery.items.find(i => i.product._id === productId);
        if (item && qty > item.product.currentStock) {
          alert(`Insufficient stock for ${item.product.name}. Available: ${item.product.currentStock}`);
          return;
        }
      }

      await operationService.processDelivery(selectedDelivery._id, items);

      alert('Delivery picked and processed successfully! ✅');
      
      // Reset and refresh
      setSelectedDelivery(null);
      setPickingQuantities({});
      fetchPendingDeliveries();
    } catch (error: any) {
      alert('Error processing delivery: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingCart className="w-7 h-7 text-purple-600" />
          Quick Pick
        </h1>
        <p className="text-gray-600 mt-1">Pick items for outgoing deliveries</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pending Deliveries List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Pending Deliveries ({deliveries.length})</h2>
            
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : deliveries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No pending deliveries</p>
              </div>
            ) : (
              <div className="space-y-2">
                {deliveries.map(delivery => (
                  <div
                    key={delivery._id}
                    onClick={() => handleSelectDelivery(delivery)}
                    className={`p-3 rounded border cursor-pointer transition-all ${
                      selectedDelivery?._id === delivery._id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{delivery.reference}</div>
                    <div className="text-xs text-gray-600">{delivery.customer}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {delivery.items.length} items • {new Date(delivery.scheduledDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Delivery Processing */}
        <div className="lg:col-span-2">
          {selectedDelivery ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold">{selectedDelivery.reference}</h2>
                  <p className="text-gray-600">Customer: {selectedDelivery.customer}</p>
                  <p className="text-sm text-gray-500">
                    Scheduled: {new Date(selectedDelivery.scheduledDate).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  {selectedDelivery.status}
                </span>
              </div>

              {/* Barcode Scanner Input */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Scan className="w-4 h-4" />
                  Scan Barcode (SKU)
                </label>
                <input
                  type="text"
                  value={barcodeScan}
                  onChange={(e) => handleBarcodeInput(e.target.value)}
                  placeholder="Scan or enter product SKU"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Items to Pick */}
              <div className="space-y-3 mb-6">
                <h3 className="font-semibold text-gray-900">Items to Pick</h3>
                {selectedDelivery.items.map(item => {
                  const pickedQty = pickingQuantities[item.product._id] || 0;
                  const isComplete = pickedQty === item.quantityDemand;
                  const isExcess = pickedQty > item.quantityDemand;
                  const insufficientStock = pickedQty > item.product.currentStock;

                  return (
                    <div key={item._id} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.product.name}</div>
                        <div className="text-xs text-gray-600">SKU: {item.product.sku}</div>
                        <div className="text-xs text-gray-500">
                          Demand: {item.quantityDemand} {item.product.unitOfMeasure}
                        </div>
                        <div className={`text-xs ${item.product.currentStock < item.quantityDemand ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          Available Stock: {item.product.currentStock} {item.product.unitOfMeasure}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max={item.product.currentStock}
                          value={pickedQty}
                          onChange={(e) => handleQuantityChange(item.product._id, e.target.value)}
                          className={`w-20 px-2 py-1 border rounded text-center ${
                            insufficientStock ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        <span className="text-sm text-gray-600">{item.product.unitOfMeasure}</span>
                      </div>
                      {insufficientStock ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : isComplete ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : isExcess ? (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Notes */}
              {selectedDelivery.notes && (
                <div className="mb-6 p-3 bg-blue-50 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Notes:</strong> {selectedDelivery.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleProcessDelivery}
                  disabled={processing}
                  className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {processing ? 'Processing...' : 'Complete Picking'}
                </button>
                <button
                  onClick={() => setSelectedDelivery(null)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Select a delivery from the list to start picking</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
