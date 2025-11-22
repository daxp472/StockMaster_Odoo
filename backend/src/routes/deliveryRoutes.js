const express = require('express');
const Delivery = require('../models/Delivery');
const StockService = require('../services/stockService');
const { protect } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const { emitDeliveryCreated } = require('../utils/socketEvents');

const router = express.Router();

// @desc    Get all deliveries
// @route   GET /api/deliveries
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const {
      status,
      warehouse,
      customer,
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

    if (customer) {
      query.customer = { $regex: customer, $options: 'i' };
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const deliveries = await Delivery.find(query)
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure currentStock')
      .populate('createdBy', 'name')
      .populate('processedBy', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Delivery.countDocuments(query);

    res.status(200).json({
      success: true,
      count: deliveries.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: deliveries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get single delivery
// @route   GET /api/deliveries/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('warehouse', 'name code address')
      .populate('items.product', 'name sku unitOfMeasure currentStock')
      .populate('createdBy', 'name email')
      .populate('processedBy', 'name email');

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    res.status(200).json({
      success: true,
      data: delivery
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Create new delivery
// @route   POST /api/deliveries
// @access  Private
router.post('/', protect, validate('createDelivery'), async (req, res) => {
  try {
    const deliveryData = {
      ...req.body,
      createdBy: req.user._id
    };

    const delivery = await Delivery.create(deliveryData);
    
    await delivery.populate('warehouse', 'name code');
    await delivery.populate('items.product', 'name sku unitOfMeasure currentStock');
    await delivery.populate('createdBy', 'name');

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      emitDeliveryCreated(io, delivery);
    }

    res.status(201).json({
      success: true,
      message: 'Delivery created successfully',
      data: delivery
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update delivery
// @route   PUT /api/deliveries/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    // Only allow updates if status is draft or waiting
    if (!['draft', 'waiting'].includes(delivery.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update delivery in current status'
      });
    }

    delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('warehouse', 'name code')
     .populate('items.product', 'name sku unitOfMeasure currentStock')
     .populate('createdBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Delivery updated successfully',
      data: delivery
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Process delivery (ship items)
// @route   POST /api/deliveries/:id/process
// @access  Private
router.post('/:id/process', protect, async (req, res) => {
  try {
    const { items } = req.body; // Array of { productId, quantityDone }

    const delivery = await Delivery.findById(req.params.id)
      .populate('items.product')
      .populate('warehouse');

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    if (delivery.status === 'done') {
      return res.status(400).json({
        success: false,
        message: 'Delivery already processed'
      });
    }

    const io = req.app.get('io');
    const stockUpdates = [];

    // Process each item
    for (const item of items) {
      const deliveryItem = delivery.items.find(di => 
        di.product._id.toString() === item.productId
      );

      if (!deliveryItem) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productId} not found in delivery`
        });
      }

      if (item.quantityDone > 0) {
        // Update stock (negative quantity for outgoing)
        const stockUpdate = await StockService.updateStock(
          item.productId,
          -item.quantityDone, // Negative for outgoing
          {
            type: 'delivery',
            fromLocation: delivery.warehouse.name || 'Warehouse',
            toLocation: null,
            fromWarehouse: delivery.warehouse._id,
            toWarehouse: null,
            reference: delivery.reference,
            relatedDocument: delivery._id,
            relatedDocumentType: 'Delivery',
            customer: delivery.customer,
            createdBy: req.user._id
          },
          io
        );

        stockUpdates.push(stockUpdate);

        // Update delivery item
        deliveryItem.quantityDone = item.quantityDone;
      }
    }

    // Update delivery status
    delivery.status = 'done';
    delivery.deliveredDate = new Date();
    delivery.processedBy = req.user._id;
    await delivery.save();

    await delivery.populate('warehouse', 'name code');
    await delivery.populate('createdBy', 'name');
    await delivery.populate('processedBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Delivery processed successfully',
      data: {
        delivery,
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

// @desc    Cancel delivery
// @route   POST /api/deliveries/:id/cancel
// @access  Private
router.post('/:id/cancel', protect, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    if (delivery.status === 'done') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel processed delivery'
      });
    }

    delivery.status = 'canceled';
    await delivery.save();

    res.status(200).json({
      success: true,
      message: 'Delivery canceled successfully',
      data: delivery
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;