const Joi = require('joi');

// Validation schemas
const schemas = {
  // User validation
  registerUser: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('inventory_manager', 'warehouse_staff').default('warehouse_staff')
  }),

  loginUser: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  requestOTP: Joi.object({
    email: Joi.string().email().required()
  }),

  verifyOTP: Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required()
  }),

  resetPassword: Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required(),
    newPassword: Joi.string().min(6).required()
  }),

  // Product validation
  createProduct: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    sku: Joi.string().min(2).max(50).required(),
    category: Joi.string().min(2).max(50).required(),
    unitOfMeasure: Joi.string().valid('pcs', 'kg', 'ltr', 'm', 'box', 'pack').required(),
    currentStock: Joi.number().min(0).default(0),
    minStock: Joi.number().min(0).default(0),
    maxStock: Joi.number().min(0).default(1000),
    cost: Joi.number().min(0).default(0),
    location: Joi.string().required(),
    warehouse: Joi.string().required(),
    description: Joi.string().max(500).optional()
  }),

  updateProduct: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    sku: Joi.string().min(2).max(50).optional(),
    category: Joi.string().min(2).max(50).optional(),
    unitOfMeasure: Joi.string().valid('pcs', 'kg', 'ltr', 'm', 'box', 'pack').optional(),
    currentStock: Joi.number().min(0).optional(),
    minStock: Joi.number().min(0).optional(),
    maxStock: Joi.number().min(0).optional(),
    cost: Joi.number().min(0).optional(),
    location: Joi.string().optional(),
    warehouse: Joi.string().optional(),
    description: Joi.string().max(500).optional(),
    isActive: Joi.boolean().optional()
  }),

  // Warehouse validation
  createWarehouse: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    code: Joi.string().min(2).max(20).required(),
    address: Joi.string().min(5).max(500).required()
  }),

  // Receipt validation
  createReceipt: Joi.object({
    supplier: Joi.string().min(2).max(100).required(),
    reference: Joi.string().optional(),
    expectedDate: Joi.date().required(),
    warehouse: Joi.string().required(),
    items: Joi.array().items(
      Joi.object({
        product: Joi.string().required(),
        quantityOrdered: Joi.number().min(1).required(),
        unitCost: Joi.number().min(0).default(0)
      })
    ).min(1).required(),
    notes: Joi.string().max(500).optional()
  }),

  // Delivery validation
  createDelivery: Joi.object({
    customer: Joi.string().min(2).max(100).required(),
    reference: Joi.string().optional(),
    scheduledDate: Joi.date().required(),
    warehouse: Joi.string().required(),
    items: Joi.array().items(
      Joi.object({
        product: Joi.string().required(),
        quantityDemand: Joi.number().min(1).required()
      })
    ).min(1).required(),
    notes: Joi.string().max(500).optional()
  }),

  // Transfer validation
  createTransfer: Joi.object({
    fromWarehouse: Joi.string().required(),
    toWarehouse: Joi.string().required(),
    fromLocation: Joi.string().required(),
    toLocation: Joi.string().required(),
    scheduledDate: Joi.date().required(),
    items: Joi.array().items(
      Joi.object({
        product: Joi.string().required(),
        quantity: Joi.number().min(1).required()
      })
    ).min(1).required(),
    notes: Joi.string().max(500).optional()
  }),

  // Stock Adjustment validation
  createAdjustment: Joi.object({
    warehouse: Joi.string().required(),
    location: Joi.string().required(),
    reason: Joi.string().valid('damaged', 'lost', 'found', 'expired', 'theft', 'counting_error', 'other').required(),
    reasonDescription: Joi.string().max(500).optional(),
    items: Joi.array().items(
      Joi.object({
        product: Joi.string().required(),
        currentStock: Joi.number().min(0).required(),
        countedQuantity: Joi.number().min(0).required()
      })
    ).min(1).required()
  })
};

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schemas[schema].validate(req.body);
    
    if (error) {
      const message = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: `Validation Error: ${message}`
      });
    }
    
    next();
  };
};

module.exports = { validate, schemas };