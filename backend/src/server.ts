import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path'; // Added for dotenv path configuration

// Load environment variables
// Construct path to .env file based on NODE_ENV
// Assumes .env, .env.development, .env.production are in the backend root directory
const envFile = `.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ''}`;
// Corrected path assuming server.ts is in backend/src and .env is in backend/
dotenv.config({ path: path.resolve(__dirname, `../.${envFile}`) });


const app: Application = express();

// Middleware
app.use(cors()); // Enable CORS for all routes and origins by default
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Initialize Passport
import passport from './services/passportConfig';
app.use(passport.initialize());

// Simple Root Route
app.get('/', (req: Request, res: Response) => {
  res.send('AI CV Maker API Running - New Foundation');
});

// Mount API routes
import authRoutes from './api/authRoutes';
import cvTemplateRoutes from './api/cvTemplateRoutes';
import userCvRoutes from './api/userCvRoutes';
import userRoutes from './api/userRoutes'; // Import User profile routes
import aiRoutes from './api/aiRoutes'; // Import AI routes

app.use('/api/auth', authRoutes);
app.use('/api/cv-templates', cvTemplateRoutes);
app.use('/api/cvs', userCvRoutes); // Mount User CV routes
app.use('/api/users', userRoutes); // Mount User profile routes
app.use('/api/ai', aiRoutes); // Mount AI routes


// Basic Error Handling Middleware
// This should be one of the last middleware registered
interface HttpError extends Error {
  status?: number;
  statusCode?: number; // Common alternative for status
}

app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err.stack || err.message || err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    message: message,
    // Optionally include stack in development
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// 404 Not Found Handler (if no routes matched)
// This should be placed after all your normal routes and before the generic error handler,
// or as the very last middleware if the generic error handler calls next() for non-errors.
// For simplicity, placing it before the generic error handler if it doesn't call next().
app.use((req: Request, res: Response, next: NextFunction) => {
  // Check if response has already been sent by a route handler
  if (!res.headersSent) {
    res.status(404).json({ message: "Not Found: The requested resource does not exist on this server." });
  } else {
    next(); // If headers sent, pass to next error handler if any, or Express terminates.
  }
});


const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on new foundation on port ${PORT}`);
  console.log(`Current environment: ${process.env.NODE_ENV || 'development'}`);
  const resolvedEnvPath = path.resolve(__dirname, `../.${envFile}`);
  console.log(`Attempted to load .env file from: ${resolvedEnvPath}`);

  if (!process.env.PORT && !process.env.CI) { // Don't warn for PORT in CI where it might be dynamically assigned
    console.warn('Warning: PORT environment variable not set. Defaulting to 3001.');
  }
  if (!process.env.JWT_SECRET) {
    console.warn('CRITICAL WARNING: JWT_SECRET environment variable is not set! Application will not be secure.');
  }
});

export default app; // Export app for potential testing or other uses
