## Starting the Backend Server

After you've completed the [Backend Server Setup](LINK_TO_BACKEND_SETUP.md) (installing dependencies and configuring the `.env` file) and the [Database Setup](LINK_TO_DATABASE_SETUP.md), you can start the backend server.

The backend server is the "engine" that powers the application's logic and data management.

### 1. Open a Terminal and Navigate to the Backend Directory

If you closed your terminal or command prompt from the previous steps, open it again:

*   **Windows:** Search for "Command Prompt" or "PowerShell".
*   **macOS:** Search for "Terminal" (it's in Applications > Utilities).
*   **Linux:** Usually `Ctrl+Alt+T` or search for "Terminal".

Make sure your terminal is "inside" the `backend` folder located within your main project directory. If you're unsure, use the `cd` command again. For example:

```bash
cd path/to/your/downloaded/ai-cv-maker/backend
```
(Replace `path/to/your/downloaded/ai-cv-maker/` with the actual path to where you extracted the project).

### 2. Command to Start the Backend Server

Once you are in the `backend` directory in your terminal, type the following command and press Enter:

```bash
npm run dev
```

*   **What this command does:**
    *   This command tells Node.js (via npm scripts) to start the backend server using a tool called `nodemon`. `nodemon` is helpful because it automatically restarts the server if any code changes are made (though you likely won't be changing code).

### 3. Expected Output

After running the command, you should see some messages in the terminal.

*   **Successful Start:**
    *   A key message to look for is:
        ```
        Server is running on port 3001
        ```
        (Or a similar message indicating the server has started on port 3001).
    *   You might also see other messages from `nodemon` like `[nodemon] starting \`ts-node src/server.ts\`` or `[nodemon] clean exit - waiting for changes before restart`.

*   **Regarding the `GEMINI_API_KEY`:**
    *   If you did **not** provide a `GEMINI_API_KEY` in your `.env` file (as mentioned in the Backend Setup), you will likely see a message similar to:
        ```
        GEMINI_API_KEY for backend AI service is not set. Please ensure the environment variable is configured.
        AI Service will not be functional as GEMINI_API_KEY is missing.
        ```
    *   **This is okay for now.** It simply means the AI-powered content generation features will not work. The rest of the application (manual CV editing, user accounts, etc.) should still function correctly.

*   **Keep this Terminal Open:**
    *   The terminal window where you ran `npm run dev` is now running your backend server.
    *   **You need to keep this terminal window open as long as you are using the AI CV Maker application.**
    *   If you close this terminal window, the backend server will stop, and the application will no longer work correctly.
    *   If you need to stop the server, you can usually press `Ctrl+C` in this terminal window.

---

With the database running (from the Database Setup step) and this backend server running, you are now ready to set up and start the frontend (the user interface).
