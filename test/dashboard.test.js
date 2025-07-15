// dashboard.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import { app, server } from '../server.js'; // Adjust path if your server.js is in a different location
import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

let adminToken;
let normalUserToken;
let adminUserId;
let testCategoryId;
let testProduct1Id;
let testProduct2Id;
let testProduct3Id;

const testAdminEmail = 'admindash@example.com';
const testAdminPassword = 'AdminDash123!';
const testNormalUserEmail = 'userdash@example.com';
const testNormalUserPassword = 'UserDash123!';

beforeAll(async () => {
    // Clean up existing test data
    await Order.deleteMany({});
    await User.deleteMany({ email: { $in: [testAdminEmail, testNormalUserEmail, 'customer1@test.com', 'customer2@test.com'] } });
    await Product.deleteMany({});
    await Category.deleteMany({ name: 'TestCategoryForDashboard' });

    // Register and login admin user
    await request(app)
        .post('/api/auth/register')
        .send({ fullName: 'Admin Dashboard', email: testAdminEmail, password: testAdminPassword });

    const adminLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testAdminEmail, password: testAdminPassword });
    adminToken = adminLoginRes.body.token;
    adminUserId = adminLoginRes.body.data._id;

    // Set admin role for the registered admin user
    await User.findByIdAndUpdate(adminUserId, { role: 'admin' });

    // Register and login normal user
    await request(app)
        .post('/api/auth/register')
        .send({ fullName: 'Normal Dashboard', email: testNormalUserEmail, password: testNormalUserPassword });

    const normalLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testNormalUserEmail, password: testNormalUserPassword });
    normalUserToken = normalLoginRes.body.token;

    // Create a test category
    const categoryRes = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'TestCategoryForDashboard' });
    testCategoryId = categoryRes.body._id;

    // Create test products
    const product1 = await Product.create({ name: 'Product A', category: testCategoryId, price: 100, stock: 100, imageUrl: 'urlA' });
    const product2 = await Product.create({ name: 'Product B', category: testCategoryId, price: 200, stock: 100, imageUrl: 'urlB' });
    const product3 = await Product.create({ name: 'Product C', category: testCategoryId, price: 50, stock: 100, imageUrl: 'urlC' });
    testProduct1Id = product1._id;
    testProduct2Id = product2._id;
    testProduct3Id = product3._id;


    // Create some normal users
    const customer1 = await User.create({ fullName: 'Customer One', email: 'customer1@test.com', password: 'password123', role: 'normal' });
    const customer2 = await User.create({ fullName: 'Customer Two', email: 'customer2@test.com', password: 'password123', role: 'normal' });

    // Create various orders for dashboard stats
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);

    await Order.create([
        { // Delivered order for totalRevenue and salesData
            customer: customer1._id,
            items: [{ product: testProduct1Id, name: 'Product A', price: 100, quantity: 2, imageUrl: 'urlA' }],
            amount: 250, // 200 product + 50 delivery
            address: 'Addr1', phone: '111', status: 'Delivered', paymentMethod: 'COD', createdAt: today
        },
        { // Another Delivered order for totalRevenue and salesData
            customer: customer2._id,
            items: [{ product: testProduct2Id, name: 'Product B', price: 200, quantity: 1, imageUrl: 'urlB' }],
            amount: 250, // 200 product + 50 delivery
            address: 'Addr2', phone: '222', status: 'Delivered', paymentMethod: 'COD', createdAt: today
        },
        { // Delivered order from last month for salesData (different month)
            customer: customer1._id,
            items: [{ product: testProduct3Id, name: 'Product C', price: 50, quantity: 4, imageUrl: 'urlC' }],
            amount: 250, // 200 product + 50 delivery
            address: 'Addr3', phone: '333', status: 'Delivered', paymentMethod: 'COD', createdAt: lastMonth
        },
        { // Pending order for totalOrders
            customer: customer1._id,
            items: [{ product: testProduct1Id, name: 'Product A', price: 100, quantity: 1, imageUrl: 'urlA' }],
            amount: 150,
            address: 'Addr4', phone: '444', status: 'Pending', paymentMethod: 'COD', createdAt: today
        },
        { // Shipped order for totalOrders
            customer: customer2._id,
            items: [{ product: testProduct2Id, name: 'Product B', price: 200, quantity: 1, imageUrl: 'urlB' }],
            amount: 250,
            address: 'Addr5', phone: '555', status: 'Shipped', paymentMethod: 'COD', createdAt: today
        },
        { // Cancelled order (should not count in totalOrders or totalRevenue)
            customer: customer1._id,
            items: [{ product: testProduct1Id, name: 'Product A', price: 100, quantity: 1, imageUrl: 'urlA' }],
            amount: 150,
            address: 'Addr6', phone: '666', status: 'Cancelled', paymentMethod: 'COD', createdAt: today
        },
        { // Another Delivered order for topProducts (Product B sold more)
            customer: customer2._id,
            items: [{ product: testProduct2Id, name: 'Product B', price: 200, quantity: 3, imageUrl: 'urlB' }],
            amount: 650, // 600 product + 50 delivery
            address: 'Addr7', phone: '777', status: 'Delivered', paymentMethod: 'COD', createdAt: today
        },
    ]);

    console.log('--- beforeAll (Dashboard Tests): Setup complete ---');
});

afterAll(async () => {
    // Clean up test data
    await Order.deleteMany({});
    await User.deleteMany({ email: { $in: [testAdminEmail, testNormalUserEmail, 'customer1@test.com', 'customer2@test.com'] } });
    await Product.deleteMany({});
    await Category.deleteMany({ name: 'TestCategoryForDashboard' });

    // Close Mongoose connection
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('--- afterAll (Dashboard Tests): MongoDB connection closed cleanly ---');
    }

    // Explicitly close the HTTP server
    if (server && server.listening) {
        await new Promise(resolve => server.close(resolve));
        console.log('--- afterAll (Dashboard Tests): Express server closed cleanly ---');
    }
    console.log('--- afterAll (Dashboard Tests): Cleanup complete ---');
});

describe('Dashboard API Tests', () => {
    it('should allow admin to get dashboard statistics', async () => {
        const res = await request(app)
            .get('/api/dashboard/stats')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.totalRevenue).toBeDefined();
        expect(res.body.totalOrders).toBeDefined();
        expect(res.body.totalCustomers).toBeDefined();
        expect(res.body.salesData).toBeDefined();
        expect(res.body.topProducts).toBeDefined();
        expect(res.body.recentOrders).toBeDefined();

        // Validate totalRevenue: Sum of delivered orders only
        // Order 1: 250, Order 2: 250, Order 3: 250, Order 7: 650
        expect(res.body.totalRevenue).toBe(250 + 250 + 250 + 650);

        // Validate totalOrders: Pending and Shipped orders only (2 created)
        expect(res.body.totalOrders).toBe(2);

        // Corrected: Validate totalCustomers based on cumulative normal users from all test files
        // 1 (from category.test.js) + 1 (from order.test.js) + 3 (from dashboard.test.js) = 5
        expect(res.body.totalCustomers).toBe(5); // Changed from 3 to 5

        // Validate salesData structure (at least for current month and last month if applicable)
        expect(Array.isArray(res.body.salesData)).toBe(true);
        expect(res.body.salesData.length).toBeGreaterThanOrEqual(1);

        // Validate topProducts (based on quantity sold)
        // Product A: 2 (Order 1)
        // Product B: 1 (Order 2) + 3 (Order 7) = 4
        // Product C: 4 (Order 3)
        // So expected top is B (4), C (4), A (2)
        expect(Array.isArray(res.body.topProducts)).toBe(true);
        expect(res.body.topProducts.length).toBeGreaterThanOrEqual(2);
        const topProductNames = res.body.topProducts.map(p => p.name);
        expect(topProductNames).toContain('Product B');
        expect(topProductNames).toContain('Product C');


        // Validate recentOrders: should return 5 most recent orders regardless of status
        expect(Array.isArray(res.body.recentOrders)).toBe(true);
        expect(res.body.recentOrders.length).toBe(5);
        expect(res.body.recentOrders[0]).toHaveProperty('customer');
    });

    it('should not allow normal user to get dashboard statistics (403 Forbidden)', async () => {
        const res = await request(app)
            .get('/api/dashboard/stats')
            .set('Authorization', `Bearer ${normalUserToken}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Access denied: Admin privileges are required.');
    });

    it('should not allow unauthenticated user to get dashboard statistics (401 Unauthorized)', async () => {
        const res = await request(app)
            .get('/api/dashboard/stats');

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/Authentication failed/i);
    });
});