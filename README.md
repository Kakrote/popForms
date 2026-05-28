# PopForms

PopForms is a backend API for managing forms, departments, submissions, and users. The repository is currently backend-first: the Express API lives in `backEnd`, and `frontEnd` is empty at the moment.

## Stack

- Node.js + TypeScript
- Express 5
- Prisma 7 with PostgreSQL
- JWT authentication
- Zod validation
- bcrypt for password hashing

## What is implemented

- Authentication with login and admin-only registration
- Role-based access control with `ADMIN` and `USER`
- Admin user management endpoints
- Department CRUD, restricted to admins
- Form create, delete, and status toggle routes, restricted to admins
- Form list and detail routes for the admin dashboard
- Submission creation route for authenticated `USER` and `ADMIN` accounts
- Submission list and detail routes for the admin dashboard
- Department self-lookup for authenticated users
- Startup admin seeding from environment variables
- Prisma schema, migrations, and a root-level Prisma config
- A React + Vite frontend in `frontEnd`

## API Surface

The API is mounted under `/api`.

- `GET /api` - health check for the API router
- `POST /api/auth/login` - log in and receive a JWT
- `POST /api/auth/register` - create a user, admin only
- `GET /api/user/users` - list users, admin only
- `GET /api/user/:id` - get a user by ID, admin only
- `PATCH /api/user/:id` - update a user profile, admin only
- `POST /api/department` - create a department, admin only
- `GET /api/department` - list departments, admin only
- `GET /api/department/:id` - get a department by ID, admin only
- `GET /api/department/user/:userId` - get a department by user ID, admin only
- `PATCH /api/department/:id` - update a department, admin only
- `DELETE /api/department/:id` - delete a department, admin only
- `POST /api/forms` - create a form, admin only
- `GET /api/forms` - list forms, admin only
- `GET /api/forms/:slug` - get a form with fields and submissions, admin or user
- `PATCH /api/forms/:slug` - toggle form status, admin only
- `DELETE /api/forms/:slug` - delete a form, admin only
- `POST /api/submissions` - submit a form, authenticated `USER` or `ADMIN`
- `GET /api/submissions` - list submissions, admin only
- `GET /api/submissions/:id` - get a submission, admin only
- `GET /api/department/me` - get the authenticated user's department, user or admin

## Repository Layout

- [backEnd/server.ts](backEnd/server.ts) - server bootstrap and admin seeding
- [backEnd/src/app.ts](backEnd/src/app.ts) - Express app setup and global middleware
- [backEnd/src/routes/index.ts](backEnd/src/routes/index.ts) - route aggregator mounted at `/api`
- [backEnd/src/modules/auth](backEnd/src/modules/auth) - login and registration flow
- [backEnd/src/modules/users](backEnd/src/modules/users) - admin user management
- [backEnd/src/modules/department](backEnd/src/modules/department) - department CRUD
- [backEnd/src/modules/forms](backEnd/src/modules/forms) - form endpoints
- [backEnd/src/modules/submissions](backEnd/src/modules/submissions) - submission endpoint
- [backEnd/src/middlewares](backEnd/src/middlewares) - authentication, authorization, and error handling
- [backEnd/src/utils](backEnd/src/utils) - logger, error helpers, slug helper, password hashing, admin seeding
- [backEnd/src/lib/prisma.ts](backEnd/src/lib/prisma.ts) - Prisma client wrapper
- [backEnd/prisma/schema.prisma](backEnd/prisma/schema.prisma) - database schema
- [backEnd/prisma/migrations](backEnd/prisma/migrations) - applied migrations
- [backEnd/prisma.config.ts](backEnd/prisma.config.ts) - Prisma CLI configuration
- [backEnd/package.json](backEnd/package.json) - scripts and dependencies

## Prisma Notes

- The Prisma CLI is configured from [backEnd/prisma.config.ts](backEnd/prisma.config.ts)
- `DATABASE_URL` is loaded through `dotenv/config`
- The schema includes users, profiles, departments, forms, fields, field options, form access, submissions, and submission values

## Environment Variables

Create a `.env` file in `backEnd` with at least:

```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/popforms
JWT_SECRET=replace_with_a_long_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=supersecurepassword
ADMIN_USERNAME=admin
NODE_ENV=development
```

`ADMIN_EMAIL` and `ADMIN_PASSWORD` are optional for startup, but if they are present the app will seed an initial admin account automatically.

## Local Setup

1. Change into the backend folder.

```bash
cd backEnd
```

2. Install dependencies.

```bash
npm install
```

3. Generate Prisma client and apply migrations.

```bash
npx prisma generate
npx prisma migrate dev
```

4. Start the API.

```bash
npm run dev
```

Use `npm start` for the non-watch runtime.

## Current Gaps

- There is no automated test suite yet
- The frontend is intentionally simple for the demo and does not yet support full form editing or submission moderation workflows
- There are no public API docs yet

## Frontend

The `frontEnd` app is a React + TypeScript + Vite SPA using:

- Zod for validation
- React Hook Form for form handling
- Zustand for auth state
- React Query for server state
- Axios for API access

It includes:

- Admin dashboard with form stats and form management
- Form creation screen
- Form detail screen with submission inspection
- Public shared form submission page
- Thank-you screen after submission

## Useful Entry Points

- [backEnd/server.ts](backEnd/server.ts)
- [backEnd/src/routes/index.ts](backEnd/src/routes/index.ts)
- [backEnd/src/modules/auth/auth.routes.ts](backEnd/src/modules/auth/auth.routes.ts)
- [backEnd/src/modules/department/department.routes.ts](backEnd/src/modules/department/department.routes.ts)
- [backEnd/src/modules/forms/form.routes.ts](backEnd/src/modules/forms/form.routes.ts)
- [backEnd/src/modules/submissions/submission.routes.ts](backEnd/src/modules/submissions/submission.routes.ts)
- [backEnd/prisma/schema.prisma](backEnd/prisma/schema.prisma)
