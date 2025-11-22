const express = require('express');
const Product = require('../models/Product');
const Receipt = require('../models/Receipt');
const Delivery = require('../models/Delivery');
const Transfer = require('../models/Transfer');
const MovementHistory = require('../models/MovementHistory');
const StockService = require('../services/stockService');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    // Get stock levels
    const stockStats = await StockService.getStockLevels();

    // Get pending operations
    const pendingReceipts = await Receipt.countDocuments({ 
      status: { $in: ['draft', 'waiting', 'ready'] } 
    });

    const pendingDeliveries = await Delivery.countDocuments({ 
      status: { $in: ['draft', 'waiting', 'ready'] } 
    });

    const scheduledTransfers = await Transfer.countDocuments({ 
      status: { $in: ['draft', 'waiting', 'ready'] } 
    });

    // Get today's movements
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayMovements = await MovementHistory.countDocuments({
      movementDate: { $gte: today, $lt: tomorrow }
    });

    // Get recent movements
    const recentMovements = await MovementHistory.find()
      .populate('product', 'name sku')
      .populate('createdBy', 'name')
      .sort({ movementDate: -1 })
      .limit(10);

    // Get low stock products
    const lowStockProducts = await StockService.getLowStockProducts();

    // Get out of stock products
    const outOfStockProducts = await StockService.getOutOfStockProducts();

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalProducts: stockStats.totalProducts,
          inStock: stockStats.inStock,
          lowStockItems: stockStats.lowStock,
          outOfStockItems: stockStats.outOfStock,
          pendingReceipts,
          pendingDeliveries,
          scheduledTransfers,
          todayMovements
        },
        recentMovements,
        lowStockProducts: lowStockProducts.slice(0, 5), // Top 5
        outOfStockProducts: outOfStockProducts.slice(0, 5) // Top 5
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get warehouse staff dashboard stats
// @route   GET /api/dashboard/staff-stats
// @access  Private (Staff only)
router.get('/staff-stats', protect, async (req, res) => {
  try {
    // Get pending tasks for the current user
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get receipts to process
    const receiptsToProcess = await Receipt.countDocuments({
      status: { $in: ['waiting', 'ready'] }
    });

    // Get deliveries to pick
    const deliveriesToPick = await Delivery.countDocuments({
      status: { $in: ['waiting', 'ready'] }
    });

    // Get transfers pending
    const transfersPending = await Transfer.countDocuments({
      status: { $in: ['waiting', 'ready'] }
    });

    // Get today's completed tasks (movements created by this user today)
    const completedToday = await MovementHistory.countDocuments({
      createdBy: req.user._id,
      movementDate: { $gte: today, $lt: tomorrow }
    });

    // Get recent activities for this user
    const myRecentActivities = await MovementHistory.find({
      createdBy: req.user._id
    })
      .populate('product', 'name sku')
      .sort({ movementDate: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          receiptsToProcess,
          deliveriesToPick,
          transfersPending,
          completedToday,
          pendingTasks: receiptsToProcess + deliveriesToPick + transfersPending
        },
        myRecentActivities
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get inventory trends
// @route   GET /api/dashboard/trends
// @access  Private
router.get('/trends', protect, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // Get movement trends
    const movementTrends = await MovementHistory.aggregate([
      {
        $match: {
          movementDate: { $gte: daysAgo }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$movementDate' } },
            type: '$type'
          },
          count: { $sum: 1 },
          totalQuantity: { $sum: { $abs: '$quantity' } }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // Get category-wise stock distribution
    const categoryDistribution = await Product.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$category',
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$currentStock' },
          lowStockCount: {
            $sum: {
              $cond: [{ $lte: ['$currentStock', '$minStock'] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { totalProducts: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        movementTrends,
        categoryDistribution
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Search products for quick actions
// @route   GET /api/dashboard/search
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const products = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } }
      ]
    })
      .populate('warehouse', 'name code')
      .select('name sku currentStock minStock unitOfMeasure warehouse')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;