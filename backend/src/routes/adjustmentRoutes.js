const express = require('express');
const StockAdjustment = require('../models/StockAdjustment');
const StockService = require('../services/stockService');
const { protect, managerOnly } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const { emitAdjustmentCreated } = require('../utils/socketEvents');

const router = express.Router();

// @desc    Get all stock adjustments
// @route   GET /api/adjustments
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const {
      status,
      warehouse,
      reason,
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

    if (reason && reason !== 'all') {
      query.reason = reason;
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const adjustments = await StockAdjustment.find(query)
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await StockAdjustment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: adjustments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: adjustments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get single stock adjustment
// @route   GET /api/adjustments/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const adjustment = await StockAdjustment.findById(req.params.id)
      .populate('warehouse', 'name code address')
      .populate('items.product', 'name sku unitOfMeasure currentStock')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!adjustment) {
      return res.status(404).json({
        success: false,
        message: 'Stock adjustment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: adjustment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Create new stock adjustment
// @route   POST /api/adjustments
// @access  Private (Manager only)
router.post('/', protect, managerOnly, validate('createAdjustment'), async (req, res) => {
  try {
    const adjustmentData = {
      ...req.body,
      createdBy: req.user._id
    };

    const adjustment = await StockAdjustment.create(adjustmentData);
    
    await adjustment.populate('warehouse', 'name code');
    await adjustment.populate('items.product', 'name sku unitOfMeasure');
    await adjustment.populate('createdBy', 'name');

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      emitAdjustmentCreated(io, adjustment);
    }

    res.status(201).json({
      success: true,
      message: 'Stock adjustment created successfully',
      data: adjustment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Process stock adjustment (apply changes)
// @route   POST /api/adjustments/:id/process
// @access  Private (Manager only)
router.post('/:id/process', protect, managerOnly, async (req, res) => {
  try {
    const adjustment = await StockAdjustment.findById(req.params.id)
      .populate('items.product')
      .populate('warehouse');

    if (!adjustment) {
      return res.status(404).json({
        success: false,
        message: 'Stock adjustment not found'
      });
    }

    if (adjustment.status === 'done') {
      return res.status(400).json({
        success: false,
        message: 'Stock adjustment already processed'
      });
    }

    const io = req.app.get('io');
    const stockUpdates = [];

    // Process each adjustment item
    for (const item of adjustment.items) {
      if (item.difference !== 0) {
        // Update stock with the difference
        const stockUpdate = await StockService.updateStock(
          item.product._id,
          item.difference,
          {
            type: 'adjustment',
            fromLocation: item.difference < 0 ? adjustment.location : null,
            toLocation: item.difference > 0 ? adjustment.location : null,
            fromWarehouse: item.difference < 0 ? adjustment.warehouse._id : null,
            toWarehouse: item.difference > 0 ? adjustment.warehouse._id : null,
            reference: adjustment.reference,
            relatedDocument: adjustment._id,
            relatedDocumentType: 'StockAdjustment',
            createdBy: req.user._id,
            notes: `${adjustment.reason}: ${adjustment.reasonDescription || 'Stock adjustment'}`
          },
          io
        );

        stockUpdates.push(stockUpdate);
      }
    }

    // Update adjustment status
    adjustment.status = 'done';
    adjustment.approvedBy = req.user._id;
    await adjustment.save();

    await adjustment.populate('warehouse', 'name code');
    await adjustment.populate('createdBy', 'name');
    await adjustment.populate('approvedBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Stock adjustment processed successfully',
      data: {
        adjustment,
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

// @desc    Cancel stock adjustment
// @route   POST /api/adjustments/:id/cancel
// @access  Private (Manager only)
router.post('/:id/cancel', protect, managerOnly, async (req, res) => {
  try {
    const adjustment = await StockAdjustment.findById(req.params.id);

    if (!adjustment) {
      return res.status(404).json({
        success: false,
        message: 'Stock adjustment not found'
      });
    }

    if (adjustment.status === 'done') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel processed adjustment'
      });
    }

    adjustment.status = 'canceled';
    await adjustment.save();

    res.status(200).json({
      success: true,
      message: 'Stock adjustment canceled successfully',
      data: adjustment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;