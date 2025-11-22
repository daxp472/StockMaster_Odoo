const express = require('express');
const Receipt = require('../models/Receipt');
const StockService = require('../services/stockService');
const { protect } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const { emitReceiptCreated } = require('../utils/socketEvents');

const router = express.Router();

// @desc    Get all receipts
// @route   GET /api/receipts
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const {
      status,
      warehouse,
      supplier,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (warehouse && warehouse !== 'all') {
      query.warehouse = warehouse;
    }

    if (supplier) {
      query.supplier = { $regex: supplier, $options: 'i' };
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const receipts = await Receipt.find(query)
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure')
      .populate('createdBy', 'name')
      .populate('processedBy', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Receipt.countDocuments(query);

    res.status(200).json({
      success: true,
      count: receipts.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: receipts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get single receipt
// @route   GET /api/receipts/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('warehouse', 'name code address')
      .populate('items.product', 'name sku unitOfMeasure currentStock')
      .populate('createdBy', 'name email')
      .populate('processedBy', 'name email');

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    res.status(200).json({
      success: true,
      data: receipt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Create new receipt
// @route   POST /api/receipts
// @access  Private
router.post('/', protect, validate('createReceipt'), async (req, res) => {
  try {
    const receiptData = {
      ...req.body,
      createdBy: req.user._id
    };

    const receipt = await Receipt.create(receiptData);
    
    await receipt.populate('warehouse', 'name code');
    await receipt.populate('items.product', 'name sku unitOfMeasure');
    await receipt.populate('createdBy', 'name');

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      emitReceiptCreated(io, receipt);
    }

    res.status(201).json({
      success: true,
      message: 'Receipt created successfully',
      data: receipt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update receipt
// @route   PUT /api/receipts/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let receipt = await Receipt.findById(req.params.id);

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    // Only allow updates if status is draft or waiting
    if (!['draft', 'waiting'].includes(receipt.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update receipt in current status'
      });
    }

    receipt = await Receipt.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('warehouse', 'name code')
     .populate('items.product', 'name sku unitOfMeasure')
     .populate('createdBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Receipt updated successfully',
      data: receipt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Process receipt (receive items)
// @route   POST /api/receipts/:id/process
// @access  Private
router.post('/:id/process', protect, async (req, res) => {
  try {
    const { items } = req.body; // Array of { productId, quantityReceived }

    const receipt = await Receipt.findById(req.params.id)
      .populate('items.product');

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    if (receipt.status === 'done') {
      return res.status(400).json({
        success: false,
        message: 'Receipt already processed'
      });
    }

    const io = req.app.get('io');
    const stockUpdates = [];

    // Process each item
    for (const item of items) {
      const receiptItem = receipt.items.find(ri => 
        ri.product._id.toString() === item.productId
      );

      if (!receiptItem) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productId} not found in receipt`
        });
      }

      if (item.quantityReceived > 0) {
        // Update stock
        const stockUpdate = await StockService.updateStock(
          item.productId,
          item.quantityReceived,
          {
            type: 'receipt',
            fromLocation: null,
            toLocation: receipt.warehouse.name || 'Warehouse',
            fromWarehouse: null,
            toWarehouse: receipt.warehouse._id,
            reference: receipt.reference,
            relatedDocument: receipt._id,
            relatedDocumentType: 'Receipt',
            supplier: receipt.supplier,
            createdBy: req.user._id
          },
          io
        );

        stockUpdates.push(stockUpdate);

        // Update receipt item
        receiptItem.quantityReceived = item.quantityReceived;
      }
    }

    // Update receipt status
    receipt.status = 'done';
    receipt.receivedDate = new Date();
    receipt.processedBy = req.user._id;
    await receipt.save();

    await receipt.populate('warehouse', 'name code');
    await receipt.populate('createdBy', 'name');
    await receipt.populate('processedBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Receipt processed successfully',
      data: {
        receipt,
        stockUpdates
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Cancel receipt
// @route   POST /api/receipts/:id/cancel
// @access  Private
router.post('/:id/cancel', protect, async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    if (receipt.status === 'done') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel processed receipt'
      });
    }

    receipt.status = 'canceled';
    await receipt.save();

    res.status(200).json({
      success: true,
      message: 'Receipt canceled successfully',
      data: receipt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;