# AI CV Maker Backend API Documentation

This document provides details about the API endpoints for the AI CV Maker backend.

## Base URL

All API endpoints are prefixed with `/api`. For example, if the backend is running on `http://localhost:3001`, the full URL for an endpoint like `/auth/login` would be `http://localhost:3001/api/auth/login`.

## Authentication

- Most endpoints require authentication using a JSON Web Token (JWT).
- The JWT should be sent in the `Authorization` header with the `Bearer` scheme:
  `Authorization: Bearer <YOUR_JWT_TOKEN>`
- Endpoints that require authentication are marked as "Authentication: User Token Required". Public endpoints do not require a token.

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1. Register New User

*   **HTTP Method:** `POST`
*   **Path:** `/register`
*   **Description:** Creates a new user account with email and password.
*   **Authentication:** Public
*   **Request Body (JSON):**
    ```json
    {
      "username": "newuser",
      "email": "user@example.com",
      "password": "password123"
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 1,
        "username": "newuser",
        "email": "user@example.com",
        "isAdmin": false,
        "createdAt": "2023-01-01T12:00:00.000Z"
      }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Missing required fields, password too short.
    *   `409 Conflict`: User with this email or username already exists.
    *   `500 Internal Server Error`: Server-side error during user creation.

### 1.2. Log In User

*   **HTTP Method:** `POST`
*   **Path:** `/login`
*   **Description:** Authenticates an existing user and returns a JWT.
*   **Authentication:** Public
*   **Request Body (JSON):**
    ```json
    {
      "email": "user@example.com",
      "password": "password123"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 1,
        "username": "testuser",
        "email": "user@example.com",
        "isAdmin": false
      }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Missing email or password.
    *   `401 Unauthorized`: Invalid credentials, or account is OAuth-only.
    *   `500 Internal Server Error`: Server-side error.

### 1.3. Initiate Google OAuth 2.0

*   **HTTP Method:** `GET`
*   **Path:** `/google`
*   **Description:** Redirects the user to Google's OAuth 2.0 consent screen to begin the Google Sign-In process.
*   **Authentication:** Public
*   **Request Body:** None
*   **Response:**
    *   `302 Found`: Redirects to Google's authentication service.

### 1.4. Google OAuth 2.0 Callback

*   **HTTP Method:** `GET`
*   **Path:** `/google/callback`
*   **Description:** Handles the callback from Google after the user has authenticated with Google. This endpoint is typically called by Google's redirect. If successful, it issues a JWT for the user and redirects to a frontend URL.
*   **Authentication:** Public (Interaction is with Google)
*   **Request Body:** None (Google provides `code` and `state` as query parameters)
*   **Success Response:**
    *   `302 Found`: Redirects to a frontend URL (e.g., `/auth/google/callback_success`) with `token` and `user` (JSON string) as query parameters.
      Example: `http://yourfrontend.com/auth/google/callback_success?token=YOUR_JWT&user={"id":2,"username":"googleuser",...}`
*   **Failure Response (Redirect to Frontend Login):**
    *   `302 Found`: Redirects to the frontend login page (e.g., `/login`) with `oauth_error` and `message` query parameters if there's an issue (e.g., email conflict, user denied access, Google error).
      Example: `http://yourfrontend.com/login?oauth_error=google_conflict&message=Email already registered locally.`

---

## 2. CV Templates Endpoints (`/api/cv-templates`)

### 2.1. List All CV Templates

*   **HTTP Method:** `GET`
*   **Path:** `/`
*   **Description:** Retrieves a list of all available CV templates.
*   **Authentication:** Public
*   **Request Body:** None
*   **Success Response (200 OK):**
    ```json
    [
      {
        "id": "classic",
        "name": "Classic",
        "description": "A timeless and traditional CV template...",
        "image_url": "/images/templates/classic_preview.png",
        "default_theme_settings": { "fontFamily": "Times New Roman", ... }
      },
      {
        "id": "modern",
        "name": "Modern",
        "description": "A sleek and contemporary CV template...",
        "image_url": "/images/templates/modern_preview.png",
        "default_theme_settings": { "fontFamily": "Arial", ... }
      }
      // ... more templates
    ]
    ```
*   **Error Responses:**
    *   `500 Internal Server Error`: If there's an issue fetching templates.

### 2.2. Get Specific CV Template by ID

*   **HTTP Method:** `GET`
*   **Path:** `/:templateId`
*   **Description:** Retrieves details for a specific CV template by its ID.
*   **Authentication:** Public
*   **Request Body:** None
*   **URL Parameters:**
    *   `templateId` (string, required): The ID of the template (e.g., "classic").
*   **Success Response (200 OK):**
    ```json
    {
      "id": "classic",
      "name": "Classic",
      "description": "A timeless and traditional CV template...",
      "image_url": "/images/templates/classic_preview.png",
      "default_theme_settings": { "fontFamily": "Times New Roman", ... }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If `templateId` is missing or invalid.
    *   `404 Not Found`: If no template with the given ID exists.
    *   `500 Internal Server Error`: Server-side error.

---

## 3. User CV Management Endpoints (`/api/cvs`)

**Authentication: User Token Required for all endpoints in this section.**

### 3.1. Create New CV

*   **HTTP Method:** `POST`
*   **Path:** `/`
*   **Description:** Creates a new CV for the authenticated user.
*   **Request Body (JSON):**
    ```json
    {
      "cv_data": {
        "personalInfo": { "name": "John Doe", ... },
        "summary": "...",
        "experience": [],
        "education": [],
        "skills": []
      },
      "title": "My First CV", // Optional, defaults to "Untitled CV"
      "description": "A CV for software engineering roles.", // Optional
      "template_id": "classic" // Optional
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
      "id": 123,
      "user_id": 1,
      "title": "My First CV",
      "description": "A CV for software engineering roles.",
      "cv_data": { ... }, // Full CV data
      "template_id": "classic",
      "created_at": "2023-01-01T13:00:00.000Z",
      "updated_at": "2023-01-01T13:00:00.000Z"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Missing `cv_data` or other validation errors.
    *   `401 Unauthorized`: Invalid or missing JWT.
    *   `500 Internal Server Error`.

### 3.2. List User's CVs

*   **HTTP Method:** `GET`
*   **Path:** `/`
*   **Description:** Retrieves a list of all CVs belonging to the authenticated user.
*   **Request Body:** None
*   **Success Response (200 OK):**
    ```json
    [
      {
        "id": 123,
        "user_id": 1,
        "title": "My First CV",
        "description": "A CV for software engineering roles.",
        "template_id": "classic",
        "created_at": "2023-01-01T13:00:00.000Z",
        "updated_at": "2023-01-01T13:00:00.000Z"
        // Note: cv_data might be excluded from list view for brevity
      },
      // ... more CVs
    ]
    ```
*   **Error Responses:**
    *   `401 Unauthorized`.
    *   `500 Internal Server Error`.

### 3.3. Get Specific User CV

*   **HTTP Method:** `GET`
*   **Path:** `/:cvId`
*   **Description:** Retrieves a specific CV by its ID, ensuring it belongs to the authenticated user.
*   **URL Parameters:**
    *   `cvId` (integer, required): The ID of the CV.
*   **Success Response (200 OK):**
    ```json
    {
      "id": 123,
      "user_id": 1,
      "title": "My First CV",
      "description": "A CV for software engineering roles.",
      "cv_data": { ... }, // Full CV data
      "template_id": "classic",
      "created_at": "2023-01-01T13:00:00.000Z",
      "updated_at": "2023-01-01T13:00:00.000Z"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid `cvId` format.
    *   `401 Unauthorized`.
    *   `404 Not Found`: CV not found or does not belong to the user.
    *   `500 Internal Server Error`.

### 3.4. Update User CV

*   **HTTP Method:** `PUT`
*   **Path:** `/:cvId`
*   **Description:** Updates a specific CV belonging to the authenticated user.
*   **URL Parameters:**
    *   `cvId` (integer, required): The ID of the CV to update.
*   **Request Body (JSON):** (Include only fields to be updated)
    ```json
    {
      "title": "Updated CV Title",
      "cv_data": { ... }, // Updated full CV data object
      "template_id": "modern"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "id": 123,
      "user_id": 1,
      "title": "Updated CV Title",
      // ... other fields, reflecting updates
      "cv_data": { ... },
      "template_id": "modern",
      "updated_at": "2023-01-01T14:00:00.000Z"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid `cvId` or empty request body.
    *   `401 Unauthorized`.
    *   `404 Not Found`: CV not found or does not belong to the user.
    *   `500 Internal Server Error`.

### 3.5. Delete User CV

*   **HTTP Method:** `DELETE`
*   **Path:** `/:cvId`
*   **Description:** Deletes a specific CV belonging to the authenticated user.
*   **URL Parameters:**
    *   `cvId` (integer, required): The ID of the CV to delete.
*   **Success Response (204 No Content):**
    *   No response body.
*   **Error Responses:**
    *   `400 Bad Request`: Invalid `cvId` format.
    *   `401 Unauthorized`.
    *   `404 Not Found`: CV not found or does not belong to the user.
    *   `500 Internal Server Error`.

---

## 4. User Profile Endpoints (`/api/users`)

**Authentication: User Token Required for all endpoints in this section.**

### 4.1. Get User Profile

*   **HTTP Method:** `GET`
*   **Path:** `/me`
*   **Description:** Retrieves the profile of the currently authenticated user.
*   **Request Body:** None
*   **Success Response (200 OK):**
    ```json
    {
      "id": 1,
      "username": "currentuser",
      "email": "user@example.com",
      "oauth_provider": "google", // or null
      "created_at": "2023-01-01T12:00:00.000Z",
      "updated_at": "2023-01-01T12:30:00.000Z",
      "is_admin": false
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`.
    *   `404 Not Found`: User associated with token not found (highly unlikely).
    *   `500 Internal Server Error`.

### 4.2. Update User Profile

*   **HTTP Method:** `PUT`
*   **Path:** `/me`
*   **Description:** Updates the profile of the currently authenticated user. Currently supports updating `username`.
*   **Request Body (JSON):**
    ```json
    {
      "username": "newusername"
      // "email": "newemail@example.com" // Future: Email updates would require verification
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "id": 1,
      "username": "newusername",
      "email": "user@example.com", // Assuming email wasn't changed or isn't updatable here
      "oauth_provider": "google",
      "created_at": "2023-01-01T12:00:00.000Z",
      "updated_at": "2023-01-01T14:30:00.000Z", // Reflects update time
      "is_admin": false
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Missing or invalid `username`.
    *   `401 Unauthorized`.
    *   `409 Conflict`: If the new username is already taken.
    *   `500 Internal Server Error`.

---

## 5. AI Suggestion Endpoints (`/api/ai`)

**Authentication: User Token Required for all endpoints in this section.**

### 5.1. Generate CV Summary Suggestion

*   **HTTP Method:** `POST`
*   **Path:** `/suggest/summary`
*   **Description:** Generates a CV summary based on provided CV data and optional job description or user preferences.
*   **Request Body (JSON):**
    ```json
    {
      "existingCvData": {
        "personalInfo": { "title": "Software Developer" },
        "experience": [{ "jobTitle": "Backend Engineer" }],
        "skills": [{ "category": "Programming", "skills": ["Node.js", "Python"] }]
      },
      "jobDescription": "Optional: A job description to tailor the summary for.",
      "userPreferences": { "tone": "professional" } // Optional: e.g., tone: "creative", "concise"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "summary": "A professionally generated CV summary tailored to your input..."
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid or missing input parameters.
    *   `401 Unauthorized`: Invalid or missing JWT.
    *   `500 Internal Server Error`: General server-side error.
    *   `503 Service Unavailable`: If the AI service (Gemini API) is unavailable, API key is invalid, or quota is exceeded.

### 5.2. Generate Work Experience Bullet Points

*   **HTTP Method:** `POST`
*   **Path:** `/suggest/experience`
*   **Description:** Generates bullet points for a work experience entry based on provided details.
*   **Request Body (JSON):**
    ```json
    {
      "jobTitle": "Software Engineer",
      "company": "Innovatech Solutions",
      "responsibilitiesContext": "Developed and launched three major features for a SaaS platform, focusing on backend services and database optimization.",
      "keywords": ["API design", "database performance", "user authentication"] // Optional
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "bulletPoints": [
        "Engineered and deployed three critical features for a high-traffic SaaS platform, enhancing backend service capabilities.",
        "Optimized database schemas and queries, resulting in a 20% improvement in data retrieval times.",
        "Implemented robust user authentication mechanisms, improving security and user data integrity."
      ]
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Missing required fields like `jobTitle` or `company`.
    *   `401 Unauthorized`: Invalid or missing JWT.
    *   `500 Internal Server Error`: General server-side error.
    *   `503 Service Unavailable`: If the AI service (Gemini API) is unavailable or encounters issues.

---
