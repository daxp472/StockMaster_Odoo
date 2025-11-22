const express = require('express');
const Warehouse = require('../models/Warehouse');
const { protect, managerOnly } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');

const router = express.Router();

// @desc    Get all warehouses
// @route   GET /api/warehouses
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { isActive } = req.query;
    
    let query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const warehouses = await Warehouse.find(query)
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: warehouses.length,
      data: warehouses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get single warehouse
// @route   GET /api/warehouses/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    res.status(200).json({
      success: true,
      data: warehouse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Create new warehouse
// @route   POST /api/warehouses
// @access  Private (Manager only)
router.post('/', protect, managerOnly, validate('createWarehouse'), async (req, res) => {
  try {
    const warehouseData = {
      ...req.body,
      createdBy: req.user._id
    };

    const warehouse = await Warehouse.create(warehouseData);
    
    await warehouse.populate('createdBy', 'name email');

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('warehouse:created', {
        warehouse,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Warehouse created successfully',
      data: warehouse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update warehouse
// @route   PUT /api/warehouses/:id
// @access  Private (Manager only)
router.put('/:id', protect, managerOnly, async (req, res) => {
  try {
    let warehouse = await Warehouse.findById(req.params.id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    warehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('createdBy', 'name email');

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('warehouse:updated', {
        warehouse,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Warehouse updated successfully',
      data: warehouse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Delete warehouse
// @route   DELETE /api/warehouses/:id
// @access  Private (Manager only)
router.delete('/:id', protect, managerOnly, async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    // Soft delete - set isActive to false
    warehouse.isActive = false;
    await warehouse.save();

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('warehouse:deleted', {
        warehouseId: warehouse._id,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Warehouse deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;