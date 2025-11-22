const express = require('express');
const Product = require('../models/Product');
const { protect, managerOnly } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');

const router = express.Router();

// @desc    Get all products
// @route   GET /api/products
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const {
      search,
      category,
      warehouse,
      stockStatus,
      page = 1,
      limit = 50,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    let query = { isActive: true };

    // Search by name or SKU
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by warehouse
    if (warehouse && warehouse !== 'all') {
      query.warehouse = warehouse;
    }

    // Filter by stock status
    if (stockStatus) {
      switch (stockStatus) {
        case 'out_of_stock':
          query.currentStock = 0;
          break;
        case 'low_stock':
          query.$expr = { $lte: ['$currentStock', '$minStock'] };
          query.currentStock = { $gt: 0 };
          break;
        case 'in_stock':
          query.$expr = { $gt: ['$currentStock', '$minStock'] };
          break;
      }
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .populate('warehouse', 'name code')
      .populate('createdBy', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('warehouse', 'name code address')
      .populate('createdBy', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Manager only)
router.post('/', protect, managerOnly, validate('createProduct'), async (req, res) => {
  try {
    const productData = {
      ...req.body,
      createdBy: req.user._id
    };

    const product = await Product.create(productData);
    
    await product.populate('warehouse', 'name code');
    await product.populate('createdBy', 'name');

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('product:created', {
        product,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Manager only)
router.put('/:id', protect, managerOnly, validate('updateProduct'), async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('warehouse', 'name code').populate('createdBy', 'name');

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('product:updated', {
        product,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Manager only)
router.delete('/:id', protect, managerOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Soft delete - set isActive to false
    product.isActive = false;
    await product.save();

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('product:deleted', {
        productId: product._id,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get product categories
// @route   GET /api/products/categories/list
// @access  Private
router.get('/categories/list', protect, async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    
    res.status(200).json({
      success: true,
      data: categories.sort()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get low stock products
// @route   GET /api/products/alerts/low-stock
// @access  Private
router.get('/alerts/low-stock', protect, async (req, res) => {
  try {
    const lowStockProducts = await Product.find({
      isActive: true,
      $expr: { $lte: ['$currentStock', '$minStock'] },
      currentStock: { $gt: 0 }
    }).populate('warehouse', 'name code');

    res.status(200).json({
      success: true,
      count: lowStockProducts.length,
      data: lowStockProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get out of stock products
// @route   GET /api/products/alerts/out-of-stock
// @access  Private
router.get('/alerts/out-of-stock', protect, async (req, res) => {
  try {
    const outOfStockProducts = await Product.find({
      isActive: true,
      currentStock: 0
    }).populate('warehouse', 'name code');

    res.status(200).json({
      success: true,
      count: outOfStockProducts.length,
      data: outOfStockProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;