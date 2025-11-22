const mongoose = require('mongoose');

const receiptItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true
  },
  quantityOrdered: {
    type: Number,
    required: [true, 'Quantity ordered is required'],
    min: [1, 'Quantity must be at least 1']
  },
  quantityReceived: {
    type: Number,
    default: 0,
    min: [0, 'Quantity received cannot be negative']
  },
  unitCost: {
    type: Number,
    default: 0,
    min: [0, 'Unit cost cannot be negative']
  }
});

const receiptSchema = new mongoose.Schema({
  reference: {
    type: String,
    required: [true, 'Reference is required'],
    unique: true,
    uppercase: true
  },
  supplier: {
    type: String,
    required: [true, 'Supplier is required'],
    trim: true,
    maxlength: [100, 'Supplier name cannot be more than 100 characters']
  },
  status: {
    type: String,
    enum: ['draft', 'waiting', 'ready', 'done', 'canceled'],
    default: 'draft'
  },
  expectedDate: {
    type: Date,
    required: [true, 'Expected date is required']
  },
  receivedDate: {
    type: Date
  },
  warehouse: {
    type: mongoose.Schema.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  items: [receiptItemSchema],
  totalQuantity: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  processedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
receiptSchema.index({ reference: 1 });
receiptSchema.index({ status: 1 });
receiptSchema.index({ warehouse: 1 });
receiptSchema.index({ expectedDate: 1 });

// Auto-generate reference if not provided
receiptSchema.pre('save', function(next) {
  if (!this.reference) {
    this.reference = `RCP-${Date.now().toString().slice(-6)}`;
  }
  
  // Calculate total quantity
  this.totalQuantity = this.items.reduce((sum, item) => sum + item.quantityOrdered, 0);
  
  next();
});

module.exports = mongoose.model('Receipt', receiptSchema);