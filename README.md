# Chirpy HTTP Server

## Project Overview

This is a Node.js HTTP server built with Express and TypeScript. It serves as the backend for "Chirpy", a social media-like application. It handles user authentication, posting "chirps" (messages), and integrates with a webhook provider ("Polka") for premium user features.

Built based on [Boot.dev course](https://www.boot.dev/courses/learn-http-servers-typescript)

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM (with `postgres` driver)
- **Authentication:** JWT (JSON Web Tokens) & Argon2 (hashing)
- **Testing:** Vitest

## Setup & Running

### Prerequisites

- Node.js & npm
- PostgreSQL Database

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
DB_URL="postgres://user:password@localhost:5432/chirpy"
PLATFORM="dev" # Set to 'dev' to enable admin reset routes
SECRET="your_jwt_secret"
POLKA_KEY="your_polka_webhook_key"
```

### Commands

- **Install Dependencies:** `npm install`
- **Development Server:** `npm run dev` (Builds and runs `dist/index.js` on port 8080)
- **Build:** `npm run build`
- **Start Production:** `npm start`
- **Run Tests:** `npm test`
- **Database Migrations:**
  - Generate: `npm run generate`
  - Apply: `npm run migrate`
  - Studio: `npm run studio` (Drizzle Studio UI)

## Project Structure

### Key Directories

- `src/routes/`: Express routers for different API resources (`admin`, `auth`, `chirps`, `users`, `polka`).
- `src/db/`: Database configuration.
  - `schema.ts`: Drizzle ORM schema definitions (Users, Chirps, RefreshTokens).
  - `queries/`: Helper functions for database operations.
- `src/app/middleware/`: Express middleware (logging, metrics, error handling).
- `src/auth.ts`: Authentication utilities (password hashing, JWT generation/validation).

### Architecture & Conventions

- **Entry Point:** `src/index.ts` sets up the Express app, middleware, and routes.
- **Database Access:** All database interaction is done via Drizzle ORM.
- **Authentication:**
  - **User API:** Uses Bearer Tokens (JWT). Tokens expire in 1 hour.
  - **Webhooks (Polka):** Uses `ApiKey` header validation.
- **Error Handling:** Centralized error handling middleware allows throwing custom errors (e.g., `UnauthorizedError`, `NotFoundError`) from routes.
- **Admin Features:** The `/admin` routes (specifically `reset`) are guarded by a check for `PLATFORM="dev"`.

## API Overview

### Chirps (`/api/chirps`)
- `GET /api/chirps`: Retrieves all chirps.
  - Query Params:
    - `authorId`: Filter chirps by a specific user's ID.
    - `sort`: Set to `desc` to sort by most recent first (default is ascending).
- `POST /api/chirps`: Creates a new chirp.
  - Authentication: Bearer JWT required.
  - Body: `{ "body": "string" }` (Max 140 characters).
  - *Note:* Profanity filter replaces "kerfuffle", "sharbert", and "fornax" with "****".
- `GET /api/chirps/:chirpID`: Retrieves a single chirp by its ID.
- `DELETE /api/chirps/:chirpID`: Deletes a chirp.
  - Authentication: Bearer JWT required (User can only delete their own chirps).

### Users (`/api/users`)
- `POST /api/users`: Registers a new user.
  - Body: `{ "email": "string", "password": "string" }`.
- `PUT /api/users`: Updates the authenticated user's email and password.
  - Authentication: Bearer JWT required.
  - Body: `{ "email": "string", "password": "string" }`.

### Authentication (`/api`)
- `POST /api/login`: Authenticates a user and returns tokens.
  - Body: `{ "email": "string", "password": "string" }`.
  - Response: Includes a Bearer `token` (1h expiry), a `refreshToken`, and user details.
- `POST /api/refresh`: Issues a new JWT using a refresh token.
  - Authentication: Bearer Refresh Token required in the `Authorization` header.
- `POST /api/revoke`: Revokes a refresh token.
  - Authentication: Bearer Refresh Token required in the `Authorization` header.

### Webhooks (`/api/polka/webhooks`)
- `POST /api/polka/webhooks`: Upgrade a user to "Chirpy Red" (Premium).
  - Authentication: `ApiKey` required in the `Authorization` header.
  - Body: `{ "event": "user.upgraded", "data": { "userId": "string" } }`.

### Admin (`/admin`)
- `GET /admin/metrics`: Returns an HTML page showing total server hits.
- `POST /admin/reset`: Resets all users and metrics.
  - Available only when `PLATFORM="dev"`.
