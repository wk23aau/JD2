## Important Considerations & Basic Troubleshooting

Here are a few important points to remember and some basic troubleshooting tips if you encounter issues while setting up or running the AI CV Maker.

### 1. Order of Starting Things (Recap)

For the application to work correctly, components generally need to be started in this order:

1.  **Database First:** Start the MySQL Docker Container (`jd2cv-mysql`).
2.  **Backend Server Next:** After the database is running, start the Backend Server (the `npm run dev` command in the `backend` folder's terminal).
3.  **Frontend Last:** Once the backend and database are running, you can Build and then Run the Frontend Docker Container (`ai-cv-maker-app`).

If you start them in the wrong order, especially if the backend starts before the database is ready, it might not connect correctly.

### 2. `GEMINI_API_KEY` Reminder (For AI Features)

*   The AI-powered content generation features (like suggesting text for your CV summary or experience points) depend on a `GEMINI_API_KEY`.
*   This key needs to be:
    1.  Added to your backend's `.env` file (variable `GEMINI_API_KEY`).
    2.  Provided when building the frontend Docker image (as a `--build-arg GEMINI_API_KEY="..."`).
*   **If you don't have this key or haven't set it up:** The main application (creating user accounts, manually editing CV sections, changing themes, saving CVs) should still work. However, any buttons or features that try to use AI to generate content will likely show an error or not function.

### 3. Docker Not Running or `docker` Command Not Found

*   **Symptom:** When you type a `docker` command in the terminal (like `docker ps` or `docker run`), you see an error like "docker: command not found", "Cannot connect to the Docker daemon", or similar.
*   **Solution:**
    1.  Make sure you have **Docker Desktop installed** on your computer.
    2.  Ensure **Docker Desktop is running**. Look for the Docker whale icon in your system tray (Windows) or menu bar (macOS) and make sure it indicates Docker is running. Sometimes it needs to be started manually after your computer boots up.

### 4. Port Conflicts (e.g., "port is already allocated")

*   **Symptom:**
    *   When running `docker run -p 8080:80 ...` for the frontend, you might see an error message that port `8080` is already in use or allocated.
    *   Similarly, when starting the backend server (`npm run dev`), it might fail if another application is already using port `3001`.
*   **Solution:**
    *   **Identify the port:** The error message usually tells you which port is the problem (e.g., `8080` or `3001`).
    *   **Stop the other application:** If you know what other application is using that port, try closing it. This might be another development tool, a web server, or sometimes even other Docker containers.
    *   **For Docker port conflicts (e.g., with `8080`):**
        *   You can try changing the port the application uses on *your computer*. For example, instead of `-p 8080:80`, you could try `-p 8081:80`. If you do this, you would then access the application at `http://localhost:8081`. The `80` part (after the colon) should not be changed as that's internal to the Docker container.
    *   **For backend port conflicts (e.g., with `3001`):** This is more advanced, but you could change the `PORT` variable in the backend's `.env` file (e.g., `PORT=3002`). If you do this, you'd also need to update the Nginx configuration (`nginx.conf` used by the frontend Docker container) to point to this new backend port, and then rebuild the frontend Docker image. For simplicity, try to free up port 3001 first.

### 5. Checking Logs for Clues

If something isn't working, error messages are often printed in the "logs" of the component that's having trouble.

*   **Backend Server Logs:**
    *   The terminal window where you ran `npm run dev` (for the backend) is its log. Any errors or important messages from the backend will appear here. Scroll up to see what was last printed if it crashes or gives an error.

*   **Frontend Docker Container Logs (Nginx):**
    *   If the frontend isn't showing up at `http://localhost:8080` or behaving strangely:
        1.  Open a terminal and type `docker ps`. This lists your running containers. Find the `CONTAINER ID` or `NAMES` for the `ai-cv-maker-app` (or whatever you named it).
        2.  Then, type `docker logs <container_name_or_id>`. For example:
            ```bash
            docker logs ai-cv-maker-app
            ```
        3.  This will show the logs from the Nginx server inside the container, which might give clues.

*   **Database Docker Container Logs (MySQL):**
    *   If you suspect database issues, you can check its logs similarly:
        ```bash
        docker logs jd2cv-mysql
        ```

### 6. Backend Error: "ECONNREFUSED" or "Database Connection Error"

*   **Symptom:** In the backend server's terminal window, you see errors like `ECONNREFUSED`, "Error: connect ECONNREFUSED 127.0.0.1:3306", or messages indicating it cannot connect to the database.
*   **Troubleshooting:**
    1.  **Is the MySQL Docker container running?**
        *   Open a terminal and type `docker ps`.
        *   Make sure `jd2cv-mysql` is listed and shows "Up" status. If not, try starting it with `docker start jd2cv-mysql`. If that fails, you might need to re-run the original `docker run ...` command from the [Database Setup](LINK_TO_DATABASE_SETUP.md) instructions.
    2.  **Are your `.env` settings correct?**
        *   Open the `.env` file in your `backend` directory.
        *   Double-check that `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` exactly match the settings you used when starting the `jd2cv-mysql` container and what's expected by the `database_schema.sql` script.
            *   `DB_HOST` should typically be `localhost` (or `127.0.0.1`).
            *   `DB_PORT` should be `3306`.
            *   `DB_USER` should be `root`.
            *   `DB_PASSWORD` should be `fb3bbc2c` (or whatever you set if you changed it).
            *   `DB_NAME` should be `cv_builder_db`.
    3.  **Was the database schema initialized?**
        *   Make sure you ran the two `docker cp ...` and `docker exec ...` commands from the "Initialize Database Schema" step in the [Database Setup](LINK_TO_DATABASE_SETUP.md) instructions. If these weren't run, the database will be empty and the backend won't find the tables it needs.

### 7. Backend Error: "Table 'cv_builder_db.users' doesn't exist" (or similar for other tables)

*   **Symptom:** The backend terminal shows an error message indicating a specific table (like `users`, `cvs`, or `cv_templates`) doesn't exist in the `cv_builder_db` database.
*   **Troubleshooting:**
    *   This usually means the database schema (the table structures) was not created correctly.
    *   Go back to the [Database Setup](LINK_TO_DATABASE_SETUP.md) instructions and carefully re-run the two commands for initializing the schema:
        ```bash
        docker cp backend/src/database_schema.sql jd2cv-mysql:/tmp/schema.sql
        docker exec jd2cv-mysql mysql -uroot -pfb3bbc2c cv_builder_db -e "source /tmp/schema.sql"
        ```
    *   If you've tried this multiple times, there might have been an error during the schema execution. You can try to see detailed output by running the second command without the `-e` and interacting with `mysql` directly, but that's more advanced. The simplest is to ensure the `jd2cv-mysql` container is running and then retry these two commands.

---

If you've checked these common issues and are still having trouble, try to copy any error messages you see in the terminal windows, as they will be helpful for getting more specific assistance.
