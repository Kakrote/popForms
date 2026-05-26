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
- Submission creation route for authenticated `USER` and `ADMIN` accounts
- Startup admin seeding from environment variables
- Prisma schema, migrations, and a root-level Prisma config

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
- `PATCH /api/forms/:slug` - toggle form status, admin only
- `DELETE /api/forms/:slug` - delete a form, admin only
- `POST /api/submissions` - submit a form, authenticated `USER` or `ADMIN`

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

- The `frontEnd` directory is empty
- There is no automated test suite yet
- The API currently exposes routes for the implemented flows above, but not a full frontend or public API docs

## Useful Entry Points

- [backEnd/server.ts](backEnd/server.ts)
- [backEnd/src/routes/index.ts](backEnd/src/routes/index.ts)
- [backEnd/src/modules/auth/auth.routes.ts](backEnd/src/modules/auth/auth.routes.ts)
- [backEnd/src/modules/department/department.routes.ts](backEnd/src/modules/department/department.routes.ts)
- [backEnd/src/modules/forms/form.routes.ts](backEnd/src/modules/forms/form.routes.ts)
- [backEnd/src/modules/submissions/submission.routes.ts](backEnd/src/modules/submissions/submission.routes.ts)
- [backEnd/prisma/schema.prisma](backEnd/prisma/schema.prisma)
