const emitToUser = (io, userId, event, data) => {
  io.to(`user_${userId}`).emit(event, data);
};

const emitToAll = (io, event, data) => {
  io.emit(event, data);
};

const emitStockUpdate = (io, productId, newStock) => {
  emitToAll(io, 'stock:update', {
    productId,
    newStock,
    timestamp: new Date().toISOString()
  });
};

const emitReceiptCreated = (io, receipt) => {
  emitToAll(io, 'receipt:created', {
    receipt,
    timestamp: new Date().toISOString()
  });
};

const emitDeliveryCreated = (io, delivery) => {
  emitToAll(io, 'delivery:created', {
    delivery,
    timestamp: new Date().toISOString()
  });
};

const emitTransferCreated = (io, transfer) => {
  emitToAll(io, 'transfer:created', {
    transfer,
    timestamp: new Date().toISOString()
  });
};

const emitAdjustmentCreated = (io, adjustment) => {
  emitToAll(io, 'adjustment:created', {
    adjustment,
    timestamp: new Date().toISOString()
  });
};

const emitTaskAssigned = (io, userId, task) => {
  emitToUser(io, userId, 'task:assigned', {
    task,
    timestamp: new Date().toISOString()
  });
};

const emitLowStockAlert = (io, product) => {
  emitToAll(io, 'stock:low_alert', {
    product,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  emitToUser,
  emitToAll,
  emitStockUpdate,
  emitReceiptCreated,
  emitDeliveryCreated,
  emitTransferCreated,
  emitAdjustmentCreated,
  emitTaskAssigned,
  emitLowStockAlert
};