// user.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import { app, server } from '../server.js'; // Adjust path if your server.js is in a different location
import User from '../models/User.js';
import path from 'path'; // Needed for file path in multer test
import { fileURLToPath } from 'url'; // Needed for __dirname equivalent

// Define __filename and __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let userToken;
let userId;
let testUserEmail = 'usertest@example.com';
let testUserPassword = 'TestPassword123!';
let testUserFullName = 'Test User';

beforeAll(async () => {
    // Clean up existing test user data specifically for this suite
    await User.deleteMany({ email: { $in: [testUserEmail, 'loginfail@example.com', 'updatetest@example.com', 'existing@example.com'] } });
    console.log('--- beforeAll (User Tests): Cleaned up previous test data ---');
});

afterAll(async () => {
    // Clean up all test user data created by this suite
    await User.deleteMany({ email: { $in: [testUserEmail, 'loginfail@example.com', 'updatetest@example.com', 'existing@example.com'] } });

    // Close Mongoose connection
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('--- afterAll (User Tests): MongoDB connection closed cleanly ---');
    }

    // Explicitly close the HTTP server
    if (server && server.listening) {
        await new Promise(resolve => server.close(resolve));
        console.log('--- afterAll (User Tests): Express server closed cleanly ---');
    }
    console.log('--- afterAll (User Tests): Cleanup complete ---');
});

describe('User Authentication & Profile API Tests', () => {

    // POST /api/auth/register
    it('should register a new user successfully', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                fullName: testUserFullName,
                email: testUserEmail,
                password: testUserPassword
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('User registered successfully.');
        expect(res.body.data).toHaveProperty('_id');
        expect(res.body.data.email).toBe(testUserEmail);
        expect(res.body.data.fullName).toBe(testUserFullName);
        expect(res.body.data.role).toBe('normal'); // Default role
        expect(res.body.data).not.toHaveProperty('password'); // Password should not be returned

        // Store user ID and token for subsequent tests
        userId = res.body.data._id;
    });

    it('should return 400 for missing registration fields', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                fullName: 'Incomplete User',
                email: 'incomplete@example.com'
                // password is missing
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Please fill all fields.');
    });

    it('should return 400 for duplicate email registration', async () => {
        // Attempt to register the same user again
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                fullName: testUserFullName,
                email: testUserEmail,
                password: testUserPassword
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('User with this email already exists.');
    });

    // POST /api/auth/login
    it('should log in a registered user successfully', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUserEmail,
                password: testUserPassword
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body).toHaveProperty('token');
        expect(res.body.data.email).toBe(testUserEmail);
        expect(res.body.data.fullName).toBe(testUserFullName);
        expect(res.body.data.role).toBe('normal');
        expect(res.body.data).not.toHaveProperty('password'); // Password should not be returned

        userToken = res.body.token; // Store token for protected routes
    });

    it('should return 401 for invalid login credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUserEmail,
                password: 'WrongPassword!' // Incorrect password
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Invalid email or password.');
    });

    it('should return 401 for non-existent user login', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'nonexistent@example.com',
                password: 'AnyPassword123!'
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Invalid email or password.');
    });

    it('should return 400 for missing login fields', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUserEmail
                // password is missing
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Email and password are required.');
    });

    // GET /api/auth/profile
    it('should get authenticated user profile', async () => {
        const res = await request(app)
            .get('/api/auth/profile')
            .set('Authorization', `Bearer ${userToken}`); // Use the token obtained from login

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data._id.toString()).toBe(userId.toString());
        expect(res.body.data.email).toBe(testUserEmail);
        expect(res.body.data.fullName).toBe(testUserFullName);
        expect(res.body.data).not.toHaveProperty('password'); // Password should never be returned
    });

    it('should return 401 for unauthenticated profile access', async () => {
        const res = await request(app)
            .get('/api/auth/profile'); // No token provided

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/Authentication failed: No token provided./i);
    });

    // PUT /api/auth/profile
    it('should update authenticated user profile (fullName and location)', async () => {
        const updatedFullName = 'Updated Test User';
        const updatedLocation = 'Kathmandu, Nepal';

        const res = await request(app)
            .put('/api/auth/profile')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                fullName: updatedFullName,
                location: updatedLocation
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Profile updated successfully');
        expect(res.body.data.fullName).toBe(updatedFullName);
        expect(res.body.data.location).toBe(updatedLocation);

        // Verify in DB
        const userInDb = await User.findById(userId);
        expect(userInDb.fullName).toBe(updatedFullName);
        expect(userInDb.location).toBe(updatedLocation);
    });

    it('should return 401 for unauthenticated profile update', async () => {
        const res = await request(app)
            .put('/api/auth/profile')
            .send({ fullName: 'Unauthorized Update' }); // No token

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/Authentication failed: No token provided./i);
    });

    it('should return 400 if updating email to an already existing email', async () => {
        // Create another user with an email that will conflict
        await request(app)
            .post('/api/auth/register')
            .send({ fullName: 'Existing User', email: 'existing@example.com', password: 'ExistingPassword123!' });

        const res = await request(app)
            .put('/api/auth/profile')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ email: 'existing@example.com' }); // Try to change current user's email to an existing one

        expect(res.statusCode).toBe(400); // Expecting 400 from User.findOne for existing email check
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('User with this email already exists.');
    });


    // PUT /api/auth/profile/picture
    it('should update user profile picture', async () => {
        // Path to a dummy image file (create one in your project if needed, e.g., test/dummy.png)
        // For actual testing, you might need a small dummy image in your test directory.
        const dummyImagePath = path.join(__dirname, 'dummy.png'); // Assuming dummy.png is in test/

        // Create a dummy.png file if it doesn't exist for the test to run.
        // In a real scenario, you would have a small dummy image file in your test directory.
        // For now, we'll assume it exists or mock fs.
        // A simple way to create one for testing: echo "test_image" > test/dummy.png (though this won't be a valid image)
        // For a proper test, ensure you have a small PNG or JPG file at test/dummy.png
        // Example: You can use a tiny base64 encoded image or create a simple file.
        // For supertest to send a file, the file path needs to exist.
        // If you don't have a dummy.png, this test will fail on file path.
        // You might need to manually create an empty dummy.png in your 'test' folder
        // or a small valid image file, e.g., via a graphics program.

        const res = await request(app)
            .put('/api/auth/profile/picture')
            .set('Authorization', `Bearer ${userToken}`)
            .attach('profilePicture', dummyImagePath); // 'profilePicture' is the field name used by multer

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Profile picture updated successfully.');
        expect(res.body.data.profilePicture).toMatch(/\/images\/profile-pictures\/.+\.(png|jpg|jpeg)$/); // Check for expected URL format

        // Verify in DB
        const userInDb = await User.findById(userId);
        expect(userInDb.profilePicture).toMatch(/\/images\/profile-pictures\/.+\.(png|jpg|jpeg)$/);
    });

    it('should return 401 for unauthenticated profile picture update', async () => {
        const dummyImagePath = path.join(__dirname, 'dummy.png'); // Use dummy path

        const res = await request(app)
            .put('/api/auth/profile/picture')
            .attach('profilePicture', dummyImagePath); // No token

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/Authentication failed: No token provided./i);
    });

    it('should return 400 if no file is uploaded for profile picture update', async () => {
        const res = await request(app)
            .put('/api/auth/profile/picture')
            .set('Authorization', `Bearer ${userToken}`); // No file attached

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('No file uploaded.');
    });
});