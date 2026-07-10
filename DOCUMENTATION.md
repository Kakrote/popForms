# PopForms System Documentation

PopForms is an enterprise form builder and audit response submission system designed for managing multi-section institutional questionnaires, departmental submissions, security access controls, and submission histories. 

The primary business context for PopForms is the **PRAGATI Questionnaire Form Schema** developed for the **Internal Quality Assurance Cell (IQAC)** at **Uttaranchal University**. The system digitizes 19 pages of complex questionnaire fields covering 5-year academic progress (from 2021-22 to 2025-26), including programs, students, research publications, awards, patents, and extension programs. It replaces physical audits with a secure online portal where administrators compile forms, restrict access to specific school departments, moderate submissions, track audit history, and print results.

---

## 1. System Architecture & Tech Stack

PopForms is organized as a decoupled frontend-backend monorepo utilizing Docker for orchestration:

```
                  ┌──────────────────────────────┐
                  │      React SPA Frontend      │
                  │   Vite + TS + Zustand + RQ   │
                  └──────────────┬───────────────┘
                                 │ HTTP / JSON
                                 ▼
                  ┌──────────────────────────────┐
                  │      NodeJS Express API      │
                  │        TypeScript            │
                  └──────────────┬───────────────┘
                                 │ Prisma ORM
                                 ▼
                  ┌──────────────────────────────┐
                  │      PostgreSQL Database     │
                  │        Schema Public         │
                  └──────────────────────────────┘
```

### Back-End Tech Stack
*   **Runtime Environment**: Node.js with TypeScript support.
*   **Web Framework**: Express 5 (routing, controllers, error handlers).
*   **Database ORM**: Prisma 7 (schema modeling, auto-generated TypeScript clients, migration pipelines).
*   **Security & Authentication**: JWT (JSON Web Tokens) with `jsonwebtoken` and password hashing with `bcrypt`.
*   **Validation**: Zod (compiles request bodies against schemas at runtime).
*   **Logging**: Custom logger with integration for Winston-based logging.

### Front-End Tech Stack
*   **Build Tool & Dev Server**: Vite (speedy compiling, Hot Module Replacement).
*   **Component Framework**: React + TypeScript.
*   **Global State Management**: Zustand (stores token-based auth state and logged-in user profile).
*   **Server State & Caching**: React Query (TanStack Query) for data fetching, caching, and state synchronization.
*   **HTTP Clients**: Axios (with interceptors that append JWT authorization headers automatically).
*   **Report Generation**: jsPDF (custom, client-side PDF canvas mapping library for rendering questionnaire templates and submitted receipts).
*   **Forms Handler**: React Hook Form (manages complex section structures).

---

## 2. Directory Layout & Module Structure

The project code is divided into two primary subdirectories:

*   [backEnd](file:///C:/Users/anshu/OneDrive/Desktop/popForms/backEnd) - API server codebase.
*   [frontEnd](file:///C:/Users/anshu/OneDrive/Desktop/popForms/frontEnd) - Vite React Single Page Application (SPA).

### Back-End File Layout
*   [server.ts](file:///C:/Users/anshu/OneDrive/Desktop/popForms/backEnd/server.ts) - The application bootstrap entry point. Performs database admin user seeding and starts the HTTP listener.
*   [src/app.ts](file:///C:/Users/anshu/OneDrive/Desktop/popForms/backEnd/src/app.ts) - Express app configuration (CORS, body parsing, API router mounting, and global error middleware).
*   [src/routes/index.ts](file:///C:/Users/anshu/OneDrive/Desktop/popForms/backEnd/src/routes/index.ts) - The aggregator routing controller that maps specific resource paths to module routers.
*   [prisma/schema.prisma](file:///C:/Users/anshu/OneDrive/Desktop/popForms/backEnd/prisma/schema.prisma) - Relational model declarations for the PostgreSQL database.
*   [src/middlewares](file:///C:/Users/anshu/OneDrive/Desktop/popForms/backEnd/src/middlewares) - Interceptors for authentication ([auth.middlewares.ts](file:///C:/Users/anshu/OneDrive/Desktop/popForms/backEnd/src/middlewares/auth.middlewares.ts)) and error handling ([errorHandler.ts](file:///C:/Users/anshu/OneDrive/Desktop/popForms/backEnd/src/middlewares/errorHandler.ts)).
*   **Resource Modules (`src/modules/*`)**: Follows a strict Repository-Service-Controller structural pattern:
    *   `auth`: User authentication, login, and registration.
    *   `users`: User profile retrieval, listing, updates, and deletion.
    *   `department`: Department records creation and user assignments.
    *   `forms`: Dynamic forms, pages, sections, and fields configuration.
    *   `submissions`: Draft saving, final submission locks, and edit history logging.

### Front-End File Layout
*   [src/App.tsx](file:///C:/Users/anshu/OneDrive/Desktop/popForms/frontEnd/src/App.tsx) - Central layout declaring path routes and wrapping admin-only sections inside security route blocks.
*   [src/main.tsx](file:///C:/Users/anshu/OneDrive/Desktop/popForms/frontEnd/src/main.tsx) - Entry point executing the DOM render.
*   [src/types.ts](file:///C:/Users/anshu/OneDrive/Desktop/popForms/frontEnd/src/types.ts) - TypeScript data type mappings aligned with the Prisma client schema.
*   [src/lib/api.ts](file:///C:/Users/anshu/OneDrive/Desktop/popForms/frontEnd/src/lib/api.ts) - API wrappers grouping Axios calls into `authApi`, `formsApi`, `submissionsApi`, `departmentApi`, and `usersApi`.
*   [src/lib/pdf.ts](file:///C:/Users/anshu/OneDrive/Desktop/popForms/frontEnd/src/lib/pdf.ts) - Standardized layout generation utility for printing blank questionnaires and submission sheets using jsPDF.
*   [src/store/authStore.ts](file:///C:/Users/anshu/OneDrive/Desktop/popForms/frontEnd/src/store/authStore.ts) - Zustand store persistence layer storing authentication JWTs.
*   [src/pages](file:///C:/Users/anshu/OneDrive/Desktop/popForms/frontEnd/src/pages) - View components:
    *   `LoginPage.tsx`: Renders credentials portal.
    *   `UserLandingPage.tsx`: Portal for general departments to see assigned forms, trace submission statuses, and initialize reports.
    *   `PublicFormPage.tsx`: Interactive renderer dynamically rendering sections, category titles, and input fields.
    *   `admin/DashboardPage.tsx`: Admin interface with global telemetry, questionnaire status flags, and lists of submissions.
    *   `admin/FormBuilderPage.tsx`: Full drag-and-drop form creator to structure pages, header explanations, field tags, types, and dropdown list options.
    *   `admin/FormDetailPage.tsx`: Detailed admin summary of a questionnaire listing all submission records by department, showing audit logs, and rendering a read-only form grid.

---

## 3. Database Schema

The relational schema is configured in [schema.prisma](file:///C:/Users/anshu/OneDrive/Desktop/popForms/backEnd/prisma/schema.prisma) and maps out the structural entities:

```mermaid
erDiagram
    USER ||--o| PROFILE : "has"
    USER ||--o| DEPARTMENT : "manages"
    USER ||--o{ FORM : "creates"
    USER ||--o{ SUBMISSION : "submits"
    USER ||--o{ SUBMISSION_EDIT_HISTORY : "edits"
    
    DEPARTMENT ||--o{ FORM_ACCESS : "receives"
    DEPARTMENT ||--o{ SUBMISSION : "owns"
    
    FORM ||--o{ FORM_SECTION : "contains"
    FORM ||--o{ FORM_ACCESS : "restricts"
    FORM ||--o{ SUBMISSION : "receives"
    
    FORM_SECTION ||--o{ FIELD : "contains"
    
    FIELD ||--o{ FIELD_OPTION : "defines"
    FIELD ||--o{ SUBMISSION_VALUE : "stores"
    
    SUBMISSION ||--o{ SUBMISSION_VALUE : "contains"
    SUBMISSION ||--o{ SUBMISSION_EDIT_HISTORY : "tracks"
```

### Models & Columns Definition

#### 1. User
Represents users authenticated within the system. Users are classified by roles.
*   `id` (String, Primary Key, CUID): Unique user ID.
*   `username` (String): Full display name.
*   `email` (String, Unique): Registered email address.
*   `role` (Enum `Users`: `ADMIN`, `USER`): Permissions access flag.
*   `password` (String): Salted Bcrypt password hash.
*   `createdAt` / `updatedAt` (DateTime): Auditing timestamps.

#### 2. Profile
Extended user details.
*   `id` (String, Primary Key, CUID): Profile ID.
*   `bio` (String, Optional): Biographical snippet.
*   `avatar` (String, Optional): URL to thumbnail icon.
*   `userId` (String, Unique, FK): Links back to the User model.

#### 3. Department
An academic unit or school. Each department is linked to a unique user login.
*   `id` (String, Primary Key, CUID): Department ID.
*   `department_Name` (String, Unique): Public name (e.g. *Uttaranchal Institute of Technology*).
*   `userId` (String, Unique, FK, Optional): The User login representing this department.

#### 4. Form
A questionnaire structure (e.g., the PRAGATI audit).
*   `id` (String, Primary Key): Form ID.
*   `title` (String): Form display title.
*   `slug` (String, Unique): URL-friendly string identifier.
*   `description` (String, Optional): Explanatory block.
*   `isOpen` (Boolean, Default `true`): Active flag allowing or rejecting submissions.
*   `deadline` (DateTime, Optional): Date boundary constraint.
*   `createdById` (String, FK): User ID of the administrator creator.

#### 5. FormSection
Divides forms into logic blocks (e.g. *No. of students admitted during last 5 years in PG Programs*).
*   `id` (String, Primary Key): Section ID.
*   `formId` (String, FK): Linked Form.
*   `headerLabel` (String, Optional): Category header banner.
*   `headerDescription` (String, Optional): Sub-banner information text.
*   `title` (String): Section heading title.
*   `description` (String, Optional): Explanatory section helper notes.
*   `sortOrder` (Int, Default `0`): Section ordering weight.

#### 6. Field
Individual questions inside a FormSection.
*   `id` (String, Primary Key): Field ID.
*   `sectionId` (String, FK): Parent FormSection.
*   `label` (String): The question label (e.g., *2021-22*).
*   `fieldKey` (String): Machine name key (e.g., *prog_2021_22*). Unique within each section.
*   `fieldType` (Enum `FieldType`): Form element type:
    *   `TEXT`, `TEXTAREA`, `NUMBER`, `EMAIL`, `DATE`, `SELECT`, `RADIO`, `CHECKBOX`, `FILE`.
*   `placeholder` (String, Optional): Sample value helper.
*   `required` (Boolean, Default `false`): Submission blocker check.
*   `sortOrder` (Int): Sorting weight.
*   `defaultValue` (String, Optional): Initial input value.

#### 7. FieldOption
Select options for `SELECT`, `RADIO`, and `CHECKBOX` fields.
*   `id` (String, Primary Key): Option ID.
*   `fieldId` (String, FK): Linked Field.
*   `label` (String): Display value.
*   `value` (String): Data value.

#### 8. FormAccess
Maps form visibility to departments.
*   `id` (String, Primary Key): Entry ID.
*   `formId` (String, FK): Linked Form.
*   `departmentId` (String, FK): Authorized Department.
*   *Constraint*: Unique combination of `formId` and `departmentId`.

#### 9. Submission
Represents a department's response to a form.
*   `id` (String, Primary Key): Submission ID.
*   `formId` (String, FK): Form referenced.
*   `departmentId` (String, FK): Submitting department.
*   `submittedById` (String, FK, Optional): User account submitting.
*   `status` (Enum `SubmissionStatus`): `DRAFT` or `SUBMITTED`.
*   `isLocked` (Boolean, Default `false`): Flag blocking further user modification.
*   `submittedAt` (DateTime, Optional): Date of submission.
*   *Constraint*: Unique combination of `formId` and `departmentId`.

#### 10. SubmissionValue
Contains actual submitted values.
*   `id` (String, Primary key): Value record ID.
*   `submissionId` (String, FK): Parent Submission.
*   `fieldId` (String, FK): Linked Field.
*   `value` (String): Submitted value (stored as text).
*   *Constraint*: Unique combination of `submissionId` and `fieldId`.

#### 11. SubmissionEditHistory
Change tracking snapshot triggered whenever an administrator edits a department's submission.
*   `id` (String, Primary Key): History ID.
*   `submissionId` (String, FK): Linked Submission.
*   `editedById` (String, FK, Optional): Admin user performing the edit.
*   `changedValues` (String): JSON serialization of changes (including Field Label, Old Value, and New Value).
*   `editedAt` (DateTime, Default `now()`): Time of edit.

---

## 4. Backend API Reference

All requests must be prefixed with the root router path: `/api`.

### 1. Authentication Module
Mounted at `/api/auth` (Defined in [auth.routes.ts](file:///C:/Users/anshu/OneDrive/Desktop/popForms/backEnd/src/modules/auth/auth.routes.ts)).

| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/login` | Public | Any | Exchanges user credentials for a signed JWT token. |
| `POST` | `/register` | JWT | `ADMIN` | Creates new user accounts. |

#### `POST /login`
*   **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "password": "yourpassword"
    }
    ```
*   **Success Response** (200 OK):
    ```json
    {
      "success": true,
      "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
          "id": "cuid-user-123",
          "username": "Department Manager",
          "email": "user@example.com",
          "role": "USER"
        }
      }
    }
    ```

#### `POST /register`
*   **Request Body**:
    ```json
    {
      "username": "New Department Coordinator",
      "email": "coordinator@example.com",
      "password": "securepassword123",
      "role": "USER"
    }
    ```

---

### 2. User Management Module
Mounted at `/api/user` (Defined in [user.routes.ts](file:///C:/Users/anshu/OneDrive/Desktop/popForms/backEnd/src/modules/users/user.routes.ts)).

| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/users` | JWT | `ADMIN` | Returns a list of all registered users. |
| `GET` | `/:id` | JWT | `ADMIN` | Retrieves user details by ID. |
| `PATCH` | `/:id` | JWT | `ADMIN` | Updates username, email, and role. |
| `DELETE` | `/:id` | JWT | `ADMIN` | Deletes a user account. |

---

### 3. Department Management Module
Mounted at `/api/department` (Defined in [department.routes.ts](file:///C:/Users/anshu/OneDrive/Desktop/popForms/backEnd/src/modules/department/department.routes.ts)).

| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/` | JWT | `ADMIN` | Creates a new department name and links a user account ID. |
| `GET` | `/` | JWT | `ADMIN` | Returns list of all departments. |
| `GET` | `/me` | JWT | `USER` / `ADMIN` | Returns the department record linked to the logged-in user. |
| `GET` | `/:id` | JWT | `ADMIN` | Retrieves department details by ID. |
| `GET` | `/user/:userId` | JWT | `ADMIN` | Retrieves department linked to a specific user. |
| `PATCH` | `/:id` | JWT | `ADMIN` | Updates name or linked user. |
| `DELETE` | `/:id` | JWT | `ADMIN` | Deletes a department (onDelete: SetNull on User relationship). |

---

### 4. Forms Module
Mounted at `/api/forms` (Defined in [form.routes.ts](file:///C:/Users/anshu/OneDrive/Desktop/popForms/backEnd/src/modules/forms/form.routes.ts)).

| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | JWT | `USER` / `ADMIN` | Lists forms. Returns all forms for admins, or forms matching department access lists for users. |
| `GET` | `/:slug` | Optional | Any | Retrieves form structure by slug. If not admin, submission and access metadata are stripped. |
| `POST` | `/` | JWT | `ADMIN` | Creates a new form template (including sections, headers, and fields). |
| `PUT` | `/:slug` | JWT | `ADMIN` | Replaces/updates the structural layout of a form. |
| `PATCH` | `/:slug` | JWT | `ADMIN` | Toggles the `isOpen` status (accepting/rejecting submissions). |
| `DELETE` | `/:slug` | JWT | `ADMIN` | Deletes the form and cascades deletion to sections, fields, and accesses. |

---

### 5. Submissions Module
Mounted at `/api/submissions` (Defined in [submission.routes.ts](file:///C:/Users/anshu/OneDrive/Desktop/popForms/backEnd/src/modules/submissions/submission.routes.ts)).

| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | JWT | `ADMIN` | Lists all submissions. |
| `GET` | `/me` | JWT | `USER` / `ADMIN` | Lists the logged-in user's final submissions. |
| `GET` | `/me/drafts` | JWT | `USER` / `ADMIN` | Lists the logged-in user's saved drafts. |
| `GET` | `/form/:formId/me` | JWT | `USER` / `ADMIN` | Returns the logged-in user's submission for a form, if exists. |
| `GET` | `/:id` | JWT | `ADMIN` | Retrieves a specific submission with values and edit history. |
| `POST` | `/` | JWT | `USER` / `ADMIN` | Creates a submission or saves a draft. |
| `PATCH` | `/:id` | JWT | `ADMIN` | Updates submission values and logs change history. |
| `DELETE` | `/:id` | JWT | `USER` / `ADMIN` | Deletes a submission. Users can only delete their own drafts. |

#### Create Submission / Save Draft Payload
*   **URL**: `/api/submissions`
*   **Method**: `POST`
*   **Request Body**:
    ```json
    {
      "formId": "form-id-cuid",
      "departmentId": "department-id-cuid",
      "status": "SUBMITTED", // or "DRAFT"
      "values": [
        {
          "fieldId": "field-id-1",
          "value": "Law College Dehradun"
        },
        {
          "fieldId": "field-id-2",
          "value": "24"
        }
      ]
    }
    ```

---

## 5. Security, Validation & Global Middleware

### Authentication & Authorization Pipeline
1.  **Extract Header**: The request checks for the `Authorization: Bearer <token>` header.
2.  **Verify Signature**: If present, the token signature is verified against `JWT_SECRET`.
3.  **Role Verification**: If authenticated, [authorizeRoles](file:///C:/Users/anshu/OneDrive/Desktop/popForms/backEnd/src/middlewares/auth.middlewares.ts#L51-L72) checks if the decoded user role is included in the allowed roles for the endpoint. If not, it returns `403 Forbidden`.

### Validation
Input payloads for creation, update, and parameters are parsed using **Zod** schema schemas (e.g., `createFormSchema` and `createSubmissionSchema`). If parsing fails, Zod throws an error which is caught by the global error handler.

### Error Handling
The backend uses a class named `AppError` (derived from `Error`) to model operational errors (such as `404 Not Found` or `409 Conflict`). Uncaught exceptions are intercepted by [globalErrorHandler](file:///C:/Users/anshu/OneDrive/Desktop/popForms/backEnd/src/middlewares/errorHandler.ts#L27-L66):
*   **Operational Errors**: Return formatted JSON: `{ "status": "fail", "message": "..." }`.
*   **Programming Errors (500)**: Log the traceback details to the console and to the file `/app/container_errors.log` (in containerized environments) while returning a generic `Internal Server Error` to prevent leaking system details.

---

## 6. Frontend Architecture & State Flow

The React SPA utilizes a modern architecture for state management and API access:

```
    ┌────────────────────────────────────────────────────────┐
    │                       React Views                      │
    │  (PublicFormPage, DashboardPage, UserLandingPage...)   │
    └───────────┬───────────────────────────────▲────────────┘
                │ Actions                       │ Server State
                ▼                               │
    ┌───────────────────────────┐    ┌──────────┴────────────┐
    │       Zustand Store       │    │      React Query      │
    │ (Auth Token & User State) │    │  (Caching & Mutate)   │
    └───────────┬───────────────┘    └──────────▲────────────┘
                │ Headers                       │ Axios
                ▼                               │
    ┌───────────────────────────────────────────┴────────────┐
    │                     Axios Interceptor                  │
    │         apiClient.interceptors.request.use()           │
    └────────────────────────────────────────────────────────┘
```

### Global State (Zustand)
Declared in [authStore.ts](file:///C:/Users/anshu/OneDrive/Desktop/popForms/frontEnd/src/store/authStore.ts), the state stores:
1.  `token`: Session JWT token string.
2.  `user`: Logged-in user information profile.

The store utilizes local storage synchronization to persist sessions across page reloads.

### Server State (React Query)
Server-side data (like lists of forms, department info, and submissions) are fetched via **React Query** queries. 
*   **Mutations**: Changes (like saving drafts or submitting forms) trigger React Query mutations. Upon success, they invalidate queries to refresh the UI automatically.

### Axios Interceptor
Defined in [api.ts](file:///C:/Users/anshu/OneDrive/Desktop/popForms/frontEnd/src/lib/api.ts), the interceptor automatically reads the token from Zustand and injects it as an authorization header into every outgoing HTTP request.

---

## 7. Report Generation (jsPDF Integration)

One of PopForms' main features is generating PDF files directly in the browser using **jsPDF** (defined in [pdf.ts](file:///C:/Users/anshu/OneDrive/Desktop/popForms/frontEnd/src/lib/pdf.ts)):

1.  **`generateBlankFormPDF(form: Form)`**:
    Renders a blank representation of the form sections, headers, and fields. This provides users with a printable paper questionnaire they can use to gather data before entering it online.
2.  **`generateSubmissionPDF(submission: Submission)`**:
    Generates a submission receipt of a department's response. It renders a clean grid of responses grouped by section, complete with metadata (such as receipt ID, submitting user, department name, timestamp, and signature blocks).

Both functions use a manual grid layout system that computes page height limits (`maxY`) and calls page break helpers to avoid text overlaps across pages.

---

## 8. Core Workflows

### 1. Form Compilation & Mapping
```
   [Admin: Creates Form Layout] ──► [Assigns Department Access] ──► [Active & Open Status]
```
1.  **Admin Creation**: Admin uses [FormBuilderPage](file:///C:/Users/anshu/OneDrive/Desktop/popForms/frontEnd/src/pages/admin/FormBuilderPage.tsx) to define form structures (title, deadlines, sections, fields, types, selection options).
2.  **Access Limits**: The admin selects which departments are authorized to access this form.
3.  **Active Toggle**: Once saved, the admin can activate the form. Only active forms are visible to assigned departments.

### 2. Department Submission Process
```
   [User: Opens Form] ──► [Saves Draft (Optional)] ──► [Submits Form] ──► [Locked]
```
1.  **Data Retrieval**: The department user logs in, accesses [UserLandingPage](file:///C:/Users/anshu/OneDrive/Desktop/popForms/frontEnd/src/pages/UserLandingPage.tsx), and selects the form.
2.  **Save Draft**: The user enters data. Clicking **Save Draft** writes values to the database with `status: "DRAFT"`. This allows them to resume editing later. Drafts do not lock the form.
3.  **Final Submission**: Clicking **Submit** changes the status to `"SUBMITTED"`, locks the form, and prevents the user from making further edits.

### 3. Admin Moderation & Audit Trails
```
   [Admin: Modifies Values] ──► [Change Comparison] ──► [Edit History Log Created]
```
1.  **Submission Inspection**: The administrator views submitted forms in the dashboard.
2.  **Lock Override**: If corrections are needed, the administrator can edit the values directly.
3.  **Audit Logging**: The backend computes a diff of the changes, serializes it, and saves an entry to the `SubmissionEditHistory` database table.

---

## 9. Environment Setup & Deployment

### Environment Variables
Configure a `.env` file in [backEnd](file:///C:/Users/anshu/OneDrive/Desktop/popForms/backEnd) with the following variables:
```env
PORT=5000
DATABASE_URL=postgresql://popforms:popforms@localhost:5432/popforms?schema=public
JWT_SECRET=your_long_secure_random_string_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=supersecurepassword
ADMIN_USERNAME=admin
NODE_ENV=development
```

Configure a `.env` file in [frontEnd](file:///C:/Users/anshu/OneDrive/Desktop/popForms/frontEnd):
```env
VITE_API_URL=http://localhost:5000/api
```

---

### Local Setup (Without Docker)

#### 1. Setup Backend
1.  Change into the directory:
    ```bash
    cd backEnd
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Apply Prisma database migrations and generate the client library:
    ```bash
    npx prisma generate
    npx prisma migrate dev
    ```
4.  Start development server:
    ```bash
    npm run dev
    ```

#### 2. Setup Frontend
1.  Change into the directory:
    ```bash
    cd ../frontEnd
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start Dev Server:
    ```bash
    npm run dev
    ```
4.  Open the web app at `http://localhost:5173`.

---

### Docker Deployment (Multi-Container Setup)

PopForms includes a multi-container Docker configuration. To deploy:

1.  Make sure Docker is running on your machine.
2.  Open the monorepo root folder:
    ```bash
    cd popForms
    ```
3.  Build and run the stack:
    ```bash
    docker compose up --build
    ```

Docker Compose spins up three services based on [docker-compose.yml](file:///C:/Users/anshu/OneDrive/Desktop/popForms/docker-compose.yml):
1.  **`db`**: Runs PostgreSQL 16 on container port 5432 (mapped to host port `5433`).
2.  **`backend`**: Builds the Node API, awaits database healthchecks, runs migrations, and binds to port `5000`.
3.  **`frontend`**: Compiles the React production code and serves it via Nginx on port `5173`.
