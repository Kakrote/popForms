# PopForms

> Backend API for PopForms — a form management and submission system built with Express and TypeScript.

## Overview
- Backend stack: Node.js, TypeScript, Express, Prisma (PostgreSQL)
- Primary features implemented so far: user authentication (JWT), role-based access control, user management endpoints, Prisma schema and migrations, admin seeding utility.

This repository contains the server implementation under the `backEnd` folder and a frontend scaffold in `frontEnd` (if present).

## Repo structure (high level)
- [backEnd/server.ts](backEnd/server.ts) — Server entry point
- [backEnd/src/app.ts](backEnd/src/app.ts) — Express app configuration and middleware
- [backEnd/src/routes/index.ts](backEnd/src/routes/index.ts) — Route aggregator
- [backEnd/src/modules/auth](backEnd/src/modules/auth) — Authentication controllers, service, repository, validation
- [backEnd/src/modules/users](backEnd/src/modules/users) — User controllers and services
- [backEnd/src/middlewares](backEnd/src/middlewares) — Authentication, authorization, error handler
- [backEnd/src/utils](backEnd/src/utils) — `seedAdmin`, `appError`, `catchAsync`, `logger`
- [backEnd/prisma/schema.prisma](backEnd/prisma/schema.prisma) — Prisma schema
- [backEnd/prisma/migrations](backEnd/prisma/migrations) — Existing DB migrations
- [backEnd/package.json](backEnd/package.json) — Scripts and dependencies

## Work completed so far
- Implemented JWT-based authentication with registration and login flows.
- Implemented role-based access control (ADMIN / USER) and `authorizeRoles` middleware.
- Created user management endpoints (list users, get user by id) protected for ADMIN.
- Added Prisma schema models for Users, Forms, Fields, Submissions, Departments, and enums for field types and statuses.
- Added three Prisma migrations (under `backEnd/prisma/migrations`) representing DB schema evolution.
- Implemented `seedAdmin` utility to create an initial admin user on startup if missing.
- Added TypeScript and project configuration (`tsconfig.json`, ES module setup).

## Missing / Not yet implemented
- No endpoints yet for form CRUD, submissions, or file uploads (schema contains types but routes are not implemented).
- No mailer/email sending implementation despite MailStatus enum in schema.
- No automated test suite included (test script is placeholder).

## Environment variables
Create a `.env` file in `backEnd` with at minimum the following variables:

```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/popforms
JWT_SECRET=your_jwt_secret_here
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=supersecurepassword
ADMIN_USERNAME=admin
NODE_ENV=development
```

## Quick start (backend)
1. Open a terminal and change to the backend folder:

```bash
cd backEnd
```

2. Install dependencies:

```bash
npm install
```

3. Generate Prisma client and apply migrations (choose one):

```bash
npx prisma generate
npx prisma migrate deploy   # apply saved migrations to production-like DB
# or for local development:
npx prisma migrate dev --name init
```

4. Start the server:

```bash
npm run dev   # development with tsx watch
# or
npm start     # production (tsx server.ts)
```

5. On first run the server will attempt to create the admin user using the `seedAdmin` utility (ensure ADMIN_* env vars are set).

## Notable files to review
- [backEnd/prisma/schema.prisma](backEnd/prisma/schema.prisma)
- [backEnd/src/modules/auth/auth.routes.ts](backEnd/src/modules/auth/auth.routes.ts)
- [backEnd/src/modules/users/user.routes.ts](backEnd/src/modules/users/user.routes.ts)
- [backEnd/src/utils/seedAdmin.ts](backEnd/src/utils/seedAdmin.ts)

## Next recommended steps
- Implement Form and Submission CRUD routes and controllers.
- Add file upload handling (multipart) for `FILE` field types.
- Implement email sending for notifications / MailStatus processing.
- Add a `.env.example` with required environment variables for easier onboarding.
- Add unit/integration tests for auth and user flows.

## Contact / Maintainers
If you need more details or want me to expand the README with API examples, OpenAPI spec, or frontend integration notes, tell me which section to expand.
