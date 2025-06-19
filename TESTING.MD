# Manual Testing Checklist for Google OAuth Functionality

This document provides a checklist for manually testing the Google OAuth login and sign-up features.

## I. Prerequisites

*   Ensure the backend and frontend applications are running.
*   Ensure you have valid Google OAuth credentials configured in the backend's environment variables (`.env` file).
*   Have at least one test Google account. For some tests, having access to a second Google account can be beneficial.
*   Access to the application's database to verify user creation and state.

## II. Test Cases

---

### 1. Successful Sign-up with Google

*   **Test ID:** G-SIGNUP-001
*   **Description:** Verify a new user can successfully sign up using their Google account.
*   **Steps:**
    1.  Navigate to the application's signup page.
    2.  Click the "Sign up with Google" button.
    3.  If prompted by Google, choose the desired Google account.
    4.  On Google's consent screen, grant the necessary permissions.
    5.  Observe redirection back to the application.
*   **Expected Results:**
    *   User is redirected to Google's consent screen.
    *   After consenting, the user is redirected back to the application (e.g., to `/auth/google/callback_success` initially, then to the dashboard).
    *   A new user account is created in the `users` table in the database.
        *   Verify `google_id` is populated with the correct Google user ID.
        *   Verify `email` matches the Google account's email.
        *   Verify `username` is created (e.g., from email prefix or display name).
        *   Verify `oauth_provider` is set to 'google'.
        *   Verify `password_hash` is `NULL`.
    *   User is logged into the application.
    *   User is redirected to the main dashboard or a designated post-login page.

---

### 2. Successful Sign-in with Google (Existing Google User)

*   **Test ID:** G-SIGNIN-001
*   **Description:** Verify an existing user (who previously signed up/in with Google) can successfully sign in.
*   **Steps:**
    1.  Ensure the user from G-SIGNUP-001 is logged out.
    2.  Navigate to the application's login page.
    3.  Click the "Sign in with Google" button.
    4.  If prompted by Google, choose the same Google account used in G-SIGNUP-001. (Google might automatically proceed if the user has an active session and previously consented).
*   **Expected Results:**
    *   User is redirected to Google (may or may not see consent screen).
    *   User is redirected back to the application.
    *   User is logged into the application with their existing Google-linked account.
    *   User is redirected to the main dashboard.
    *   Verify in the database that no new user account was created.

---

### 3. Attempting Normal Login for Google-Registered Account

*   **Test ID:** G-LOGIN-FAIL-001
*   **Description:** Verify a user who signed up with Google cannot log in using the standard email/password form (if they haven't set a password separately).
*   **Steps:**
    1.  Use the account created/verified in G-SIGNUP-001 or G-SIGNIN-001. Ensure this user has no password set (i.e., `password_hash` is NULL).
    2.  Navigate to the login page.
    3.  Enter the Google account's email in the email field.
    4.  Enter any password (or leave blank if allowed by form).
    5.  Click the standard "Log In" button.
*   **Expected Results:**
    *   An error message is displayed on the login page, similar to: "This account was created using Google. Please log in with Google."
    *   User is not logged in.

---

### 4. Attempting Normal Registration for Existing Google-Registered Email

*   **Test ID:** G-REGISTER-FAIL-001
*   **Description:** Verify a user cannot create a new standard account with an email already associated with a Google-linked account.
*   **Steps:**
    1.  Use the email address from the account created/verified in G-SIGNUP-001 or G-SIGNIN-001.
    2.  Navigate to the signup page.
    3.  Enter a username, the Google-linked email, and a password in the standard registration form.
    4.  Click the standard "Sign Up" or "Create Account" button.
*   **Expected Results:**
    *   An error message is displayed on the signup page, similar to: "This email is registered using Google. Please log in with Google." (This message comes from the `registerHandler`).
    *   No new account is created.

---

### 5. Google Denies Permission

*   **Test ID:** G-CONSENT-DENY-001
*   **Description:** Verify the application handles cases where the user denies permission on Google's consent screen.
*   **Steps:**
    1.  Log out of the application. If possible, use a Google account that has not previously granted consent to this application, or revoke consent from Google account settings.
    2.  Navigate to the login or signup page.
    3.  Click "Sign in with Google" or "Sign up with Google".
    4.  On the Google consent screen, explicitly deny permission (look for a "Cancel", "Deny", or similar option).
*   **Expected Results:**
    *   User is redirected back to the application's login page.
    *   An error message is displayed on the login page, similar to: "Google Sign-In was cancelled or access was denied. Please try again." or "Google authentication failed: access_denied_by_user..." (or a generic failure message if specific codes aren't passed/parsed).
    *   User is not logged in.

---

### 6. Using an Email Already Registered Locally (Password User) to Sign up/in with Google

*   **Test ID:** G-CONFLICT-LOCAL-001
*   **Description:** Verify behavior when a user tries to sign up/in with Google using an email that already exists for a local (password-based) account.
*   **Steps:**
    1.  Create a standard user account via the email/password registration form (e.g., `localuser@example.com` with password `password123`). Ensure `oauth_provider` is NULL for this user.
    2.  Log out.
    3.  Navigate to the login or signup page.
    4.  Click "Sign in with Google" or "Sign up with Google".
    5.  Choose/authenticate with a Google account whose primary email is `localuser@example.com`.
*   **Expected Results:**
    *   The user is redirected back to the login page.
    *   An error message is displayed, similar to: "This email is already registered. Please log in with your password or use a different email." (This error originates from the backend `passportConfig.ts` logic).
    *   The existing local account is not modified (no `google_id` added). No new account is created with the Google details.

---

### 7. Revoking App Permissions from Google Account & Re-authenticating

*   **Test ID:** G-REVOKE-001
*   **Description:** Verify that if a user revokes the application's permissions from their Google account settings, they are prompted to grant permissions again upon the next Google Sign-in attempt.
*   **Steps:**
    1.  Successfully sign in to the application using Google (Test G-SIGNIN-001).
    2.  Log out of the application.
    3.  Go to the user's Google Account settings (usually under "Security" > "Third-party apps with account access" or similar).
    4.  Find the application in the list and revoke its permissions.
    5.  Navigate back to the application's login page.
    6.  Click "Sign in with Google" and select the same Google account.
*   **Expected Results:**
    *   User is redirected to Google's consent screen and prompted to grant permissions again.
    *   After granting permissions, the user is logged in successfully and redirected to the dashboard.

---

### 8. Multiple Google Accounts Signed In Browser

*   **Test ID:** G-MULTI-ACCOUNT-001
*   **Description:** Verify Google's account chooser is displayed if the user is signed into multiple Google accounts in their browser.
*   **Steps:**
    1.  In your web browser, sign into at least two different Google accounts.
    2.  Log out of the application.
    3.  Navigate to the application's login or signup page.
    4.  Click "Sign in with Google" or "Sign up with Google".
*   **Expected Results:**
    *   Google should display an account chooser screen, prompting the user to select which Google account they wish to use for authentication with the application.
    *   Selecting an account and proceeding should follow the normal sign-in/sign-up flow.

---

## III. Identified Areas for Future Automated Tests (Backend)

While this document focuses on manual testing, the following areas are prime candidates for automated backend testing:

1.  **Passport Strategy Logic (`backend/src/middleware/passportConfig.ts`):**
    *   The core logic within the `GoogleStrategy`'s verify callback (`async (accessToken, refreshToken, profile, done) => { ... }`) should be unit-tested.
    *   This involves:
        *   Mocking the `profile` object (with various attributes like existing email, new email, missing email, etc.).
        *   Mocking database interactions (`pool.query`) to simulate different scenarios (user found, user not found, email conflict with local account, database errors).
    *   **Test Scenarios:**
        *   Existing Google user found: `done(null, existingUser)` is called.
        *   New Google user (new email): A new user is correctly prepared and `done(null, newUser)` is called.
        *   Email from Google profile already exists for a local account: `done(new Error(...))` with the specific conflict message is called.
        *   Database error during user lookup: `done(error)` is called.
        *   Database error during user creation: `done(error)` is called.
        *   Google profile missing email (if this needs special handling).
        *   Username generation logic (fallback, uniqueness check).

2.  **Auth Routes (`backend/src/routes/auth/authRoutes.ts`):**
    *   **Google Callback Handler:** While full end-to-end OAuth flow is hard to automate in unit/integration tests, the logic *within* the `/api/auth/google/callback` route handler (the custom callback function) can be tested.
        *   Mock the `passport.authenticate` custom callback's behavior to simulate `err`, `user`, `info` arguments.
        *   Test that JWT generation occurs correctly for a successful `user`.
        *   Test that redirects are formulated correctly for success (to frontend callback page with token) and failure (to frontend login page with error query parameters).
    *   **Standard Login/Register Handlers:**
        *   Ensure existing tests (or add new ones) for the standard email/password `loginHandler` and `registerHandler` are updated to cover the checks for OAuth-linked accounts:
            *   `loginHandler`: Attempting to log in with email/password for an account where `oauth_provider` is 'google' and `password_hash` is NULL should return the specific error.
            *   `registerHandler`: Attempting to register with an email that already exists and is linked to a Google account should return the specific error.

This manual checklist and the identified areas for automated tests should help ensure the robustness and correctness of the Google OAuth integration.
