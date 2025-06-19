## Stopping the AI CV Maker Application

When you're finished using the AI CV Maker, you'll need to stop the different parts of the application that you started. This usually involves stopping the frontend Docker container, the backend server terminal, and the database Docker container.

Here’s how to stop each component:

### 1. Stop the Frontend Application (Docker Container)

The frontend (user interface) is running inside a Docker container named `ai-cv-maker-app`.

*   **Open a new terminal or command prompt** (or use an existing one where you are comfortable running Docker commands).
*   **To stop the container, type the following command and press Enter:**
    ```bash
    docker stop ai-cv-maker-app
    ```
    This command tells Docker to gracefully stop the container named `ai-cv-maker-app`.

*   **(Optional) Check running containers:** If you want to see which containers are currently running before or after stopping, you can use:
    ```bash
    docker ps
    ```
    After stopping, `ai-cv-maker-app` should no longer appear in this list (or `docker ps -a` will show it with an "Exited" status).

*   **(Optional) Remove the container:** If you want to remove the container (which is like deleting the stopped instance, but not the image/blueprint), you can type:
    ```bash
    docker rm ai-cv-maker-app
    ```
    This is useful if you want to start fresh next time or free up container names. The image `ai-cv-maker` will still exist on your system, so you don't have to rebuild it every time unless you change the source code and want to update the image.

### 2. Stop the Backend Server

The backend server is running in a terminal window that you kept open.

*   **Go to the terminal window** where you previously ran the `npm run dev` command for the backend (the one showing messages like "Server is running on port 3001").
*   **To stop the server, press the `Ctrl` key and the `C` key at the same time** (written as `Ctrl + C`).
    *   You might need to press it once or twice.
    *   The server should stop, and you'll typically see your normal command prompt again in that terminal. You can then close that terminal window.

### 3. Stop the Database (MySQL Docker Container)

The MySQL database is also running in a Docker container, named `jd2cv-mysql`.

*   **Open a new terminal or command prompt** (or use an existing one).
*   **To stop the database container, type the following command and press Enter:**
    ```bash
    docker stop jd2cv-mysql
    ```
    This will stop the database container.

*   **(Optional) Remove the database container:** If you want to remove this container as well:
    ```bash
    docker rm jd2cv-mysql
    ```
    **Important Note on Data:** In the simplified setup provided, stopping and removing the `jd2cv-mysql` container *might* mean that any data you created (like your user account and saved CVs) will be deleted. For development and simple local use, this is often acceptable. If you need to keep your data permanently between sessions, more advanced Docker configurations (using "volumes" for persistence) would be required, which are outside the scope of these basic instructions. For now, assume that if you `docker rm jd2cv-mysql`, your data inside it is gone. Just stopping it with `docker stop jd2cv-mysql` will keep the data, and it will be there if you `docker start jd2cv-mysql` again.

---

Once all these components are stopped, the AI CV Maker application will no longer be running on your computer. To use it again, you would typically restart the database container (`docker start jd2cv-mysql`), then the backend server (`npm run dev`), and then the frontend container (`docker start ai-cv-maker-app` or `docker run ...` if you removed it).
