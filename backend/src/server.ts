import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
// import dotenv from 'dotenv'; // dotenv is now handled in config/index.ts
// import path from 'path'; // path might still be needed if other path resolutions are done here, but not for dotenv

// Import configuration variables
import { PORT, NODE_ENV, JWT_SECRET, CORS_ORIGIN } from './config';

const app: Application = express();

// Middleware
// Configure CORS using the value from config
app.use(cors({ origin: CORS_ORIGIN === '*' ? undefined : CORS_ORIGIN.split(',') }));
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
  const message = err.message || 'Internal ServerError';

  res.status(statusCode).json({
    message: message,
    // Optionally include stack in development
    stack: NODE_ENV === 'development' ? err.stack : undefined, // Use imported NODE_ENV
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


// const PORT is now imported from config

app.listen(PORT, () => {
  console.log(`Server is running on new foundation on port ${PORT}`);
  console.log(`Current environment: ${NODE_ENV}`);
  // The .env loading path is now logged from config/index.ts, so no need to repeat here.

  // Warnings for PORT and JWT_SECRET are now handled in config/index.ts
  // However, we can still check if they were successfully loaded if desired,
  // but config/index.ts already provides defaults or logs critical warnings.
  if (PORT === '3001' && !process.env.PORT && NODE_ENV !== 'test' && !process.env.CI) { // Check if default is used and PORT was not explicitly set
    console.warn('Note: PORT is using the default value of 3001. Set PORT in your .env file if a different port is needed.');
  }
  if (JWT_SECRET === 'YOUR_DEFAULT_JWT_SECRET_CHANGE_ME') { // Check against the default placeholder from config
     // This warning is already in config/index.ts, but can be reiterated if crucial for server startup context
    console.warn('CRITICAL STARTUP WARNING: JWT_SECRET is using the default placeholder value! Application is insecure.');
  }
});

export default app; // Export app for potential testing or other uses
