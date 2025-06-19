# System Diagrams

## 1. High-Level Architecture Diagram

This diagram illustrates the main components of the AI CV Maker application and their interactions.

```mermaid
graph TD
    A[User (Browser)] -- HTTP Request for Web App --> B(Nginx Reverse Proxy);
    B -- Serves Static Frontend Files (HTML, CSS, JS) --> A;
    A -- Renders React Frontend --> C[React Frontend (in Browser)];
    C -- API Calls (e.g., /api/cvs) --> B;
    B -- Proxies /api requests --> D[Node.js Backend (Express API)];
    D -- Queries/Updates --> E[Database (MySQL)];
    E -- Returns Data --> D;
    D -- API Response --> B;
    B -- Relays API Response --> C;

    subgraph "Client Tier"
        A
        C
    end

    subgraph "Web Tier / Edge"
        B
    end

    subgraph "Application Tier"
        D
    end

    subgraph "Data Tier"
        E
    end
```

## 2. Sequence Diagram for User Login

This diagram details the sequence of interactions during the user login process.

```mermaid
sequenceDiagram
    actor User
    participant ReactFrontend as React Frontend (Browser)
    participant NginxProxy as Nginx (Reverse Proxy)
    participant NodeBackend as Node.js Backend (API)
    participant DatabaseMySQL as Database (MySQL)

    User->>ReactFrontend: Enters email and password
    User->>ReactFrontend: Submits Login Form
    ReactFrontend->>NginxProxy: POST /api/auth/login (with credentials)
    NginxProxy->>NodeBackend: Proxies POST /api/auth/login (with credentials)

    NodeBackend->>DatabaseMySQL: Query user by email
    DatabaseMySQL-->>NodeBackend: Return user data (incl. password_hash)

    alt Credentials Valid
        NodeBackend->>NodeBackend: Compare provided password with password_hash (bcrypt)
        NodeBackend->>NodeBackend: Generate JWT
        NodeBackend-->>NginxProxy: 200 OK (JSON response with JWT & user info)
        NginxProxy-->>ReactFrontend: Relays 200 OK (JSON response with JWT & user info)
        ReactFrontend->>ReactFrontend: Store JWT (e.g., localStorage)
        ReactFrontend->>User: Redirect to Dashboard / Display Success
    else Credentials Invalid
        NodeBackend-->>NginxProxy: 401 Unauthorized (JSON error message)
        NginxProxy-->>ReactFrontend: Relays 401 Unauthorized (JSON error message)
        ReactFrontend->>User: Display Login Error Message
    end
```
