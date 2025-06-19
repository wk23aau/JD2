## Backend Server Setup (Running on Your Computer)

The "backend" is the engine of the AI CV Maker application that works behind the scenes. These steps will guide you through setting it up to run directly on your computer.

### 1. Open a Terminal and Navigate to the Backend Directory

You'll need to use a "terminal" or "command prompt" to issue some commands.

*   **Windows:** Search for "Command Prompt" or "PowerShell".
*   **macOS:** Search for "Terminal" (it's in Applications > Utilities).
*   **Linux:** Usually `Ctrl+Alt+T` or search for "Terminal".

Once your terminal is open, you need to tell it to go into the `backend` folder which is inside the main project folder you downloaded and extracted.

Type `cd ` (notice the space after `cd`), then drag the `backend` folder from your file explorer directly into the terminal window. It should paste the correct path. Press Enter.

Alternatively, if you know the path, type it manually. For example, if the project is in `C:\Users\YourName\Documents\ai-cv-maker`, you would type:
```bash
cd C:\Users\YourName\Documents\ai-cv-maker\backend
```
Or on macOS/Linux, it might be:
```bash
cd /Users/YourName/Documents/ai-cv-maker/backend
```
Press Enter after typing the command. The terminal should now be "inside" the `backend` directory.

### 2. Create and Configure the `.env` File

The backend needs a special configuration file named `.env` to store important settings like your AI API key (if you have one) and how to connect to the database. This file keeps sensitive information out of the main code.

*   **Create the file:**
    1.  Inside the `backend` folder (NOT the main project folder), create a new file.
    2.  Using your text editor (like VS Code, Notepad++, or even Notepad/TextEdit mentioned in Prerequisites), save this new empty file with the exact name `.env` (a period at the beginning, and no other extension like `.txt`).
        *   *If using Notepad on Windows:* When you save, select "All Files (\*.\*)" as the "Save as type", and then type `.env` as the filename.

*   **Add content to `.env`:**
    Copy and paste the following content exactly into your newly created `.env` file:

    ```dotenv
    # Backend Server Port (optional, defaults to 3001 if not set)
    # PORT=3001

    # Database Connection Details
    # These should match the MySQL database you set up (e.g., via Docker or local install)
    DB_HOST=localhost
    DB_PORT=3306
    DB_USER=root
    DB_PASSWORD=fb3bbc2c
    DB_NAME=cv_builder_db

    # Security Key for Sessions (JWT - JSON Web Tokens)
    # Replace 'your_super_secret_jwt_key_at_least_32_chars_long' with your own random string.
    # It should be long and hard to guess. You can use a password generator.
    # For local testing, a simple one is okay, but for anything else, make it strong!
    JWT_SECRET=a_very_secure_and_random_string_for_testing_123!@#

    # Google Gemini API Key (for AI features)
    # If you have a Gemini API Key, paste it after the =
    # If you leave it blank, AI features will not work, but the rest of the app should.
    GEMINI_API_KEY=
    ```

*   **Explanation of each setting:**
    *   `DB_HOST=localhost`: Tells the backend that the database is running on your own computer ("localhost").
    *   `DB_PORT=3306`: This is the standard network port number for MySQL databases.
    *   `DB_USER=root`: The username for connecting to your MySQL database. The setup instructions for the database (using Docker) used "root".
    *   `DB_PASSWORD=fb3bbc2c`: The password for the "root" user in your MySQL database. This matches the password used in the Docker setup instructions for MySQL. **Important:** If you set up MySQL differently with another password, use that password here.
    *   `DB_NAME=cv_builder_db`: The name of the database the application will use. This also matches the database setup instructions.
    *   `JWT_SECRET=...`: This is a secret key the application uses for securing user login sessions. For local use, the provided example `a_very_secure_and_random_string_for_testing_123!@#` is okay. For any real deployment, you would change this to something very long and random.
    *   `GEMINI_API_KEY=`: This is where you would paste your API key from Google AI Studio if you have one. If you don't have a key or leave this blank, the AI-powered CV generation features will not work, but other parts of the application (like manually creating a CV) should still function.

*   **Save the file.** Make sure it's saved as `.env`.

### 3. Install Backend Dependencies

Now, you'll tell `npm` (Node Package Manager, which was installed with Node.js) to download and install all the necessary code libraries that the backend depends on.

*   In your terminal, ensure you are still in the `backend` directory.
*   Type the following command and press Enter:
    ```bash
    npm install
    ```
*   This might take a few minutes. You'll see text scrolling in the terminal as files are downloaded and installed. Wait for it to complete. You might see some "warnings" (often starting with `npm WARN`), which are usually okay for local setup. As long as there are no major "errors" (often in red text, starting with `npm ERR!`), you should be fine.

---

After these steps, the backend code is configured and its dependencies are installed. You'll be ready for the next steps on how to start the database server (if you haven't already) and then the backend server itself.
