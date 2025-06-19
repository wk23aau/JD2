# Data Flow Documentation

This document describes the data flow within the AI CV Maker application, detailing how the frontend, backend, and Nginx interact for various user operations.

## 1. Overview of Components in Data Flow

- **Frontend (React/TypeScript)**: User interface for interaction. Makes API calls to the backend. Hosted as static files (HTML, CSS, JS) built by Vite.
    - Key Pages: `LoginPage.tsx`, `SignupPage.tsx`, `DashboardPage.tsx`, `EditorPage.tsx`.
    - Key Components: `ProtectedRoute.tsx`, `AdminProtectedRoute.tsx`.
    - Services: Modules in `src/services/` likely encapsulate API call logic (e.g., using `fetch` or `axios`).
- **Backend (Node.js/Express/TypeScript)**: Handles business logic, database interactions, and authentication. Exposes a RESTful API.
    - API Prefix: `/api`.
    - Key Routes: `/api/auth`, `/api/users`, `/api/cvs`.
    - Middleware: `authMiddleware.ts` (`protect`, `admin`) for securing routes.
- **Nginx**: Web server that serves the static frontend assets and acts as a reverse proxy for API requests to the backend.
- **Database (MySQL)**: Stores user data, CVs, and templates.

## 2. Role of Nginx

Nginx plays a critical role in routing requests:

1.  **Serving Frontend**:
    *   When a user accesses the application URL (e.g., `http://localhost:8080` if Nginx is mapped to host port 8080), Nginx receives the request.
    *   For any path that is not `/api/...`, Nginx serves static files (HTML, CSS, JavaScript) from `/usr/share/nginx/html` (the build output of the Vite frontend).
    *   The `try_files $uri $uri/ /index.html;` configuration ensures that for any non-file path (typical for SPA routing), `index.html` is served, allowing React Router to handle frontend navigation.

2.  **Proxying API Requests**:
    *   Any request from the frontend to a path starting with `/api` (e.g., `/api/auth/login`, `/api/cvs`) is intercepted by Nginx.
    *   The `location /api { ... }` block in `nginx.conf` proxies these requests to the backend server, configured as `proxy_pass http://host.docker.internal:3001;`. This means Nginx forwards the request to the backend application listening on port 3001 (likely running on the host machine when Nginx is in a Docker container, or another linked container).
    *   Nginx also sets important headers like `X-Real-IP` and `X-Forwarded-For`.

This setup allows the frontend and backend to be developed and deployed somewhat independently, with Nginx managing how they are exposed to the end-user and how they communicate.

## 3. User Registration and Login Flow

1.  **User Interaction (Frontend)**:
    *   **Registration**: The user fills out the registration form in `src/pages/SignupPage.tsx` (fields: username, email, password).
    *   **Login**: The user fills out the login form in `src/pages/LoginPage.tsx` (fields: email, password).

2.  **API Request (Frontend to Nginx to Backend)**:
    *   On form submission, the frontend (likely via a service function) makes a `POST` request:
        *   Registration: `POST /api/auth/register` with username, email, and password in the request body.
        *   Login: `POST /api/auth/login` with email and password in the request body.
    *   Nginx receives this request and proxies it to the backend's `/api/auth/register` or `/api/auth/login` endpoint.

3.  **Processing (Backend)**:
    *   **Registration**:
        *   The backend's `authRoutes.ts` receives the request.
        *   It validates the input.
        *   It checks if the user already exists in the `users` table (MySQL).
        *   It hashes the password using `bcrypt`.
        *   It inserts the new user into the `users` table.
        *   It generates a JWT (JSON Web Token) containing user details (e.g., `userId`, `username`, `isAdmin`).
    *   **Login**:
        *   The backend's `authRoutes.ts` receives the request.
        *   It validates the input.
        *   It finds the user by email in the `users` table.
        *   It compares the provided password with the stored `password_hash` using `bcrypt.compare()`.
        *   If credentials are valid, it generates a JWT.

4.  **API Response (Backend to Nginx to Frontend)**:
    *   The backend sends a JSON response:
        *   Success: Typically a `200 OK` (login) or `201 Created` (registration) status, containing the JWT and some user information.
        *   Error: An appropriate HTTP error status (e.g., `400 Bad Request`, `401 Unauthorized`, `409 Conflict`).
    *   Nginx relays this response back to the frontend.

5.  **Token Handling (Frontend)**:
    *   On successful login/registration, the frontend receives the JWT.
    *   It will typically store this token in `localStorage` or `sessionStorage` to persist the user's session.
    *   It will then likely redirect the user to a protected page (e.g., `/dashboard`).

## 4. CV Creation, Retrieval, Update, and Deletion (CRUD) Operations

These operations typically occur in `src/pages/EditorPage.tsx` (for creating/editing individual CVs) and `src/pages/DashboardPage.tsx` (for listing and managing CVs).

1.  **User Interaction (Frontend)**:
    *   **Create**: User clicks a "Create New CV" button, potentially chooses a template (`ThemeSelectorPanel.tsx`), and inputs data into `ContentEditorPanel.tsx`.
    *   **Read (List)**: User navigates to `DashboardPage.tsx` to see a list of their CVs.
    *   **Read (Single)**: User clicks on a specific CV in the dashboard to open it in `EditorPage.tsx`.
    *   **Update**: User modifies CV data in `EditorPage.tsx` using `ContentEditorPanel.tsx` and saves changes.
    *   **Delete**: User clicks a "Delete CV" button, likely on the `DashboardPage.tsx` or `EditorPage.tsx`.

2.  **API Request (Frontend to Nginx to Backend)**:
    *   The frontend makes an API call (e.g., using service functions). **Crucially, for these protected routes, the JWT stored earlier must be included in the `Authorization` header as a Bearer token.**
        *   `POST /api/cvs`: (Create) Sends CV data (JSON), `template_id` (optional), `name` (optional).
        *   `GET /api/cvs`: (Read List) Fetches all CVs for the authenticated user.
        *   `GET /api/cvs/:id`: (Read Single) Fetches a specific CV by its ID.
        *   `PUT /api/cvs/:id`: (Update) Sends updated CV data (JSON), `template_id`, or `name`.
        *   `DELETE /api/cvs/:id`: (Delete) Deletes a specific CV.
    *   Nginx proxies these requests to the backend's `/api/cvs` routes.

3.  **Processing (Backend)**:
    *   The backend's `cvRoutes.ts` handles these requests.
    *   **Authentication Check**: The `protect` middleware (`authMiddleware.ts`) runs first. It verifies the JWT from the `Authorization` header. If the token is missing, invalid, or expired, it returns a `401 Unauthorized` error, and the request does not proceed to the route handler. If valid, `req.user` is populated.
    *   **Database Operation**:
        *   Create: Inserts a new record into the `cvs` table, linking to `user_id` from `req.user`. `cv_data` is stored as JSON.
        *   Read (List/Single): Queries the `cvs` table for records matching `user_id` (and `id` for single). Parses `cv_data` from JSON string to object before sending.
        *   Update: Modifies an existing record in the `cvs` table after verifying `user_id`.
        *   Delete: Removes a record from the `cvs` table after verifying `user_id`.

4.  **API Response (Backend to Nginx to Frontend)**:
    *   The backend sends a JSON response (e.g., the created/updated CV, list of CVs, success message, or error message).
    *   Nginx relays this response to the frontend.

5.  **UI Update (Frontend)**:
    *   The frontend updates its state based on the response, re-rendering components to display the new/updated CV, list of CVs, or confirmation messages.

## 5. Protected Routes and Token Usage

-   **Frontend Protection**:
    *   React components like `ProtectedRoute.tsx` and `AdminProtectedRoute.tsx` (defined in `src/components/auth/`) guard frontend routes.
    *   These components typically check if a JWT exists in `localStorage` or `sessionStorage`.
    *   They might also decode the token to check for expiration or roles (like `isAdmin` for `AdminProtectedRoute`).
    *   If the token is missing or invalid (or user doesn't have required role), the user is redirected (e.g., to `/login`).

-   **Backend Protection**:
    *   As described above, the `protect` middleware in `authMiddleware.ts` on the backend secures API endpoints.

-   **Token in API Requests**:
    *   For every API request to a protected backend endpoint, the frontend must retrieve the stored JWT and include it in the `Authorization` header: `Authorization: Bearer <YOUR_JWT>`.
    *   This is how the backend's `protect` middleware can authenticate the user making the request.

This comprehensive data flow ensures secure and efficient communication between the user's browser, the webserver, the application server, and the database, enabling the full functionality of the AI CV Maker.
