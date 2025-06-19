## Database Setup (using Docker for MySQL)

The AI CV Maker application needs a database to store your user account, CVs, and other information. Using Docker is an easy way to get a MySQL database running on your computer without needing to install MySQL manually.

**Prerequisite:** Ensure you have [Docker Desktop installed and running](#2-docker-desktop-essential) on your computer.

### 1. Start the MySQL Database Container

Open your terminal or command prompt (the same one you used for [Backend Server Setup](#backend-server-setup-running-on-your-computer)).

Copy the entire command below, paste it into your terminal, and press Enter:

```bash
docker run --name jd2cv-mysql -e MYSQL_ROOT_PASSWORD=fb3bbc2c -e MYSQL_DATABASE=cv_builder_db -p 3306:3306 -d mysql:8.0
```

*   **What this command does:**
    *   `docker run`: The basic Docker command to start a new container.
    *   `--name jd2cv-mysql`: Gives a memorable name ("jd2cv-mysql") to this container.
    *   `-e MYSQL_ROOT_PASSWORD=fb3bbc2c`: Sets the main password for the MySQL database to `fb3bbc2c`. This **must match** what you put in the `DB_PASSWORD` field in your backend's `.env` file.
    *   `-e MYSQL_DATABASE=cv_builder_db`: Tells MySQL to automatically create an empty database named `cv_builder_db` when it starts. This also **must match** the `DB_NAME` in your backend's `.env` file.
    *   `-p 3306:3306`: Makes the MySQL database (running inside the Docker container on its port 3306) accessible from your computer on port 3306.
    *   `-d`: Runs the container in "detached" mode (in the background).
    *   `mysql:8.0`: Tells Docker to use the official MySQL image, version 8.0. Docker will download this image if you don't have it already (this might take a few minutes the first time).

*   **Troubleshooting Tip:**
    *   If you see an error message that includes something like "container name /jd2cv-mysql is already in use", it means you've run this command before and the container still exists. You can remove the old one by typing `docker rm jd2cv-mysql` and pressing Enter, then try the `docker run` command again.
    *   It might take a minute or two for the database to fully start up inside the container after you run the command.

### 2. Create the Database Tables (Initialize Schema)

Once the MySQL container is running, you need to set up the internal structure (tables) within the `cv_builder_db` database. The project includes a file with these instructions (`database_schema.sql`).

You'll run two commands in your terminal (make sure your terminal is still in the main project folder, or at least in a place where the `backend/src/database_schema.sql` path is correct relative to where you are).

*   **Command 1: Copy the schema file into the container**
    (Ensure your terminal's current directory is the root of the project, where the `backend` folder is located)
    ```bash
    docker cp backend/src/database_schema.sql jd2cv-mysql:/tmp/schema.sql
    ```
    This command copies the `database_schema.sql` file from your project's `backend/src` directory into a temporary location (`/tmp/schema.sql`) inside the running `jd2cv-mysql` Docker container.

*   **Command 2: Execute the schema file inside the container**
    ```bash
    docker exec jd2cv-mysql mysql -uroot -pfb3bbc2c cv_builder_db -e "source /tmp/schema.sql"
    ```
    This command tells Docker to:
    *   `exec jd2cv-mysql`: Run a command inside the `jd2cv-mysql` container.
    *   `mysql -uroot -pfb3bbc2c cv_builder_db`: Connect to the MySQL database named `cv_builder_db` as the `root` user with the password `fb3bbc2c`.
    *   `-e "source /tmp/schema.sql"`: Execute the SQL commands found in the `/tmp/schema.sql` file (which you just copied). This creates all the necessary tables like `users`, `cvs`, etc.

    You shouldn't see any errors from this command if it's successful.

### 3. How to Check if the Database Container is Running (Optional)

If you want to see if your MySQL database container is running, you can type the following command in your terminal and press Enter:

```bash
docker ps
```
You should see `jd2cv-mysql` listed in the output, along with other information, indicating it's running.

---

Your database should now be set up and ready for the backend server to connect to it! Remember, this database container needs to be running whenever you want to use the AI CV Maker application.
