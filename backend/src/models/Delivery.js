const mongoose = require('mongoose');

const deliveryItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true
  },
  quantityDemand: {
    type: Number,
    required: [true, 'Quantity demand is required'],
    min: [1, 'Quantity must be at least 1']
  },
  quantityDone: {
    type: Number,
    default: 0,
    min: [0, 'Quantity done cannot be negative']
  }
});

const deliverySchema = new mongoose.Schema({
  reference: {
    type: String,
    required: [true, 'Reference is required'],
    unique: true,
    uppercase: true
  },
  customer: {
    type: String,
    required: [true, 'Customer is required'],
    trim: true,
    maxlength: [100, 'Customer name cannot be more than 100 characters']
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
  deliveredDate: {
    type: Date
  },
  warehouse: {
    type: mongoose.Schema.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  items: [deliveryItemSchema],
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
deliverySchema.index({ reference: 1 });
deliverySchema.index({ status: 1 });
deliverySchema.index({ warehouse: 1 });
deliverySchema.index({ scheduledDate: 1 });

// Auto-generate reference if not provided
deliverySchema.pre('save', function(next) {
  if (!this.reference) {
    this.reference = `DEL-${Date.now().toString().slice(-6)}`;
  }
  
  // Calculate total quantity
  this.totalQuantity = this.items.reduce((sum, item) => sum + item.quantityDemand, 0);
  
  next();
});

module.exports = mongoose.model('Delivery', deliverySchema);