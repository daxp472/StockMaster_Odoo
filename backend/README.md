# StockMaster Backend

A complete, production-ready Inventory Management System backend built with Node.js, Express, MongoDB, and Socket.io.

## 🚀 Features

### ✅ Authentication & Authorization
- JWT-based authentication
- Role-based access control (Manager, Staff)
- OTP-based password reset
- Secure password hashing with bcrypt

### ✅ Core Modules
- **Products**: Complete CRUD with search, filtering, and categorization
- **Warehouses**: Multi-warehouse support
- **Receipts**: Incoming stock management
- **Deliveries**: Outgoing stock management
- **Transfers**: Internal stock movements
- **Stock Adjustments**: Manual stock corrections (Manager only)
- **Movement History**: Complete audit trail

### ✅ Real-time Features
- Socket.io integration for live updates
- Real-time stock updates
- Live notifications for low stock alerts
- Instant updates for all operations

### ✅ Advanced Features
- Automatic stock level management
- Low stock and out-of-stock alerts
- Comprehensive dashboard statistics
- Movement history and analytics
- Search and filtering capabilities
- Pagination for large datasets

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **Real-time**: Socket.io
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Joi
- **Email**: Nodemailer
- **Password Hashing**: bcryptjs

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/             # Route handlers (logic in routes)
│   ├── models/                  # Mongoose schemas
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Warehouse.js
│   │   ├── Receipt.js
│   │   ├── Delivery.js
│   │   ├── Transfer.js
│   │   ├── StockAdjustment.js
│   │   └── MovementHistory.js
│   ├── routes/                  # API routes
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── warehouseRoutes.js
│   │   ├── receiptRoutes.js
│   │   ├── deliveryRoutes.js
│   │   ├── transferRoutes.js
│   │   ├── adjustmentRoutes.js
│   │   ├── historyRoutes.js
│   │   └── dashboardRoutes.js
│   ├── middlewares/
│   │   ├── auth.js              # Authentication & authorization
│   │   ├── errorHandler.js      # Global error handling
│   │   └── validation.js        # Request validation
│   ├── services/
│   │   └── stockService.js      # Stock management logic
│   ├── utils/
│   │   ├── generateToken.js     # JWT token generation
│   │   ├── sendEmail.js         # Email service
│   │   ├── socketEvents.js      # Socket.io events
│   │   └── seedData.js          # Database seeding
│   └── server.js                # Main server file
├── package.json
├── .env                         # Environment variables
├── .gitignore
└── README.md
```

## 🚀 Quick Start

### 1. Installation

```bash
cd backend
npm install
```

### 2. Environment Setup

Create a `.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/stockmaster

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_secure
JWT_EXPIRE=7d

# Email Configuration (for OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@stockmaster.com

# Frontend URL
FRONTEND_URL=http://localhost:5173

# OTP Configuration
OTP_EXPIRE_MINUTES=5
```

### 3. Database Setup

Make sure MongoDB is running, then seed the database:

```bash
npm run seed
```

### 4. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 🔐 Default Login Credentials

After seeding the database:

- **Manager**: `manager@stockmaster.com` / `password123`
- **Staff 1**: `staff1@stockmaster.com` / `password123`
- **Staff 2**: `staff2@stockmaster.com` / `password123`

## 📚 API Documentation

### Authentication Endpoints

```
POST /api/auth/login              # User login
POST /api/auth/register           # Create staff (Manager only)
POST /api/auth/request-otp        # Request password reset OTP
POST /api/auth/verify-otp         # Verify OTP
POST /api/auth/reset-password     # Reset password
GET  /api/auth/me                 # Get current user
GET  /api/auth/staff              # Get all staff (Manager only)
PUT  /api/auth/staff/:id/status   # Update staff status (Manager only)
```

### Product Endpoints

```
GET    /api/products              # Get all products
GET    /api/products/:id          # Get single product
POST   /api/products              # Create product (Manager only)
PUT    /api/products/:id          # Update product (Manager only)
DELETE /api/products/:id          # Delete product (Manager only)
GET    /api/products/categories/list           # Get categories
GET    /api/products/alerts/low-stock         # Get low stock products
GET    /api/products/alerts/out-of-stock      # Get out of stock products
```

### Warehouse Endpoints

```
GET    /api/warehouses            # Get all warehouses
GET    /api/warehouses/:id        # Get single warehouse
POST   /api/warehouses            # Create warehouse (Manager only)
PUT    /api/warehouses/:id        # Update warehouse (Manager only)
DELETE /api/warehouses/:id        # Delete warehouse (Manager only)
```

### Receipt Endpoints

```
GET    /api/receipts              # Get all receipts
GET    /api/receipts/:id          # Get single receipt
POST   /api/receipts              # Create receipt
PUT    /api/receipts/:id          # Update receipt
POST   /api/receipts/:id/process  # Process receipt (receive items)
POST   /api/receipts/:id/cancel   # Cancel receipt
```

### Delivery Endpoints

```
GET    /api/deliveries            # Get all deliveries
GET    /api/deliveries/:id        # Get single delivery
POST   /api/deliveries            # Create delivery
PUT    /api/deliveries/:id        # Update delivery
POST   /api/deliveries/:id/process # Process delivery (ship items)
POST   /api/deliveries/:id/cancel  # Cancel delivery
```

### Transfer Endpoints

```
GET    /api/transfers             # Get all transfers
GET    /api/transfers/:id         # Get single transfer
POST   /api/transfers             # Create transfer
PUT    /api/transfers/:id         # Update transfer
POST   /api/transfers/:id/process # Process transfer
POST   /api/transfers/:id/cancel  # Cancel transfer
```

### Stock Adjustment Endpoints

```
GET    /api/adjustments           # Get all adjustments
GET    /api/adjustments/:id       # Get single adjustment
POST   /api/adjustments           # Create adjustment (Manager only)
POST   /api/adjustments/:id/process # Process adjustment (Manager only)
POST   /api/adjustments/:id/cancel  # Cancel adjustment (Manager only)
```

### Movement History Endpoints

```
GET    /api/history               # Get movement history
GET    /api/history/product/:id   # Get product movement history
GET    /api/history/stats         # Get movement statistics
```

### Dashboard Endpoints

```
GET    /api/dashboard/stats       # Get dashboard statistics
GET    /api/dashboard/staff-stats # Get staff dashboard stats
GET    /api/dashboard/trends      # Get inventory trends
GET    /api/dashboard/search      # Search products
```

## 🔌 Socket.io Events

### Client → Server Events

```javascript
// Join user room for personalized notifications
socket.emit('join_room', userId);
```

### Server → Client Events

```javascript
// Stock updates
socket.on('stock:update', (data) => {
  // { productId, newStock, timestamp }
});

// Low stock alerts
socket.on('stock:low_alert', (data) => {
  // { product, timestamp }
});

// New operations
socket.on('receipt:created', (data) => {
  // { receipt, timestamp }
});

socket.on('delivery:created', (data) => {
  // { delivery, timestamp }
});

socket.on('transfer:created', (data) => {
  // { transfer, timestamp }
});

socket.on('adjustment:created', (data) => {
  // { adjustment, timestamp }
});

// Product updates
socket.on('product:created', (data) => {
  // { product, timestamp }
});

socket.on('product:updated', (data) => {
  // { product, timestamp }
});
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevents API abuse
- **CORS Protection**: Configurable cross-origin requests
- **Helmet**: Security headers
- **Input Validation**: Joi schema validation
- **Role-based Access**: Manager and Staff permissions

## 🎯 Role Permissions

| Feature | Manager | Staff |
|---------|---------|-------|
| View Dashboard Stats | ✅ | ✅ |
| View Products | ✅ | ✅ |
| Create/Edit Products | ✅ | ❌ |
| Receive Stock | ✅ | ✅ |
| Deliver Stock | ✅ | ✅ |
| Internal Transfers | ✅ | ✅ |
| Stock Adjustments | ✅ | ❌ |
| View Move History | ✅ | ✅ |
| Manage Warehouses | ✅ | ❌ |
| Manage Staff | ✅ | ❌ |

## 📊 Database Models

### User Model
- Authentication and role management
- OTP functionality for password reset
- Staff creation by managers

### Product Model
- Complete product information
- Stock levels and thresholds
- Category and warehouse assignment

### Warehouse Model
- Multi-warehouse support
- Location management

### Receipt Model
- Incoming stock management
- Supplier information
- Item-level tracking

### Delivery Model
- Outgoing stock management
- Customer information
- Pick and pack workflow

### Transfer Model
- Internal stock movements
- Location-to-location transfers

### Stock Adjustment Model
- Manual stock corrections
- Reason tracking and approval

### Movement History Model
- Complete audit trail
- All stock movements logged
- Searchable and filterable

## 🚀 Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/stockmaster
JWT_SECRET=your_production_jwt_secret_very_long_and_secure
FRONTEND_URL=https://your-frontend-domain.com
```

### PM2 Configuration

```json
{
  "name": "stockmaster-backend",
  "script": "src/server.js",
  "instances": "max",
  "exec_mode": "cluster",
  "env": {
    "NODE_ENV": "production"
  }
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Email: support@stockmaster.com

---

**Built with ❤️ for the Odoo Hackathon 2025**