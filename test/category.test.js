// test/category.test.js
import request from 'supertest';
import mongoose from 'mongoose';
// Updated import: now import 'app' and 'server' as named exports
import { app, server } from '../server.js'; // Adjust path if your server.js is in a different location
import Category from '../models/Category.js';
import User from '../models/User.js';

let adminToken;
let normalUserToken;
let adminUserId;
let testCategoryId; // For tests that need an existing category

const testAdminEmail = 'admincategorytest@example.com';
const testAdminPassword = 'AdminPassword123!';
const testNormalUserEmail = 'usercategorytest@example.com';
const testNormalUserPassword = 'UserPassword123!';

beforeAll(async () => {
    // Clean up existing test data
    await Category.deleteMany({ name: { $in: ['TestCategory1', 'TestCategory2', 'UpdatedCategory', 'CategoryToDelete', 'AnotherCategory', 'UpdateMeCategory', 'NormalUserUpdateCategory', 'UnauthenticatedUpdateCategory', 'ExistingCategoryForUpdate', 'TempCategoryToChange', 'NormalUserDeleteCategory', 'UnauthenticatedDeleteCategory'] } });
    await User.deleteMany({ email: { $in: [testAdminEmail, testNormalUserEmail] } });

    // Register and login admin user
    await request(app)
        .post('/api/auth/register')
        .send({ fullName: 'Admin Category Test', email: testAdminEmail, password: testAdminPassword });

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
        .send({ fullName: 'Normal Category Test', email: testNormalUserEmail, password: testNormalUserPassword });

    const normalLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testNormalUserEmail, password: testNormalUserPassword });
    normalUserToken = normalLoginRes.body.token;

    // Create an initial category for testing updates/deletions
    const categoryRes = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'CategoryToDelete' });
    testCategoryId = categoryRes.body._id;

    console.log('--- beforeAll (Category Tests): Setup complete ---');
});

afterAll(async () => {
    // Clean up test data
    await Category.deleteMany({ name: { $in: ['TestCategory1', 'TestCategory2', 'UpdatedCategory', 'CategoryToDelete', 'AnotherCategory', 'UpdateMeCategory', 'NormalUserUpdateCategory', 'UnauthenticatedUpdateCategory', 'ExistingCategoryForUpdate', 'TempCategoryToChange', 'NormalUserDeleteCategory', 'UnauthenticatedDeleteCategory'] } });
    await User.deleteMany({ email: { $in: [testAdminEmail, testNormalUserEmail] } });

    // Close Mongoose connection
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('--- afterAll (Category Tests): MongoDB connection closed cleanly ---');
    }

    // Explicitly close the HTTP server
    if (server && server.listening) {
        await new Promise(resolve => server.close(resolve));
        console.log('--- afterAll (Category Tests): Express server closed cleanly ---');
    }
    console.log('--- afterAll (Category Tests): Cleanup complete ---');
});

describe('Category API Tests', () => {
    // GET Categories (Public)
    it('should get all categories for any user (public route)', async () => {
        // Create a category to ensure there's data to fetch
        await request(app)
            .post('/api/categories')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'AnotherCategory' });

        const res = await request(app).get('/api/categories');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1); // At least 'CategoryToDelete' and 'AnotherCategory'
    });

    // POST Create Category (Admin Only)
    it('should allow admin to create a new category', async () => {
        const res = await request(app)
            .post('/api/categories')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'TestCategory1' });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.name).toBe('TestCategory1');
    });

    it('should not allow normal user to create a category (403 Forbidden)', async () => {
        const res = await request(app)
            .post('/api/categories')
            .set('Authorization', `Bearer ${normalUserToken}`)
            .send({ name: 'UnauthorizedCategory' });

        expect(res.statusCode).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Access denied: Admin privileges are required.');
    });

    it('should not allow unauthenticated user to create a category (401 Unauthorized)', async () => {
        const res = await request(app)
            .post('/api/categories')
            .send({}); // Missing token

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/Authentication failed/i);
    });

    it('should return 400 if creating a category with duplicate name', async () => {
        await request(app)
            .post('/api/categories')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'TestCategory2' }); // First creation

        const res = await request(app)
            .post('/api/categories')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'TestCategory2' }); // Second creation (duplicate)

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/duplicate key error|validation failed/i); // MongoDB duplicate error or Mongoose validation
    });

    it('should return 400 if category name is missing', async () => {
        const res = await request(app)
            .post('/api/categories')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({}); // Missing name

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/validation failed|name: Path `name` is required/i);
    });

    // PUT Update Category (Admin Only)
    it('should allow admin to update an existing category', async () => {
        const categoryToUpdate = await Category.create({ name: 'UpdateMeCategory' });

        const res = await request(app)
            .put(`/api/categories/${categoryToUpdate._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'UpdatedCategory' });

        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('UpdatedCategory');
        const updatedInDb = await Category.findById(categoryToUpdate._id);
        expect(updatedInDb.name).toBe('UpdatedCategory');
    });

    it('should not allow normal user to update a category (403 Forbidden)', async () => {
        const categoryToUpdate = await Category.create({ name: 'NormalUserUpdateCategory' });
        const res = await request(app)
            .put(`/api/categories/${categoryToUpdate._id}`)
            .set('Authorization', `Bearer ${normalUserToken}`)
            .send({ name: 'AttemptedUpdate' });

        expect(res.statusCode).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Access denied: Admin privileges are required.');
    });

    it('should not allow unauthenticated user to update a category (401 Unauthorized)', async () => {
        const categoryToUpdate = await Category.create({ name: 'UnauthenticatedUpdateCategory' });
        const res = await request(app)
            .put(`/api/categories/${categoryToUpdate._id}`)
            .send({ name: 'AttemptedUpdate' });

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/Authentication failed/i);
    });

    it('should return 404 if category to update is not found', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .put(`/api/categories/${nonExistentId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'NonExistentUpdate' });

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Category not found');
    });

    it('should return 400 if updating category name to an already existing name', async () => {
        await Category.create({ name: 'ExistingCategoryForUpdate' });
        const categoryToChange = await Category.create({ name: 'TempCategoryToChange' });

        const res = await request(app)
            .put(`/api/categories/${categoryToChange._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'ExistingCategoryForUpdate' });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/duplicate key error|validation failed/i);
    });

    // DELETE Category (Admin Only)
    it('should allow admin to delete a category', async () => {
        const categoryToDelete = await Category.findById(testCategoryId); // Use pre-created category

        const res = await request(app)
            .delete(`/api/categories/${categoryToDelete._id}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Category deleted');
        const deletedCategory = await Category.findById(categoryToDelete._id);
        expect(deletedCategory).toBeNull();
    });

    it('should not allow normal user to delete a category (403 Forbidden)', async () => {
        const categoryToDelete = await Category.create({ name: 'NormalUserDeleteCategory' });
        const res = await request(app)
            .delete(`/api/categories/${categoryToDelete._id}`)
            .set('Authorization', `Bearer ${normalUserToken}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Access denied: Admin privileges are required.');
    });

    it('should not allow unauthenticated user to delete a category (401 Unauthorized)', async () => {
        const categoryToDelete = await Category.create({ name: 'UnauthenticatedDeleteCategory' });
        const res = await request(app)
            .delete(`/api/categories/${categoryToDelete._id}`);

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/Authentication failed/i);
    });

    it('should return 404 if category to delete is not found', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .delete(`/api/categories/${nonExistentId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Category not found');
    });
});