const mongoose = require('mongoose');

const transferItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  }
});

const transferSchema = new mongoose.Schema({
  reference: {
    type: String,
    required: [true, 'Reference is required'],
    unique: true,
    uppercase: true
  },
  fromWarehouse: {
    type: mongoose.Schema.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  toWarehouse: {
    type: mongoose.Schema.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  fromLocation: {
    type: String,
    required: [true, 'From location is required']
  },
  toLocation: {
    type: String,
    required: [true, 'To location is required']
  },
  status: {
    type: String,
    enum: ['draft', 'waiting', 'ready', 'done', 'canceled'],
    default: 'draft'
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  completedDate: {
    type: Date
  },
  items: [transferItemSchema],
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
transferSchema.index({ reference: 1 });
transferSchema.index({ status: 1 });
transferSchema.index({ fromWarehouse: 1 });
transferSchema.index({ toWarehouse: 1 });

// Auto-generate reference if not provided
transferSchema.pre('save', function(next) {
  if (!this.reference) {
    this.reference = `TRF-${Date.now().toString().slice(-6)}`;
  }
  
  // Calculate total quantity
  this.totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
  
  next();
});

module.exports = mongoose.model('Transfer', transferSchema);