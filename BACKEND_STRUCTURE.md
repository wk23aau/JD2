# Backend Structure Documentation

This document outlines the structure and key aspects of the AI CV Maker backend application.

## 1. Main Technologies Used

The backend is built using the following main technologies:

- **Node.js:** A JavaScript runtime environment for executing server-side code.
- **Express 5.1.0:** A minimalist and flexible Node.js web application framework used for building the API.
- **TypeScript 5.8.3:** A superset of JavaScript that adds static typing, improving code quality and maintainability. The code is compiled to JavaScript (evident from `scripts.build: "tsc"` in `package.json`).
- **MySQL (via `mysql2` 3.14.1):** A relational database used for data persistence.
- **JSON Web Tokens (JWT) (via `jsonwebtoken` 9.0.2):** Used for stateless authentication.
- **bcrypt 6.0.0:** A library for hashing passwords before storing them in the database.
- **dotenv 16.5.0:** Used for managing environment variables.
- **cors 2.8.5:** Middleware to enable Cross-Origin Resource Sharing.

## 2. Key Directories and Files

The `backend/src` directory contains the core of the application:

- **`backend/src/`**: Root source directory.
    - **`server.ts`**: The main entry point of the backend application. It initializes the Express server, sets up middleware (CORS, JSON parsing), registers API routes, and starts listening for requests. It also includes basic error handling middleware.
    - **`db.ts`**: Configures and exports the MySQL database connection pool using `mysql2/promise`. It reads database credentials from environment variables.
    - **`config.ts`**: Exports configuration values, primarily the `JWT_SECRET` read from environment variables, with a fallback.
    - **`database_schema.sql`**: Contains the SQL DDL statements to create the database (`cv_builder_db`) and its tables (`users`, `cv_templates`, `cvs`). It also includes seed data for `cv_templates`.

- **`backend/src/routes/`**: Contains modules that define the API routes.
    - **`auth/authRoutes.ts`**: Defines routes for user authentication, specifically registration (`/register`) and login (`/login`).
    - **`cvs/cvRoutes.ts`**: Defines CRUD (Create, Read, Update, Delete) routes for managing CVs. These routes are protected, meaning they require authentication.
    - **`cvs/cvTemplateRoutes.ts`**: Defines routes for fetching CV templates. Currently, it allows fetching all templates.
    - **`users/userRoutes.ts`**: Defines routes for user profile management (get and update current user's profile). These routes are protected.

- **`backend/src/middleware/`**: Contains custom middleware functions.
    - **`authMiddleware.ts`**:
        - `protect`: Verifies JWT tokens from the `Authorization` header to protect routes. It attaches user information to the request object (`req.user`).
        - `admin`: Checks if the authenticated user has admin privileges. This is used to protect admin-specific routes.

## 3. API Endpoint Structure and Examples

The API routes are prefixed with `/api` as defined in `server.ts`.

- **Authentication (`/api/auth`)**:
    - `POST /api/auth/register`: Creates a new user. Expects `username`, `email`, and `password` in the request body. Returns a JWT and user information.
    - `POST /api/auth/login`: Logs in an existing user. Expects `email` and `password`. Returns a JWT and user information.

- **Users (`/api/users`)**:
    - `GET /api/users/me`: Fetches the profile of the currently authenticated user. Protected by `protect` middleware.
    - `PUT /api/users/me`: Updates the profile (username, email, password) of the currently authenticated user. Protected by `protect` middleware.

- **CVs (`/api/cvs`)**: All routes are protected by `protect` middleware.
    - `POST /api/cvs`: Creates a new CV. Expects `cv_data` (JSON), `template_id` (optional), and `name` (optional).
    - `GET /api/cvs`: Retrieves all CVs for the authenticated user.
    - `GET /api/cvs/:id`: Retrieves a specific CV by its ID, belonging to the authenticated user.
    - `PUT /api/cvs/:id`: Updates a specific CV by its ID. Expects `cv_data`, `template_id`, or `name`.
    - `DELETE /api/cvs/:id`: Deletes a specific CV by its ID.

- **CV Templates (`/api/cv-templates`)**:
    - `GET /api/cv-templates`: Retrieves a list of all available CV templates. This route is public.

## 4. Authentication Mechanism

- Authentication is handled using **JSON Web Tokens (JWT)**.
- When a user logs in or registers, the server generates a JWT signed with the `JWT_SECRET` (from `config.ts`). This token typically includes `userId`, `username`, and `isAdmin` status in its payload and has an expiration time (e.g., '1h').
- The client is expected to send this JWT in the `Authorization` header with the `Bearer` scheme for requests to protected routes.
- The **`protect` middleware** (`backend/src/middleware/authMiddleware.ts`) intercepts requests to protected routes:
    - It extracts the token from the `Authorization: Bearer <token>` header.
    - It verifies the token using `jwt.verify()` and the `JWT_SECRET`.
    - If the token is valid, it decodes the payload and attaches user information (e.g., `userId`, `username`, `isAdmin`) to the `req.user` object. The request then proceeds to the route handler.
    - If the token is missing, invalid, or expired, it sends a `401 Unauthorized` response.
- The **`admin` middleware** can be used in conjunction with `protect` to further restrict access to routes that require administrative privileges by checking the `req.user.isAdmin` flag.

## 5. Database Interaction

- The application uses a **MySQL** database.
- Database connection is managed by `backend/src/db.ts`, which sets up a connection pool using the `mysql2/promise` library. Connection parameters (host, user, password, database name) are loaded from environment variables.
- The database schema is defined in `backend/src/database_schema.sql`. It includes tables:
    - **`users`**: Stores user information including `id`, `username`, `email`, `password_hash`, and `is_admin` status.
    - **`cv_templates`**: Stores information about available CV templates like `id`, `name`, `description`, and `preview_image_url`.
    - **`cvs`**: Stores user-created CVs, including `id`, `user_id` (foreign key to `users`), `template_id` (foreign key to `cv_templates`), `cv_data` (stored as JSON), and `name`.
- Route handlers in `backend/src/routes/` interact with the database by executing SQL queries using the connection pool (e.g., `pool.query(...)`).
- Passwords are not stored in plaintext; they are hashed using `bcrypt` before being saved to the `users` table (as seen in `authRoutes.ts`).

## 6. Server Startup

- The server is started by running the `backend/src/server.ts` file (or its compiled JavaScript equivalent in `dist/server.js`).
- `package.json` defines the following scripts:
    - `npm run build`: Compiles TypeScript files from `src` to JavaScript in the `dist` directory using `tsc`.
    - `npm start`: Runs the compiled application using `node dist/server.js`. This is typically used for production.
    - `npm run dev`: Runs the application in development mode using `nodemon src/server.ts`, which automatically restarts the server on file changes.
- The server listens on a port defined by the `PORT` environment variable, defaulting to `3001`.
- Upon starting, it logs a message "Server is running on port [port]" to the console.

This structure represents a typical Node.js Express application with clear separation of concerns for routing, database interaction, configuration, and authentication.
