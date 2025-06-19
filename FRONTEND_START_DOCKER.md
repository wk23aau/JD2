## Frontend Application Setup (using Docker)

The "frontend" is the user interface of the AI CV Maker that you interact with in your web browser. We'll use Docker to build and run it. This makes the setup process consistent across different computers.

**Prerequisites:**
*   Ensure you have [Docker Desktop installed and running](#2-docker-desktop-essential).
*   Ensure you have the [application's source code](#3-source-code-the-application-files).
*   Make sure your backend server and database are already running as per their setup instructions.

### 1. Open a Terminal and Navigate to the Project Root Directory

You'll need a terminal or command prompt. You can open a new one or use an existing one.

*   **Windows:** Search for "Command Prompt" or "PowerShell".
*   **macOS:** Search for "Terminal" (it's in Applications > Utilities).
*   **Linux:** Usually `Ctrl+Alt+T` or search for "Terminal".

This time, make sure your terminal is "inside" the **main project root directory**. This is the main folder you downloaded/extracted, which contains files like `Dockerfile`, `package.json`, and the `backend` folder.

For example, if the project is in `C:\Users\YourName\Documents\ai-cv-maker`, you would type:
```bash
cd C:\Users\YourName\Documents\ai-cv-maker
```
Or on macOS/Linux:
```bash
cd /Users/YourName/Documents/ai-cv-maker
```
Press Enter.

### 2. Build the Frontend Docker Image

Now, you'll build the Docker "image" for the frontend. Think of an image as a blueprint or template for running the application.

*   In your terminal (which should be in the project root directory), copy and paste the following command exactly, then press Enter:
    ```bash
    docker build -t ai-cv-maker .
    ```
*   **What this command does:**
    *   `docker build`: This is the main command to build a Docker image.
    *   `-t ai-cv-maker`: This "tags" or names your image `ai-cv-maker`. This name is how you'll refer to it in the next step.
    *   `.` (a single period): This tells Docker to look for the `Dockerfile` (the instruction file for building the image) in the current directory you're in (which should be the project root).
*   **Wait for it to complete:** This step might take a few minutes, especially the first time you run it, as Docker might need to download base images and then build your application's frontend. You'll see a lot of text output in the terminal. Wait until it finishes and you see your normal command prompt again.

    *   **Note on API Keys:** If the project requires an API key for AI features (like a `GEMINI_API_KEY`) to be available *during the build* of the frontend, the person providing you with the project files should give you specific instructions on how to include it. Often, this is done by adding a `--build-arg YOUR_API_KEY_NAME=your_actual_key` to the `docker build` command. For this project, the `Dockerfile` is set up to expect `GEMINI_API_KEY` as a build argument. If you have one, the command would look like:
        ```bash
        docker build --build-arg GEMINI_API_KEY="your_actual_gemini_api_key_here" -t ai-cv-maker .
        ```
        If you don't provide it, the frontend might be built without AI capabilities or with limited functionality, depending on how it's configured.

### 3. Run the Frontend Docker Container

Once the image is built, you can run it as a "container". A container is a running instance of your image.

*   In your terminal, copy and paste the following command and press Enter:
    ```bash
    docker run --name ai-cv-maker-app -p 8080:80 -d ai-cv-maker
    ```
*   **What this command does:**
    *   `docker run`: The command to start a new container.
    *   `--name ai-cv-maker-app`: Assigns the name `ai-cv-maker-app` to your running container. This makes it easier to manage (e.g., stop or remove it later).
    *   `-p 8080:80`: This "publishes" or "maps" a port. It means that port `80` inside the Docker container (where the Nginx web server is running and serving the frontend) will be accessible on port `8080` of your own computer.
    *   `-d`: Runs the container in "detached" mode, meaning it runs in the background and doesn't keep your terminal busy.
    *   `ai-cv-maker`: This is the name of the image you built in the previous step that you want to run.

*   **Troubleshooting Tip:**
    *   If you see an error like "container name /ai-cv-maker-app is already in use", it means a container with that name already exists (perhaps from a previous run). You can remove the old one by typing `docker rm ai-cv-maker-app` and pressing Enter, then try the `docker run` command again.
    *   You might need to run `docker stop ai-cv-maker-app` first if the container is still running before you can remove it.

### Accessing the Application

Once the container is running (it should start very quickly), the AI CV Maker frontend should be accessible in your web browser!

*   Open your web browser (Chrome, Firefox, Edge, etc.).
*   Go to the following address: **`http://localhost:8080`**

You should see the application's landing page.

---

Remember, for the application to fully work, your [Database Server](#database-setup-using-docker-for-mysql) and [Backend Server](#starting-the-backend-server) must also be running.
