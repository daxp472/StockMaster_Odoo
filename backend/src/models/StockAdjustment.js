const mongoose = require('mongoose');

const adjustmentItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true
  },
  currentStock: {
    type: Number,
    required: [true, 'Current stock is required'],
    min: [0, 'Current stock cannot be negative']
  },
  countedQuantity: {
    type: Number,
    required: [true, 'Counted quantity is required'],
    min: [0, 'Counted quantity cannot be negative']
  },
  difference: {
    type: Number,
    required: true
  }
});

const stockAdjustmentSchema = new mongoose.Schema({
  reference: {
    type: String,
    required: [true, 'Reference is required'],
    unique: true,
    uppercase: true
  },
  warehouse: {
    type: mongoose.Schema.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    enum: ['damaged', 'lost', 'found', 'expired', 'theft', 'counting_error', 'other'],
    default: 'counting_error'
  },
  reasonDescription: {
    type: String,
    maxlength: [500, 'Reason description cannot be more than 500 characters']
  },
  status: {
    type: String,
    enum: ['draft', 'done', 'canceled'],
    default: 'draft'
  },
  adjustmentDate: {
    type: Date,
    default: Date.now
  },
  items: [adjustmentItemSchema],
  totalAdjustment: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
stockAdjustmentSchema.index({ reference: 1 });
stockAdjustmentSchema.index({ status: 1 });
stockAdjustmentSchema.index({ warehouse: 1 });
stockAdjustmentSchema.index({ adjustmentDate: 1 });

// Auto-generate reference if not provided
stockAdjustmentSchema.pre('save', function(next) {
  if (!this.reference) {
    this.reference = `ADJ-${Date.now().toString().slice(-6)}`;
  }
  
  // Calculate differences and total adjustment
  this.items.forEach(item => {
    item.difference = item.countedQuantity - item.currentStock;
  });
  
  this.totalAdjustment = this.items.reduce((sum, item) => sum + Math.abs(item.difference), 0);
  
  next();
});

module.exports = mongoose.model('StockAdjustment', stockAdjustmentSchema);