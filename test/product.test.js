// product.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import { app, server } from '../server.js'; // Adjust path if your server.js is in a different location
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import User from '../models/User.js';

let adminToken;
let normalUserToken;
let adminUserId;
let testCategoryId; // Category needed for product creation
let productToUpdateId;
let productToDeleteId;

const testAdminEmail = 'adminproducttest@example.com';
const testAdminPassword = 'AdminPassword123!';
const testNormalUserEmail = 'userproducttest@example.com';
const testNormalUserPassword = 'UserPassword123!';

beforeAll(async () => {
    // Clean up existing test data relevant to products
    await Product.deleteMany({});
    await Category.deleteMany({ name: { $in: ['TestProductCategory', 'TempUpdateCategory'] } });
    await User.deleteMany({ email: { $in: [testAdminEmail, testNormalUserEmail] } });

    // Register and login admin user
    await request(app)
        .post('/api/auth/register')
        .send({ fullName: 'Admin Product Test', email: testAdminEmail, password: testAdminPassword });

    const adminLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testAdminEmail, password: testAdminPassword });
    adminToken = adminLoginRes.body.token;

    // Set admin role for the registered user
    const adminUser = await User.findOne({ email: testAdminEmail });
    adminUser.role = 'admin';
    await adminUser.save();
    adminUserId = adminUser._id;

    // Register and login normal user
    await request(app)
        .post('/api/auth/register')
        .send({ fullName: 'Normal Product Test', email: testNormalUserEmail, password: testNormalUserPassword });

    const normalLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testNormalUserEmail, password: testNormalUserPassword });
    normalUserToken = normalLoginRes.body.token;

    // Create a test category, as products depend on categories
    const categoryRes = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'TestProductCategory' });
    testCategoryId = categoryRes.body._id;

    // Create some initial products for testing
    const product1 = await Product.create({
        name: 'Product For Update',
        category: testCategoryId,
        price: 150,
        stock: 20,
        imageUrl: 'http://example.com/update.jpg'
    });
    productToUpdateId = product1._id;

    const product2 = await Product.create({
        name: 'Product For Delete',
        category: testCategoryId,
        price: 250,
        stock: 10,
        imageUrl: 'http://example.com/delete.jpg'
    });
    productToDeleteId = product2._id;

    console.log('--- beforeAll (Product Tests): Setup complete ---');
});

afterAll(async () => {
    // Clean up all test data
    await Product.deleteMany({});
    await Category.deleteMany({ name: { $in: ['TestProductCategory', 'TempUpdateCategory'] } });
    await User.deleteMany({ email: { $in: [testAdminEmail, testNormalUserEmail] } });

    // Close Mongoose connection
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('--- afterAll (Product Tests): MongoDB connection closed cleanly ---');
    }

    // Explicitly close the HTTP server
    if (server && server.listening) {
        await new Promise(resolve => server.close(resolve));
        console.log('--- afterAll (Product Tests): Express server closed cleanly ---');
    }
    console.log('--- afterAll (Product Tests): Cleanup complete ---');
});

describe('Product API Tests', () => {
    // GET Products (Public)
    it('should get all products for any user (public route)', async () => {
        // Create an extra product to ensure there's data to fetch for GET all
        await Product.create({
            name: 'Another Public Product',
            category: testCategoryId,
            price: 500,
            stock: 5,
            imageUrl: 'http://example.com/public.jpg'
        });

        const res = await request(app).get('/api/products');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(2); // At least productToUpdate, productToDelete, and Another Public Product
        expect(res.body[0]).toHaveProperty('category'); // Check if populated
    });

    // POST Create Product (Admin Only)
    it('should allow admin to create a new product', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'New Test Product',
                category: testCategoryId,
                price: 100,
                stock: 50,
                imageUrl: 'http://example.com/new.jpg'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.name).toBe('New Test Product');
        expect(res.body.category.toString()).toBe(testCategoryId.toString());
    });

    it('should not allow normal user to create a product (403 Forbidden)', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${normalUserToken}`)
            .send({
                name: 'Unauthorized Product',
                category: testCategoryId,
                price: 10,
                stock: 5,
                imageUrl: 'http://example.com/unauth.jpg'
            });

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe('Access denied: Admin privileges are required.');
    });

    it('should not allow unauthenticated user to create a product (401 Unauthorized)', async () => {
        const res = await request(app)
            .post('/api/products')
            .send({
                name: 'Unauthenticated Product',
                category: testCategoryId,
                price: 10,
                stock: 5,
                imageUrl: 'http://example.com/unauth.jpg'
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toMatch(/Authentication failed/i);
    });

    it('should return 400 if required product fields are missing', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Product with Missing Fields',
                // category, price, stock, imageUrl are missing
            });

        expect(res.statusCode).toBe(400);
        // Updated expectation to match the explicit controller message
        expect(res.body.message).toBe('All product fields are required.');
    });

    it('should return 404 if category ID is invalid or not found during creation', async () => {
        const invalidCategoryId = new mongoose.Types.ObjectId(); // Non-existent ID

        const res = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Product with Invalid Category',
                category: invalidCategoryId,
                price: 100,
                stock: 10,
                imageUrl: 'http://example.com/invalidcat.jpg'
            });

        // Updated expectation to match the controller's 404 for category not found
        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Category not found.');
    });


    // PUT Update Product (Admin Only)
    it('should allow admin to update an existing product', async () => {
        const res = await request(app)
            .put(`/api/products/${productToUpdateId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                price: 175,
                stock: 25
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.price).toBe(175);
        expect(res.body.stock).toBe(25);
        const updatedInDb = await Product.findById(productToUpdateId);
        expect(updatedInDb.price).toBe(175);
        expect(updatedInDb.stock).toBe(25);
    });

    it('should not allow normal user to update a product (403 Forbidden)', async () => {
        const res = await request(app)
            .put(`/api/products/${productToUpdateId}`)
            .set('Authorization', `Bearer ${normalUserToken}`)
            .send({ price: 200 });

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe('Access denied: Admin privileges are required.');
    });

    it('should not allow unauthenticated user to update a product (401 Unauthorized)', async () => {
        const res = await request(app)
            .put(`/api/products/${productToUpdateId}`)
            .send({ price: 200 });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toMatch(/Authentication failed/i);
    });

    it('should return 404 if product to update is not found', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .put(`/api/products/${nonExistentId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ price: 300 });

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Product not found');
    });

    it('should return 404 if updating with an invalid category ID', async () => {
        const invalidCategoryId = new mongoose.Types.ObjectId(); // Non-existent category ID

        const res = await request(app)
            .put(`/api/products/${productToUpdateId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ category: invalidCategoryId });

        // Updated expectation to match the controller's 404 for category not found
        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Category not found.');
    });

    // DELETE Product (Admin Only)
    it('should allow admin to delete a product', async () => {
        const res = await request(app)
            .delete(`/api/products/${productToDeleteId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Product deleted');
        const deletedProduct = await Product.findById(productToDeleteId);
        expect(deletedProduct).toBeNull();
    });

    it('should not allow normal user to delete a product (403 Forbidden)', async () => {
        const productToDeleteByNormalUser = await Product.create({
            name: 'Normal User Delete Product',
            category: testCategoryId,
            price: 10,
            stock: 1,
            imageUrl: 'http://example.com/normdel.jpg'
        });

        const res = await request(app)
            .delete(`/api/products/${productToDeleteByNormalUser._id}`)
            .set('Authorization', `Bearer ${normalUserToken}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe('Access denied: Admin privileges are required.');
    });

    it('should not allow unauthenticated user to delete a product (401 Unauthorized)', async () => {
        const productToDeleteByUnauthenticated = await Product.create({
            name: 'Unauth Delete Product',
            category: testCategoryId,
            price: 10,
            stock: 1,
            imageUrl: 'http://example.com/unauthdel.jpg'
        });

        const res = await request(app)
            .delete(`/api/products/${productToDeleteByUnauthenticated._id}`);

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toMatch(/Authentication failed/i);
    });

    it('should return 404 if product to delete is not found', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .delete(`/api/products/${nonExistentId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Product not found');
    });
});