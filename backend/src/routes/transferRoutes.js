const express = require('express');
const Transfer = require('../models/Transfer');
const StockService = require('../services/stockService');
const { protect } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const { emitTransferCreated } = require('../utils/socketEvents');

const router = express.Router();

// @desc    Get all transfers
// @route   GET /api/transfers
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const {
      status,
      fromWarehouse,
      toWarehouse,
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

    if (fromWarehouse && fromWarehouse !== 'all') {
      query.fromWarehouse = fromWarehouse;
    }

    if (toWarehouse && toWarehouse !== 'all') {
      query.toWarehouse = toWarehouse;
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const transfers = await Transfer.find(query)
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure currentStock')
      .populate('createdBy', 'name')
      .populate('processedBy', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transfer.countDocuments(query);

    res.status(200).json({
      success: true,
      count: transfers.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: transfers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get single transfer
// @route   GET /api/transfers/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate('fromWarehouse', 'name code address')
      .populate('toWarehouse', 'name code address')
      .populate('items.product', 'name sku unitOfMeasure currentStock')
      .populate('createdBy', 'name email')
      .populate('processedBy', 'name email');

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transfer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Create new transfer
// @route   POST /api/transfers
// @access  Private
router.post('/', protect, validate('createTransfer'), async (req, res) => {
  try {
    const { fromWarehouse, toWarehouse } = req.body;

    // Validate that from and to warehouses are different
    if (fromWarehouse === toWarehouse) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination warehouses must be different'
      });
    }

    const transferData = {
      ...req.body,
      createdBy: req.user._id
    };

    const transfer = await Transfer.create(transferData);
    
    await transfer.populate('fromWarehouse', 'name code');
    await transfer.populate('toWarehouse', 'name code');
    await transfer.populate('items.product', 'name sku unitOfMeasure currentStock');
    await transfer.populate('createdBy', 'name');

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      emitTransferCreated(io, transfer);
    }

    res.status(201).json({
      success: true,
      message: 'Transfer created successfully',
      data: transfer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update transfer
// @route   PUT /api/transfers/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let transfer = await Transfer.findById(req.params.id);

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    // Only allow updates if status is draft or waiting
    if (!['draft', 'waiting'].includes(transfer.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update transfer in current status'
      });
    }

    transfer = await Transfer.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('fromWarehouse', 'name code')
     .populate('toWarehouse', 'name code')
     .populate('items.product', 'name sku unitOfMeasure currentStock')
     .populate('createdBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Transfer updated successfully',
      data: transfer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Process transfer (move items)
// @route   POST /api/transfers/:id/process
// @access  Private
router.post('/:id/process', protect, async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate('items.product')
      .populate('fromWarehouse')
      .populate('toWarehouse');

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    if (transfer.status === 'done') {
      return res.status(400).json({
        success: false,
        message: 'Transfer already processed'
      });
    }

    const io = req.app.get('io');
    const stockUpdates = [];

    // Process each item - Note: For transfers, we just log the movement
    // In a real system, you might need to handle location-based stock
    for (const item of transfer.items) {
      // Create movement history for the transfer
      const stockUpdate = await StockService.updateStock(
        item.product._id,
        0, // No net change in total stock for internal transfers
        {
          type: 'transfer',
          fromLocation: transfer.fromLocation,
          toLocation: transfer.toLocation,
          fromWarehouse: transfer.fromWarehouse._id,
          toWarehouse: transfer.toWarehouse._id,
          reference: transfer.reference,
          relatedDocument: transfer._id,
          relatedDocumentType: 'Transfer',
          createdBy: req.user._id,
          notes: `Transferred ${item.quantity} units from ${transfer.fromLocation} to ${transfer.toLocation}`
        },
        io
      );

      stockUpdates.push(stockUpdate);
    }

    // Update transfer status
    transfer.status = 'done';
    transfer.completedDate = new Date();
    transfer.processedBy = req.user._id;
    await transfer.save();

    await transfer.populate('fromWarehouse', 'name code');
    await transfer.populate('toWarehouse', 'name code');
    await transfer.populate('createdBy', 'name');
    await transfer.populate('processedBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Transfer processed successfully',
      data: {
        transfer,
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

// @desc    Cancel transfer
// @route   POST /api/transfers/:id/cancel
// @access  Private
router.post('/:id/cancel', protect, async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    if (transfer.status === 'done') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel processed transfer'
      });
    }

    transfer.status = 'canceled';
    await transfer.save();

    res.status(200).json({
      success: true,
      message: 'Transfer canceled successfully',
      data: transfer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;