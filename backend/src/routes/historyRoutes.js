const express = require('express');
const MovementHistory = require('../models/MovementHistory');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// @desc    Get movement history
// @route   GET /api/history
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const {
      type,
      product,
      warehouse,
      dateFrom,
      dateTo,
      page = 1,
      limit = 50,
      sortBy = 'movementDate',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};

    if (type && type !== 'all') {
      query.type = type;
    }

    if (product) {
      query.product = product;
    }

    if (warehouse) {
      query.$or = [
        { fromWarehouse: warehouse },
        { toWarehouse: warehouse }
      ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.movementDate = {};
      if (dateFrom) {
        query.movementDate.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.movementDate.$lte = new Date(dateTo);
      }
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const movements = await MovementHistory.find(query)
      .populate('product', 'name sku unitOfMeasure')
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('createdBy', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MovementHistory.countDocuments(query);

    res.status(200).json({
      success: true,
      count: movements.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: movements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get movement history for specific product
// @route   GET /api/history/product/:productId
// @access  Private
router.get('/product/:productId', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const movements = await MovementHistory.find({ 
      product: req.params.productId 
    })
      .populate('product', 'name sku unitOfMeasure')
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('createdBy', 'name')
      .sort({ movementDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MovementHistory.countDocuments({ 
      product: req.params.productId 
    });

    res.status(200).json({
      success: true,
      count: movements.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: movements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get movement history statistics
// @route   GET /api/history/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    // Build date filter
    let dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.movementDate = {};
      if (dateFrom) {
        dateFilter.movementDate.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        dateFilter.movementDate.$lte = new Date(dateTo);
      }
    }

    // Get movement statistics
    const stats = await MovementHistory.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalQuantity: { $sum: { $abs: '$quantity' } }
        }
      }
    ]);

    // Get recent movements
    const recentMovements = await MovementHistory.find(dateFilter)
      .populate('product', 'name sku')
      .populate('createdBy', 'name')
      .sort({ movementDate: -1 })
      .limit(10);

    // Get top products by movement frequency
    const topProducts = await MovementHistory.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$product',
          movementCount: { $sum: 1 },
          totalQuantity: { $sum: { $abs: '$quantity' } }
        }
      },
      { $sort: { movementCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' }
    ]);

    res.status(200).json({
      success: true,
      data: {
        movementStats: stats,
        recentMovements,
        topProducts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;