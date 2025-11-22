import React, { useEffect, useState } from 'react';
import { Package, CheckCircle, XCircle, AlertCircle, Scan } from 'lucide-react';
import operationService from '../services/operationService';

interface ReceiptItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    sku: string;
    unitOfMeasure: string;
  };
  quantityOrdered: number;
  quantityReceived: number;
}

interface Receipt {
  _id: string;
  reference: string;
  supplier: string;
  status: string;
  scheduledDate: string;
  items: ReceiptItem[];
  notes?: string;
}

export const QuickReceive: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [receivingQuantities, setReceivingQuantities] = useState<Record<string, number>>({});
  const [barcodeScan, setBarcodeScan] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingReceipts();
  }, []);

  const fetchPendingReceipts = async () => {
    try {
      setLoading(true);
      const response = await operationService.getReceipts({
        status: 'waiting'
      });
      setReceipts(response.data?.data || []);
    } catch (error: any) {
      alert('Error fetching receipts: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    // Initialize quantities
    const quantities: Record<string, number> = {};
    receipt.items.forEach(item => {
      quantities[item.product._id] = item.quantityOrdered;
    });
    setReceivingQuantities(quantities);
  };

  const handleQuantityChange = (productId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setReceivingQuantities(prev => ({
      ...prev,
      [productId]: numValue
    }));
  };

  const handleBarcodeInput = (value: string) => {
    setBarcodeScan(value);
    if (!selectedReceipt) return;

    // Find product by SKU
    const item = selectedReceipt.items.find(i => i.product.sku === value);
    if (item) {
      setReceivingQuantities(prev => ({
        ...prev,
        [item.product._id]: (prev[item.product._id] || 0) + 1
      }));
      setBarcodeScan('');
    }
  };

  const handleProcessReceipt = async () => {
    if (!selectedReceipt) return;

    try {
      setProcessing(true);

      // Prepare items for processing
      const items = Object.entries(receivingQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([productId, quantity]) => ({
          productId,
          quantityReceived: quantity
        }));

      if (items.length === 0) {
        alert('Please enter at least one quantity to receive');
        return;
      }

      await operationService.processReceipt(selectedReceipt._id, items);

      alert('Receipt processed successfully! ✅');
      
      // Reset and refresh
      setSelectedReceipt(null);
      setReceivingQuantities({});
      fetchPendingReceipts();
    } catch (error: any) {
      alert('Error processing receipt: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-7 h-7 text-purple-600" />
          Quick Receive
        </h1>
        <p className="text-gray-600 mt-1">Process incoming stock receipts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pending Receipts List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Pending Receipts ({receipts.length})</h2>
            
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : receipts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No pending receipts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {receipts.map(receipt => (
                  <div
                    key={receipt._id}
                    onClick={() => handleSelectReceipt(receipt)}
                    className={`p-3 rounded border cursor-pointer transition-all ${
                      selectedReceipt?._id === receipt._id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{receipt.reference}</div>
                    <div className="text-xs text-gray-600">{receipt.supplier}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {receipt.items.length} items • {new Date(receipt.scheduledDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Receipt Processing */}
        <div className="lg:col-span-2">
          {selectedReceipt ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold">{selectedReceipt.reference}</h2>
                  <p className="text-gray-600">Supplier: {selectedReceipt.supplier}</p>
                  <p className="text-sm text-gray-500">
                    Scheduled: {new Date(selectedReceipt.scheduledDate).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  {selectedReceipt.status}
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

              {/* Items to Receive */}
              <div className="space-y-3 mb-6">
                <h3 className="font-semibold text-gray-900">Items to Receive</h3>
                {selectedReceipt.items.map(item => (
                  <div key={item._id} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.product.name}</div>
                      <div className="text-xs text-gray-600">SKU: {item.product.sku}</div>
                      <div className="text-xs text-gray-500">
                        Ordered: {item.quantityOrdered} {item.product.unitOfMeasure}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={receivingQuantities[item.product._id] || 0}
                        onChange={(e) => handleQuantityChange(item.product._id, e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                      />
                      <span className="text-sm text-gray-600">{item.product.unitOfMeasure}</span>
                    </div>
                    {receivingQuantities[item.product._id] === item.quantityOrdered ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : receivingQuantities[item.product._id] > item.quantityOrdered ? (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                ))}
              </div>

              {/* Notes */}
              {selectedReceipt.notes && (
                <div className="mb-6 p-3 bg-blue-50 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Notes:</strong> {selectedReceipt.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleProcessReceipt}
                  disabled={processing}
                  className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {processing ? 'Processing...' : 'Complete Receipt'}
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Select a receipt from the list to start receiving</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
