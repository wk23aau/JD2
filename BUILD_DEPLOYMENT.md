# Build and Deployment Process

This document describes the build and deployment process for the AI CV Maker application, covering the frontend, backend, and containerization strategy.

## 1. Frontend Build Process

-   **Technology**: The frontend is a React application built using Vite.
-   **Build Script**: The primary build command is defined in the root `package.json`:
    ```json
    "scripts": {
      "build": "vite build"
    }
    ```
    Running `npm run build` executes Vite, which bundles the React application (TypeScript, JSX, CSS, assets) into static HTML, JavaScript, and CSS files.
-   **Output Directory**: Vite places the build output into the `/app/dist` directory (within the build environment, as specified in the `Dockerfile`).
-   **Environment Variables during Build**:
    -   The `vite.config.ts` file is configured to load environment variables. Specifically, it looks for `GEMINI_API_KEY`.
    -   In the `Dockerfile`, `ARG GEMINI_API_KEY` declares a build-time argument, and `ENV VITE_GEMINI_API_KEY=$GEMINI_API_KEY` makes this argument available as an environment variable within the build stage.
    -   `vite.config.ts` then uses `loadEnv` to read `VITE_GEMINI_API_KEY` (which corresponds to the `GEMINI_API_KEY` passed during `docker build`) and defines `process.env.API_KEY` and `process.env.GEMINI_API_KEY` for the frontend code. This means the `GEMINI_API_KEY` is embedded into the static frontend files during the build process.

## 2. Backend Build and Run Process

-   **Technology**: The backend is a Node.js application written in TypeScript using the Express framework.
-   **Build Script**: The `backend/package.json` defines a build script:
    ```json
    "scripts": {
      "build": "tsc"
    }
    ```
    Running `npm run build` (within the `backend` directory) invokes the TypeScript compiler (`tsc`), which compiles the TypeScript source files (from `backend/src`) into JavaScript files, outputting them to the `backend/dist` directory.
-   **Run Scripts**:
    -   **Production (`npm start`)**:
        ```json
        "scripts": {
          "start": "node dist/server.js"
        }
        ```
        This command runs the compiled JavaScript application from the `dist` directory using Node.js. This is intended for production use after a build.
    -   **Development (`npm run dev`)**:
        ```json
        "scripts": {
          "dev": "nodemon src/server.ts"
        }
        ```
        This command uses `nodemon` to run the TypeScript application directly (via `ts-node`, which `nodemon` typically integrates with for `.ts` files, or a similar mechanism). `nodemon` watches for file changes and automatically restarts the server, which is suitable for development.
-   **Environment Variables at Runtime**:
    -   The backend relies on environment variables for configuration (e.g., `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `PORT`), as seen in `backend/src/db.ts` and `backend/src/config.ts`.
    -   These variables are typically provided to the backend process when it's started (e.g., via a `.env` file loaded by `dotenv`, or set directly in the deployment environment). The `Dockerfile` provided does not containerize the backend, so its runtime environment variable management is separate from the frontend's container.

## 3. Containerization (Frontend)

The project uses Docker to containerize the frontend application for deployment. This is defined in the `Dockerfile`:

-   **Multi-Stage Build**: The `Dockerfile` employs a multi-stage build to create a lean and optimized final image.

    -   **Stage 1: `build` (Node.js Environment)**
        1.  **Base Image**: `FROM node:18-alpine` provides a Node.js environment.
        2.  **Working Directory**: `WORKDIR /app` sets the context.
        3.  **Dependencies**: `COPY package*.json ./` and `RUN npm install` install frontend dependencies.
        4.  **Source Code**: `COPY src ./src`, `COPY vite.config.ts .`, etc., copy the necessary source files and configurations into the image.
        5.  **Build-time Argument for API Key**:
            ```dockerfile
            ARG GEMINI_API_KEY
            ENV VITE_GEMINI_API_KEY=$GEMINI_API_KEY
            ```
            This allows passing the `GEMINI_API_KEY` at build time (e.g., `docker build --build-arg GEMINI_API_KEY=your_api_key ...`). Vite then uses `VITE_GEMINI_API_KEY` to embed the key into the static files.
        6.  **Build Execution**: `RUN npm run build` compiles the React application, with the output going to `/app/dist`.

    -   **Stage 2: Nginx Server (Production Server)**
        1.  **Base Image**: `FROM nginx:stable-alpine` provides a lightweight Nginx server.
        2.  **Copy Build Artifacts**: `COPY --from=build /app/dist /usr/share/nginx/html` copies only the static build output from the `build` stage into Nginx's default web root directory.
        3.  **Nginx Configuration**: `COPY nginx.conf /etc/nginx/conf.d/default.conf` replaces the default Nginx configuration with the project-specific `nginx.conf`.
        4.  **Expose Port**: `EXPOSE 80` declares that the container listens on port 80.
        5.  **Run Nginx**: `CMD ["nginx", "-g", "daemon off;"]` starts the Nginx server in the foreground.

-   **Deployment**: The resulting Docker image contains the built frontend static assets served by Nginx. This image can then be deployed to any container hosting platform (e.g., Docker Hub, AWS ECS, Kubernetes).
    Example Docker build command:
    `docker build -t ai-cv-maker-frontend --build-arg GEMINI_API_KEY="your_actual_api_key" .`
    Example Docker run command:
    `docker run -d -p 8080:80 ai-cv-maker-frontend` (maps host port 8080 to container port 80)

## 4. Nginx Configuration in Docker

The `nginx.conf` file, copied into the Docker image, configures Nginx to:

1.  **Serve Static Frontend Assets**:
    -   `root /usr/share/nginx/html;` sets the document root to where the frontend's `dist` contents were copied.
    -   `index index.html index.htm;` defines default files.
    -   `location / { try_files $uri $uri/ /index.html; }` is crucial for Single Page Applications (SPAs) like React. It ensures that any requests that don't match a static file are redirected to `index.html`, allowing React Router to handle client-side routing.

2.  **Proxy API Requests**:
    -   `location /api { ... }` defines a block for handling API requests.
    -   `proxy_pass http://host.docker.internal:3001;` (for Docker Desktop on Mac/Windows) or a similar address for Linux (e.g., gateway IP or a service name if backend is also containerized on the same network) forwards any request starting with `/api/` to the backend server listening on port 3001.
    -   This means the Nginx container (running the frontend) communicates with the backend service, which might be running directly on the host machine during development or as another container in a production setup (e.g., in a Docker Compose or Kubernetes environment). The current `Dockerfile` only containerizes the frontend.

## 5. Environment Variable Handling Summary

-   **Frontend (Build-time)**:
    -   `GEMINI_API_KEY`: Passed as a build argument (`--build-arg`) during `docker build`.
    -   `VITE_GEMINI_API_KEY`: Set as an environment variable within the Docker build stage, making it accessible to Vite.
    -   Vite (`vite.config.ts`) embeds this key into the static JavaScript files as `process.env.API_KEY` and `process.env.GEMINI_API_KEY`. This means the key is fixed at build time for the frontend.
-   **Backend (Runtime)**:
    -   The backend (`server.ts`, `db.ts`, `config.ts`) expects various environment variables at runtime (e.g., `DB_HOST`, `DB_USER`, `JWT_SECRET`, `PORT`, `GEMINI_API_KEY` if used directly by backend).
    -   These are not managed by the provided `Dockerfile` but would be set in the environment where the backend Node.js process is run (e.g., host machine's environment, Docker container environment variables if the backend were containerized, CI/CD pipeline variables, or platform-specific configuration like Heroku config vars or Kubernetes secrets/configmaps).

This setup provides a clear process for building the frontend into a static bundle and deploying it within a Docker container using Nginx, while the backend is built and run separately, with Nginx proxying API calls to it.
