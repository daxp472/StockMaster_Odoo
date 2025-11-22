const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');
const Receipt = require('../models/Receipt');
const Delivery = require('../models/Delivery');

const { connectDB } = require('../config/database');

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await User.deleteMany({});
    await Warehouse.deleteMany({});
    await Product.deleteMany({});
    await Receipt.deleteMany({});
    await Delivery.deleteMany({});

    // Create Manager User
    console.log('👤 Creating users...');
    const managerPassword = await bcrypt.hash('password123', 12);
    const manager = await User.create({
      name: 'John Doe',
      email: 'manager@stockmaster.com',
      password: managerPassword,
      role: 'inventory_manager',
      isActive: true
    });

    // Create Staff Users
    const staffPassword = await bcrypt.hash('password123', 12);
    const staff1 = await User.create({
      name: 'Rahul Kumar',
      email: 'staff1@stockmaster.com',
      password: staffPassword,
      role: 'warehouse_staff',
      createdBy: manager._id,
      isActive: true
    });

    const staff2 = await User.create({
      name: 'Priya Sharma',
      email: 'staff2@stockmaster.com',
      password: staffPassword,
      role: 'warehouse_staff',
      createdBy: manager._id,
      isActive: true
    });

    // Create Warehouses
    console.log('🏢 Creating warehouses...');
    const mainWarehouse = await Warehouse.create({
      name: 'Main Warehouse',
      code: 'WH-001',
      address: '123 Industrial Street, Mumbai, Maharashtra 400001',
      isActive: true,
      createdBy: manager._id
    });

    const productionWarehouse = await Warehouse.create({
      name: 'Production Floor',
      code: 'WH-002',
      address: '124 Industrial Street, Mumbai, Maharashtra 400001',
      isActive: true,
      createdBy: manager._id
    });

    // Create Products
    console.log('📦 Creating products...');
    const products = await Product.insertMany([
      {
        name: 'Steel Rods',
        sku: 'STL-001',
        category: 'Raw Materials',
        unitOfMeasure: 'kg',
        currentStock: 150,
        minStock: 20,
        maxStock: 500,
        cost: 25.50,
        location: 'Section A',
        warehouse: mainWarehouse._id,
        description: 'High-grade steel rods for construction',
        createdBy: manager._id
      },
      {
        name: 'Office Chairs',
        sku: 'CHR-001',
        category: 'Furniture',
        unitOfMeasure: 'pcs',
        currentStock: 25,
        minStock: 10,
        maxStock: 100,
        cost: 150.00,
        location: 'Section B',
        warehouse: mainWarehouse._id,
        description: 'Ergonomic office chairs with lumbar support',
        createdBy: manager._id
      },
      {
        name: 'Laptop Stand',
        sku: 'LPS-001',
        category: 'Electronics',
        unitOfMeasure: 'pcs',
        currentStock: 8,
        minStock: 10,
        maxStock: 50,
        cost: 45.00,
        location: 'Section C',
        warehouse: mainWarehouse._id,
        description: 'Adjustable aluminum laptop stands',
        createdBy: manager._id
      },
      {
        name: 'Safety Helmets',
        sku: 'SFT-001',
        category: 'Safety Equipment',
        unitOfMeasure: 'pcs',
        currentStock: 0,
        minStock: 15,
        maxStock: 100,
        cost: 35.00,
        location: 'Section D',
        warehouse: mainWarehouse._id,
        description: 'Industrial safety helmets - white',
        createdBy: manager._id
      },
      {
        name: 'Wooden Planks',
        sku: 'WOD-001',
        category: 'Raw Materials',
        unitOfMeasure: 'm',
        currentStock: 200,
        minStock: 50,
        maxStock: 1000,
        cost: 12.75,
        location: 'Section E',
        warehouse: productionWarehouse._id,
        description: 'Premium teak wooden planks',
        createdBy: manager._id
      }
    ]);

    // Create Sample Receipts
    console.log('📥 Creating sample receipts...');
    await Receipt.create({
      reference: 'RCP-001',
      supplier: 'Steel Corp Ltd',
      status: 'waiting',
      expectedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      warehouse: mainWarehouse._id,
      items: [
        {
          product: products[0]._id, // Steel Rods
          quantityOrdered: 100,
          quantityReceived: 0,
          unitCost: 25.50
        }
      ],
      totalQuantity: 100,
      notes: 'Urgent delivery required for construction project',
      createdBy: manager._id
    });

    // Create Sample Deliveries
    console.log('📤 Creating sample deliveries...');
    await Delivery.create({
      reference: 'DEL-001',
      customer: 'ABC Manufacturing',
      status: 'ready',
      scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      warehouse: mainWarehouse._id,
      items: [
        {
          product: products[1]._id, // Office Chairs
          quantityDemand: 10,
          quantityDone: 0
        }
      ],
      totalQuantity: 10,
      notes: 'Delivery to main office building',
      createdBy: manager._id
    });

    console.log('✅ Seed data created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Manager: manager@stockmaster.com / password123');
    console.log('Staff 1: staff1@stockmaster.com / password123');
    console.log('Staff 2: staff2@stockmaster.com / password123');
    console.log('\n🏢 Warehouses created:');
    console.log('- Main Warehouse (WH-001)');
    console.log('- Production Floor (WH-002)');
    console.log('\n📦 Products created:');
    console.log('- Steel Rods (STL-001) - 150 kg in stock');
    console.log('- Office Chairs (CHR-001) - 25 pcs in stock');
    console.log('- Laptop Stand (LPS-001) - 8 pcs in stock (LOW STOCK)');
    console.log('- Safety Helmets (SFT-001) - 0 pcs in stock (OUT OF STOCK)');
    console.log('- Wooden Planks (WOD-001) - 200 m in stock');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

// Run seed if called directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;