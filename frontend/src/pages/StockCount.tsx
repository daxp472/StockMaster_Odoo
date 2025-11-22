import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTypedSelector } from '../hooks/useTypedSelector';
import { AppDispatch } from '../store';
import { fetchProducts } from '../store/slices/productSlice';
import { Clipboard, Scan, Plus, Minus, Save, AlertCircle } from 'lucide-react';
import operationService from '../services/operationService';

interface CountItem {
  productId: string;
  productName: string;
  productSku: string;
  currentStock: number;
  countedQuantity: number;
  difference: number;
  unitOfMeasure: string;
}

export const StockCount: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useTypedSelector((state) => state.auth);
  const { products } = useTypedSelector((state) => state.products);
  
  const [countItems, setCountItems] = useState<CountItem[]>([]);
  const [barcodeScan, setBarcodeScan] = useState('');
  const [reason, setReason] = useState<'cycle_count' | 'damage' | 'loss' | 'found'>('cycle_count');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchProducts({}));
  }, [dispatch]);

  const addProductToCount = (productId: string) => {
    const product = (products || []).find((p: any) => p.id === productId);
    if (!product) return;

    // Check if already in count
    const existingIndex = countItems.findIndex(item => item.productId === productId);
    if (existingIndex >= 0) {
      // Just increment the counted quantity
      setCountItems(prev => {
        const newItems = [...prev];
        newItems[existingIndex].countedQuantity += 1;
        newItems[existingIndex].difference = newItems[existingIndex].countedQuantity - newItems[existingIndex].currentStock;
        return newItems;
      });
      return;
    }

    // Add new item
    const newItem: CountItem = {
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      currentStock: product.currentStock,
      countedQuantity: 0,
      difference: -product.currentStock,
      unitOfMeasure: product.unitOfMeasure
    };

    setCountItems(prev => [...prev, newItem]);
  };

  const handleBarcodeInput = (value: string) => {
    setBarcodeScan(value);
    
    // Find product by SKU
    const product = (products || []).find((p: any) => p.sku === value);
    if (product) {
      addProductToCount(product.id);
      setBarcodeScan('');
    }
  };

  const updateCountedQuantity = (productId: string, quantity: number) => {
    setCountItems(prev => 
      prev.map(item => {
        if (item.productId === productId) {
          const newQuantity = Math.max(0, quantity);
          return {
            ...item,
            countedQuantity: newQuantity,
            difference: newQuantity - item.currentStock
          };
        }
        return item;
      })
    );
  };

  const incrementCount = (productId: string) => {
    setCountItems(prev => 
      prev.map(item => {
        if (item.productId === productId) {
          const newQuantity = item.countedQuantity + 1;
          return {
            ...item,
            countedQuantity: newQuantity,
            difference: newQuantity - item.currentStock
          };
        }
        return item;
      })
    );
  };

  const decrementCount = (productId: string) => {
    setCountItems(prev => 
      prev.map(item => {
        if (item.productId === productId) {
          const newQuantity = Math.max(0, item.countedQuantity - 1);
          return {
            ...item,
            countedQuantity: newQuantity,
            difference: newQuantity - item.currentStock
          };
        }
        return item;
      })
    );
  };

  const removeItem = (productId: string) => {
    setCountItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleSubmitAdjustment = async () => {
    if (countItems.length === 0) {
      alert('Please add at least one product to count');
      return;
    }

    // Filter items with differences
    const itemsWithDifferences = countItems.filter(item => item.difference !== 0);
    
    if (itemsWithDifferences.length === 0) {
      alert('No stock differences found. All counts match current stock.');
      return;
    }

    try {
      setProcessing(true);

      // Prepare adjustment data
      const adjustmentData = {
        reason,
        notes: notes || `Stock count performed by ${user?.name}`,
        items: itemsWithDifferences.map(item => ({
          product: item.productId,
          quantityBefore: item.currentStock,
          quantityAfter: item.countedQuantity,
          difference: item.difference
        }))
      };

      await operationService.createAdjustment(adjustmentData);

      alert(`Stock adjustment created successfully! 
        ${itemsWithDifferences.length} items adjusted.`);
      
      // Reset form
      setCountItems([]);
      setNotes('');
      setReason('cycle_count');
      
      // Refresh products
      dispatch(fetchProducts({}));
    } catch (error: any) {
      alert('Error creating adjustment: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(false);
    }
  };

  const filteredProducts = (products || []).filter((p: any) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );  const totalDifferences = countItems.reduce((sum, item) => sum + Math.abs(item.difference), 0);
  const itemsWithVariance = countItems.filter(item => item.difference !== 0).length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Clipboard className="w-7 h-7 text-purple-600" />
          Stock Count
        </h1>
        <p className="text-gray-600 mt-1">Perform cycle counts and stock adjustments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Select Products</h2>
            
            {/* Barcode Scanner */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Scan className="w-4 h-4" />
                Scan Barcode (SKU)
              </label>
              <input
                type="text"
                value={barcodeScan}
                onChange={(e) => handleBarcodeInput(e.target.value)}
                placeholder="Scan or enter SKU"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Product Search */}
            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Product List */}
            <div className="max-h-[500px] overflow-y-auto space-y-1">
              {filteredProducts.map((product: any) => (
                <div
                  key={product.id}
                  onClick={() => addProductToCount(product.id)}
                  className="p-2 rounded border border-gray-200 hover:border-purple-300 cursor-pointer transition-all hover:bg-purple-50"
                >
                  <div className="font-medium text-sm">{product.name}</div>
                  <div className="text-xs text-gray-600">SKU: {product.sku}</div>
                  <div className="text-xs text-gray-500">
                    Current: {product.currentStock} {product.unitOfMeasure}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Count Sheet */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Count Sheet</h2>
              {itemsWithVariance > 0 && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  {itemsWithVariance} items with variance
                </span>
              )}
            </div>

            {/* Adjustment Settings */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Adjustment
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="cycle_count">Cycle Count</option>
                  <option value="damage">Damaged Goods</option>
                  <option value="loss">Lost/Stolen</option>
                  <option value="found">Found Items</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Count Items */}
            {countItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Clipboard className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Add products to start counting</p>
                <p className="text-sm mt-2">Scan barcodes or select from the list</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-6 max-h-[400px] overflow-y-auto">
                  {countItems.map(item => (
                    <div key={item.productId} className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.productName}</div>
                        <div className="text-xs text-gray-600">SKU: {item.productSku}</div>
                        <div className="text-xs text-gray-500">
                          Current Stock: {item.currentStock} {item.unitOfMeasure}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => decrementCount(item.productId)}
                          className="p-1 border border-gray-300 rounded hover:bg-gray-200"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        
                        <input
                          type="number"
                          min="0"
                          value={item.countedQuantity}
                          onChange={(e) => updateCountedQuantity(item.productId, parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                        
                        <button
                          onClick={() => incrementCount(item.productId)}
                          className="p-1 border border-gray-300 rounded hover:bg-gray-200"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="w-24 text-right">
                        {item.difference !== 0 && (
                          <div className={`text-sm font-medium ${item.difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.difference > 0 ? '+' : ''}{item.difference}
                          </div>
                        )}
                        {item.difference === 0 && (
                          <div className="text-sm text-gray-500">
                            ✓ Match
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="p-4 bg-blue-50 rounded-lg mb-6">
                  <div className="flex justify-between text-sm">
                    <span>Total Items Counted:</span>
                    <span className="font-semibold">{countItems.length}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>Items with Variance:</span>
                    <span className={`font-semibold ${itemsWithVariance > 0 ? 'text-yellow-700' : 'text-green-700'}`}>
                      {itemsWithVariance}
                    </span>
                  </div>
                  {totalDifferences > 0 && (
                    <div className="flex justify-between text-sm mt-1">
                      <span>Total Absolute Variance:</span>
                      <span className="font-semibold text-yellow-700">{totalDifferences} units</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitAdjustment}
                    disabled={processing || itemsWithVariance === 0}
                    className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {processing ? 'Submitting...' : 'Submit Adjustment'}
                  </button>
                  <button
                    onClick={() => setCountItems([])}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Clear All
                  </button>
                </div>

                {itemsWithVariance === 0 && countItems.length > 0 && (
                  <div className="mt-4 p-3 bg-green-50 rounded flex items-center gap-2 text-green-700">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm">All counts match current stock. No adjustment needed.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
