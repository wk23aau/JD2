import request from 'supertest';
import express, { Express } from 'express';
import authRoutes from './authRoutes'; // The router we're testing
import pool from '../../db'; // Actual database pool

// --- Test Setup ---
let app: Express;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes); // Mount auth routes

  // Set a test JWT_SECRET
  process.env.JWT_SECRET = 'testsecret';

  // Ensure test database is clean before tests run (if possible)
  // This might involve running a script or specific queries.
  // For simplicity, we'll ensure cleanup after each relevant test or suite.
  // Example: await pool.query('DELETE FROM users WHERE email LIKE "%@test.com"');
});

afterEach(async () => {
  // Clean up users created during tests to avoid interference
  // This is crucial for tests that check for existing users or create new ones.
  try {
    await pool.query('DELETE FROM users WHERE email LIKE "%@test.com" OR username LIKE "testuser%"');
  } catch (error) {
    console.error("Error cleaning up test users:", error);
  }
});

afterAll(async () => {
  // Close the database connection pool
  await pool.end();
});

// --- Test Suites ---
describe('Auth API - /api/auth', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully with valid data', async () => {
      const newUser = {
        username: 'testuser_signup',
        email: 'signup@test.com',
        password: 'password123',
      };
      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.username).toBe(newUser.username);
      expect(response.body.user.email).toBe(newUser.email);

      // Verify user is in DB (optional, but good for confidence)
      const dbResult = await pool.query('SELECT * FROM users WHERE email = ?', [newUser.email]);
      // @ts-ignore
      expect(dbResult[0].length).toBe(1);
      // @ts-ignore
      expect(dbResult[0][0].username).toBe(newUser.username);
    });

    it('should return 400 if required fields are missing', async () => {
      const testCases = [
        { email: 'test@test.com', password: 'password' }, // Missing username
        { username: 'testuser', password: 'password' }, // Missing email
        { username: 'testuser', email: 'test@test.com' }, // Missing password
      ];
      for (const tc of testCases) {
        const response = await request(app).post('/api/auth/register').send(tc);
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Username, email, and password are required');
      }
    });

    it('should return 409 if email or username already exists', async () => {
      const existingUser = {
        username: 'existinguser',
        email: 'existing@test.com',
        password: 'password123',
      };
      // First, create the user
      await request(app).post('/api/auth/register').send(existingUser);

      // Attempt to register again with the same email
      let response = await request(app)
        .post('/api/auth/register')
        .send({ ...existingUser, username: 'newusername' });
      expect(response.status).toBe(409);
      expect(response.body.message).toBe('User already exists with this email or username');

      // Attempt to register again with the same username
      response = await request(app)
        .post('/api/auth/register')
        .send({ ...existingUser, email: 'newemail@test.com' });
      expect(response.status).toBe(409);
      expect(response.body.message).toBe('User already exists with this email or username');
    });
  });

  describe('POST /api/auth/login', () => {
    const loginUser = {
      username: 'testuser_login',
      email: 'login@test.com',
      password: 'password123',
    };

    beforeEach(async () => {
      // Create a user to log in with for each login test
      await request(app).post('/api/auth/register').send(loginUser);
    });

    it('should login an existing user successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: loginUser.email, password: loginUser.password });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(loginUser.email);
      expect(response.body.user.username).toBe(loginUser.username);
    });

    it('should return 401 for incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: loginUser.email, password: 'wrongpassword' });
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'password123' });
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 400 if email or password are missing', async () => {
      const testCases = [
        { password: 'password123' }, // Missing email
        { email: loginUser.email },   // Missing password
      ];
      for (const tc of testCases) {
        const response = await request(app).post('/api/auth/login').send(tc);
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Email and password are required');
      }
    });
  });
});
