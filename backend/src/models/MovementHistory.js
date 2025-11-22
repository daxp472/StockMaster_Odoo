const mongoose = require('mongoose');

const movementHistorySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['receipt', 'delivery', 'transfer', 'adjustment'],
    required: [true, 'Movement type is required']
  },
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required']
  },
  fromLocation: {
    type: String
  },
  toLocation: {
    type: String
  },
  fromWarehouse: {
    type: mongoose.Schema.ObjectId,
    ref: 'Warehouse'
  },
  toWarehouse: {
    type: mongoose.Schema.ObjectId,
    ref: 'Warehouse'
  },
  reference: {
    type: String,
    required: [true, 'Reference is required']
  },
  relatedDocument: {
    type: mongoose.Schema.ObjectId,
    required: true
  },
  relatedDocumentType: {
    type: String,
    enum: ['Receipt', 'Delivery', 'Transfer', 'StockAdjustment'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'waiting', 'ready', 'done', 'canceled'],
    default: 'done'
  },
  movementDate: {
    type: Date,
    default: Date.now
  },
  supplier: {
    type: String
  },
  customer: {
    type: String
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
movementHistorySchema.index({ type: 1 });
movementHistorySchema.index({ product: 1 });
movementHistorySchema.index({ movementDate: -1 });
movementHistorySchema.index({ reference: 1 });
movementHistorySchema.index({ createdBy: 1 });

module.exports = mongoose.model('MovementHistory', movementHistorySchema);