# Frontend Structure Documentation

This document outlines the structure and key aspects of the AI CV Maker frontend application.

## 1. Main Technologies Used

The frontend is built using the following main technologies:

- **React 19.1.0:** A JavaScript library for building user interfaces.
- **Vite 6.2.0:** A modern frontend build tool that provides a faster and leaner development experience.
- **TypeScript ~5.7.2:** A superset of JavaScript that adds static typing, improving code quality and maintainability.
- **React Router DOM 7.6.2:** For declarative routing in the React application.
- **@google/genai 1.5.1:** Likely used for interacting with Google's Generative AI services.

## 2. Overview of Key Directories

The `src` directory contains the core of the application, organized as follows:

- **`src/`**: Root source directory.
    - **`App.tsx`**: The main application component, responsible for setting up routing and overall layout.
    - **`index.tsx`**: The entry point of the React application, rendering the `App` component into the DOM.
    - **`index.css`**: Global stylesheets for the application.
    - **`constants.tsx`**: Likely contains application-wide constants.
    - **`types.ts`**: Contains TypeScript type definitions used throughout the project.

- **`src/components/`**: Contains reusable UI components.
    - **`auth/`**: Components related to authentication and authorization.
        - `AdminProtectedRoute.tsx`: A higher-order component to protect routes requiring admin privileges.
        - `ProtectedRoute.tsx`: A higher-order component to protect routes requiring user authentication.
    - **`cv_templates/`**: Components for different CV template styles.
        - `ClassicTemplate.tsx`: A component for rendering a CV in a classic format.
        - `ModernTemplate.tsx`: A component for rendering a CV in a modern format.
    - **`layout/`**: Components defining the overall page structure.
        - `MainFooter.tsx`: The main application footer.
        - `MainHeader.tsx`: The main application header.
    - **`panels/`**: Components for specific UI panels, likely for editing or selection.
        - `ContentEditorPanel.tsx`: A panel for editing CV content.
        - `ThemeSelectorPanel.tsx`: A panel for selecting CV themes.
    - **`shared/`**: Common, smaller UI components used across different parts of the application.
        - `ErrorMessage.tsx`: A component to display error messages.
        - `LoadingSpinner.tsx`: A component to indicate loading states.

- **`src/pages/`**: Contains components that represent different pages/views of the application.
    - `AdminDashboardPage.tsx`: Page for the admin dashboard.
    - `DashboardPage.tsx`: Page for the user's dashboard.
    - `EditorPage.tsx`: Page for the CV editor.
    - `LandingPage.tsx`: The application's landing page.
    - `LoginPage.tsx`: Page for user login.
    - `NotFoundPage.tsx`: Page displayed when a route is not found.
    - `SignupPage.tsx`: Page for user registration.

- **`src/services/`**: Contains modules for interacting with external services or handling business logic.
    - `analyticsService.ts`: Module for tracking page views and other analytics events.
    - `geminiService.ts`: Module for interacting with the Gemini AI service (likely via `@google/genai`).

- **`src/assets/`**: (Not explicitly listed in `ls` output, but a common convention) This directory would typically store static assets like images, fonts, etc.

## 3. Important UI Components and Their Roles

Based on the file structure, key UI components include:

- **`MainHeader.tsx`**: Renders the main navigation and branding at the top of most pages.
- **`MainFooter.tsx`**: Renders the footer content at the bottom of most pages.
- **`CVPreview.tsx`**: (Located in `src/components/`) Likely responsible for displaying a preview of the CV being edited or generated. This component would work in conjunction with template components like `ClassicTemplate.tsx` and `ModernTemplate.tsx`.
- **`ContentEditorPanel.tsx`**: (Located in `src/components/panels/`) Provides the UI for users to input and edit the content of their CV (e.g., personal details, work experience, education).
- **`ThemeSelectorPanel.tsx`**: (Located in `src/components/panels/`) Allows users to choose different themes or templates for their CV.
- **`LoadingSpinner.tsx`**: Used to indicate that data is being fetched or a page/component is loading.
- **`ErrorMessage.tsx`**: Used to display user-friendly error messages.
- Template Components (`ClassicTemplate.tsx`, `ModernTemplate.tsx`): Responsible for the visual presentation of the CV data in different styles.

## 4. Routing Setup

Routing is managed by `react-router-dom` as configured in `src/App.tsx`:

- **`BrowserRouter`**: Wraps the application to enable HTML5 history API-based routing.
- **`Routes` and `Route`**: Define the different navigation paths and the components they render.
- **Lazy Loading**: Pages are lazy-loaded using `React.lazy()` and `Suspense` to improve initial load time. A `LoadingSpinner` is shown as a fallback during loading.
- **`AppLayout` Component**: A layout component that includes `MainHeader`, `MainFooter`, and an `Outlet` for rendering nested route components. This provides a consistent structure for most pages.
- **Protected Routes**:
    - `ProtectedRoute.tsx`: Ensures that certain routes (e.g., `/editor`, `/dashboard`) are only accessible to authenticated users.
    - `AdminProtectedRoute.tsx`: Ensures that routes like `/admin` are only accessible to users with admin privileges.
- **Specific Routes**:
    - `/`: `LandingPage`
    - `/editor`: `EditorPage` (protected)
    - `/editor/:cvId`: `EditorPage` for editing an existing CV (protected)
    - `/dashboard`: `DashboardPage` (protected)
    - `/admin`: `AdminDashboardPage` (admin protected)
    - `/login`: `LoginPage` (rendered outside `AppLayout` for a full-screen experience)
    - `/signup`: `SignupPage` (rendered outside `AppLayout` for a full-screen experience)
    - `*`: `NotFoundPage` for any unmatched routes.
- **Analytics**: An `AnalyticsPageViewTracker` component uses `useEffect` and `useLocation` to track page views via `analyticsService.ts`.

## 5. State Management

- The provided files do **not** explicitly show the use of a global state management library like Redux or Zustand.
- `src/App.tsx` mentions: "// Auth context/state would typically be managed here or in a dedicated provider". This suggests that authentication state might be managed using React Context or is planned to be.
- Component-level state (using `useState`, `useReducer`) is likely used within individual components as needed.
- Data fetching and service interactions are handled in the `src/services/` directory, which might involve local state management within components that use these services.

## 6. Build Process

The build process is defined by Vite and configured in `vite.config.ts` and `package.json`:

- **`package.json` scripts**:
    - `dev`: Runs the Vite development server (`vite`).
    - `build`: Creates a production build of the application (`vite build`).
    - `preview`: Serves the production build locally for previewing (`vite preview`).
- **`vite.config.ts`**:
    - **Environment Variables**: Uses `loadEnv` to load environment variables. Specifically, `GEMINI_API_KEY` is made available in the frontend code as `process.env.API_KEY` and `process.env.GEMINI_API_KEY`.
    - **Aliases**: Configures an alias `@` to point to the root directory (`.`) for easier imports (`resolve: { alias: { '@': path.resolve(__dirname, '.') } }`).
    - **Module Type**: `package.json` specifies `"type": "module"`, indicating the project uses ES modules.
    - **Output**: Vite bundles the code into static assets (HTML, CSS, JavaScript) suitable for deployment. The default output directory for `vite build` is usually `dist/`.

This structure indicates a well-organized, modern React application leveraging TypeScript for type safety and Vite for an efficient development and build process.
