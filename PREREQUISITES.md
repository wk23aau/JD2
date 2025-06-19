## Prerequisites for Running the AI CV Maker

This guide lists the software you'll need to install and set up on your computer to run the AI CV Maker application. We'll try to keep it as simple as possible!

### 1. Operating System

The application can generally run on most modern computers:

*   **Windows:** Windows 10 or Windows 11 (ensure your system meets Docker Desktop requirements, like WSL2).
*   **macOS:** Recent versions of macOS (e.g., macOS Monterey 12.5 or newer, check Docker Desktop requirements).
*   **Linux:** Many common Linux distributions (e.g., Ubuntu, Fedora, Debian). Docker Desktop for Linux has specific requirements.

While the project components are cross-platform, the easiest way to run the frontend (and potentially a database in future setups) is using Docker Desktop, which has its own system requirements you should check.

### 2. Docker Desktop (Essential)

This is the **primary tool** you'll use to run parts of the application, especially the user interface (frontend). Docker simplifies running applications in isolated environments called containers.

*   **What it does for this project:** Docker Desktop will run the frontend of the AI CV Maker. In some setups, it might also manage the database, but for current instructions, the database and backend are run directly on your computer.
*   **Download Link:** [Docker Desktop Download Page](https://www.docker.com/products/docker-desktop/)
    *   Download the version appropriate for your operating system and follow their installation instructions.
    *   You might need to enable virtualization in your computer's BIOS/UEFI settings if it's not already enabled (Docker Desktop usually guides you if this is needed).

### 3. Source Code (The Application Files)

You need to get a copy of the application's files.

*   **Easiest way (for non-technical users):**
    *   Download the project as a ZIP file from its GitHub repository.
    *   If you have the link to the GitHub page, look for a "Code" button, and then "Download ZIP".
    *   Once downloaded, extract the ZIP file to a known location on your computer (e.g., your Documents folder).
*   **Alternative (if you're comfortable or asked to use it):**
    *   Use Git to "clone" the repository. This is more common for developers.
    *   If you need Git, you can download it from [git-scm.com/downloads](https://git-scm.com/downloads).

### 4. Node.js and npm (For Running the Backend Server)

The "backend" is the part of the application that works behind the scenes. The current project instructions assume you will run this directly on your computer (not in Docker).

*   **Node.js:** This is a runtime environment that allows your computer to run JavaScript code outside of a web browser (which is what the backend is written in).
    *   **Download Link:** [Node.js Download Page](https://nodejs.org/)
        *   It's generally recommended to download the **LTS (Long Term Support)** version, as it's the most stable.
*   **npm (Node Package Manager):** This tool comes bundled with Node.js. It's used to install other software pieces (dependencies) that the backend needs to function. You don't need to install it separately.

### 5. Text Editor (For Configuration)

You'll need a simple text editor to create and modify a configuration file for the backend server. This file, usually named `.env`, will contain settings like database connection details and API keys.

*   **Examples:**
    *   **VS Code (Visual Studio Code):** A very popular, free, and powerful editor. ([Download VS Code](https://code.visualstudio.com/download))
    *   **Notepad++ (Windows):** A good free alternative to Windows Notepad.
    *   **Sublime Text:** Another popular editor (has a free trial).
    *   Even built-in editors like **Notepad (Windows)** or **TextEdit (macOS)** can work, but ensure they save the file as plain text without any special formatting, and correctly named (e.g., `.env` without a `.txt` extension).

### 6. Web Browser

You'll need a web browser to use the AI CV Maker application.

*   **Examples:** Google Chrome, Mozilla Firefox, Microsoft Edge, Apple Safari.
*   Ensure your browser is reasonably up-to-date.

---

Once you have these prerequisites, you can proceed with the setup and running instructions provided for the project.
