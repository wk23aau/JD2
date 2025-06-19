import request from 'supertest';
import express, { Express } from 'express';
import aiRoutes from './aiRoutes'; // The router we're testing
import { protect } from '../../middleware/authMiddleware'; // To be mocked
import { GoogleGenAI } from '@google/genai'; // To be mocked

// --- Mocks ---

// Mock the authMiddleware's 'protect' function
jest.mock('../../middleware/authMiddleware', () => ({
  protect: jest.fn((req, res, next) => {
    // Simulate an authenticated user for most tests
    // Individual tests can override this mock implementation if needed
    req.user = { userId: 1, username: 'testuser', isAdmin: false };
    next();
  }),
}));

// Mock the GoogleGenAI SDK
const mockGenerateContent = jest.fn();
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}));

// --- Test Setup ---
let app: Express;

beforeAll(() => {
  app = express();
  app.use(express.json());
  // Mount the AI routes under a test prefix, similar to how it's done in server.ts
  app.use('/api/ai', aiRoutes);

  // Mock environment variables (especially GEMINI_API_KEY)
  // process.env.GEMINI_API_KEY = 'test-api-key'; // Set for most tests
});

afterEach(() => {
  // Clear all mocks after each test
  jest.clearAllMocks();
});

// --- Test Suites ---
describe('POST /api/ai/generate', () => {
  const validPayload = {
    sectionType: 'summary' as const, // Use 'as const' for literal type
    userInput: 'Generate a summary for a software engineer.',
    context: {},
  };

  it('should return 401 if not authenticated', async () => {
    // Override the protect mock for this specific test
    (protect as jest.Mock).mockImplementationOnce((req, res, next) => {
      res.status(401).json({ message: 'Not authorized, no token' });
    });

    const response = await request(app)
      .post('/api/ai/generate')
      .send(validPayload);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Not authorized, no token');
  });

  it('should return 200 and AI-generated content for a valid request', async () => {
    const mockAiResponse = { text: () => "This is an AI generated summary." };
    mockGenerateContent.mockResolvedValue(mockAiResponse);

    const response = await request(app)
      .post('/api/ai/generate')
      .send(validPayload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual("This is an AI generated summary."); // Assuming direct text response for summary
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    // Add more specific checks for the prompt if needed
  });

  it('should return 400 if required fields (sectionType, userInput) are missing', async () => {
    const incompletePayloads = [
      { userInput: 'test' }, // Missing sectionType
      { sectionType: 'summary' }, // Missing userInput
      {}, // Missing both
    ];

    for (const payload of incompletePayloads) {
      const response = await request(app)
        .post('/api/ai/generate')
        .send(payload);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('sectionType and userInput are required fields.');
    }
  });


  it('should return 503 if Gemini API key is not configured (and AI service is disabled)', async () => {
    const originalApiKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY; // Temporarily remove API key

    // Re-evaluate the module to pick up the changed env variable for the AI instance
    // This is tricky with how modules are cached. A cleaner way might be to
    // re-initialize the 'ai' instance within aiRoutes or make its initialization more test-friendly.
    // For this test, we'll assume the check for 'ai' instance being null is effective.
    // If aiRoutes.ts initializes 'ai' at the module level, this test might need aiRoutes to be re-imported or use a different strategy.
    // For now, let's assume the current aiRoutes structure where 'ai' can be null.

    // To properly test this, we'd need to ensure the 'ai' instance in aiRoutes.ts becomes null.
    // This might require restarting the app or using a specific test setup for env vars.
    // A simple mock of the 'ai' object within the route for this test might be more direct if re-init is hard.

    // Simulating the 'ai' instance being null by directly mocking the route's behavior
    // This is a bit of an integration test for the env var check.
    // A unit test for the module initialization would be separate.

    // To test the actual line `if (!ai)` in aiRoutes.ts, we need to make `ai` null.
    // The current mock structure for GoogleGenAI always returns an instance.
    // We need to adjust the test or the route for better testability of this specific case.
    // For now, this test will be more of a placeholder for that logic.

    // Let's assume for this test, we can force the 'ai' instance to be null *within the test context*
    // This is hard without changing the SUT (aiRoutes.ts).
    // A practical way: if aiRoutes exports its 'ai' instance for testing (not ideal for prod code)
    // Or, if the route directly checks process.env.GEMINI_API_KEY on each call (less efficient)
    // The current implementation initializes `ai` once.

    // The most straightforward way to test the *intended behavior* is to ensure the module
    // is reloaded/re-evaluated with the changed env var. Jest offers jest.resetModules().

    jest.resetModules(); // Reset modules to re-import aiRoutes with new env state
    process.env.GEMINI_API_KEY = undefined; // Ensure it's undefined
    const aiRoutesFresh = require('./aiRoutes').default; // Re-import

    const tempApp = express();
    tempApp.use(express.json());
    tempApp.use('/api/ai', aiRoutesFresh);


    const response = await request(tempApp)
      .post('/api/ai/generate')
      .send(validPayload);

    expect(response.status).toBe(503);
    expect(response.body.message).toBe('AI Service is not configured or API key is missing.');

    process.env.GEMINI_API_KEY = originalApiKey; // Restore API key
    jest.resetModules(); // Reset again to avoid interference
  });


  it('should handle errors from the AI service gracefully (e.g., return 500)', async () => {
    mockGenerateContent.mockRejectedValue(new Error('Gemini API Error'));

    const response = await request(app)
      .post('/api/ai/generate')
      .send(validPayload);

    expect(response.status).toBe(500); // Assuming global error handler in server.ts converts to 500
    expect(response.body.message).toContain('Failed to generate AI content: Gemini API Error');
  });

  it('should correctly parse and process JSON response for "experience_responsibilities"', async () => {
    const mockResponsibilities = ["Responsibility 1", "Responsibility 2"];
    const mockAiResponse = { text: () => JSON.stringify(mockResponsibilities) };
    mockGenerateContent.mockResolvedValue(mockAiResponse);

    const payload = {
      sectionType: 'experience_responsibilities' as const,
      userInput: 'Details for responsibilities',
      context: { jobTitle: 'Dev', company: 'Tech' },
    };

    const response = await request(app)
      .post('/api/ai/generate')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponsibilities);
  });

  it('should correctly parse and add ID for "new_experience_entry"', async () => {
    const mockNewExperience = { jobTitle: "New Job", company: "New Co", responsibilities: ["New Resp"] };
    // @ts-ignore
    const mockAiResponse = { text: () => JSON.stringify(mockNewExperience) };
    mockGenerateContent.mockResolvedValue(mockAiResponse);

    const payload = {
      sectionType: 'new_experience_entry' as const,
      userInput: 'Info for new experience',
      context: {},
    };

    const response = await request(app)
      .post('/api/ai/generate')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body.jobTitle).toBe("New Job");
  });

});
