# 🏕️ Project Camp Backend

A RESTful backend API for **collaborative project management**. Teams can organize projects, assign tasks with subtasks, keep project notes, and manage members, all protected by JWT authentication and role-based access control (RBAC).

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![API](https://img.shields.io/badge/API-REST-green)
![Auth](https://img.shields.io/badge/auth-JWT-orange)

---

## 📑 Table of Contents

- [Features](#-features)
- [User Roles](#-user-roles)
- [Permission Matrix](#-permission-matrix)
- [API Reference](#-api-reference)
- [Data Models](#-data-models)
- [Security](#-security)
- [File Uploads](#-file-uploads)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🔐 Authentication & Authorization
- User registration with **email verification**
- Secure login using **JWT access + refresh tokens**
- Change password, forgot password and reset password flows
- Resend verification email
- Role-based access control (Admin, Project Admin, Member)

### 📁 Project Management
- Create projects with a name and description
- List all projects you have access to (with member count)
- View, update and delete projects (Admin only for update/delete)

### 👥 Team Member Management
- Add members to a project via email
- List all project members
- Update member roles and remove members (Admin only)

### ✅ Task Management
- Create tasks with title, description and assignee
- Track status: `todo` → `in_progress` → `done`
- Attach **multiple files** to a task
- Update, view and delete tasks

### 🧩 Subtask Management
- Break tasks into smaller subtasks
- Members can mark subtasks as complete
- Only Admin / Project Admin can create or delete subtasks

### 📝 Project Notes
- Admins can create, update and delete notes
- All project members can view notes

### ❤️ System Health
- Health check endpoint for uptime monitoring

---

## 👤 User Roles

| Role | Description |
|------|-------------|
| `admin` | Full access. Creates and manages projects, members, and notes. |
| `project_admin` | Manages tasks and subtasks within assigned projects. |
| `member` | Views projects, tasks and notes; updates subtask completion status. |

---

## 🔒 Permission Matrix

| Feature                    | Admin | Project Admin | Member |
| -------------------------- | :---: | :-----------: | :----: |
| Create Project             |  ✅   |      ❌       |   ❌   |
| Update / Delete Project    |  ✅   |      ❌       |   ❌   |
| Manage Project Members     |  ✅   |      ❌       |   ❌   |
| Create / Update / Delete Tasks |  ✅   |      ✅       |   ❌   |
| View Tasks                 |  ✅   |      ✅       |   ✅   |
| Update Subtask Status      |  ✅   |      ✅       |   ✅   |
| Create / Delete Subtasks   |  ✅   |      ✅       |   ❌   |
| Create / Update / Delete Notes |  ✅   |      ❌       |   ❌   |
| View Notes                 |  ✅   |      ✅       |   ✅   |

---

## 📡 API Reference

**Base URL:** `/api/v1`

Routes marked 🔒 require a valid access token (`Authorization: Bearer <token>`).

### Authentication — `/api/v1/auth`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| POST | `/register` | Register a new user | |
| POST | `/login` | Log in and receive tokens | |
| POST | `/logout` | Log out | 🔒 |
| GET | `/current-user` | Get logged-in user's info | 🔒 |
| POST | `/change-password` | Change password | 🔒 |
| POST | `/refresh-token` | Get a new access token | |
| GET | `/verify-email/:verificationToken` | Verify email address | |
| POST | `/forgot-password` | Request a password reset email | |
| POST | `/reset-password/:resetToken` | Reset forgotten password | |
| POST | `/resend-email-verification` | Resend verification email | 🔒 |

### Projects — `/api/v1/projects`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | List your projects | 🔒 |
| POST | `/` | Create a project | 🔒 |
| GET | `/:projectId` | Get project details | 🔒 Role-based |
| PUT | `/:projectId` | Update project | 🔒 Admin |
| DELETE | `/:projectId` | Delete project | 🔒 Admin |
| GET | `/:projectId/members` | List members | 🔒 |
| POST | `/:projectId/members` | Add a member | 🔒 Admin |
| PUT | `/:projectId/members/:userId` | Update member role | 🔒 Admin |
| DELETE | `/:projectId/members/:userId` | Remove member | 🔒 Admin |

### Tasks — `/api/v1/tasks`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/:projectId` | List project tasks | 🔒 Role-based |
| POST | `/:projectId` | Create a task | 🔒 Admin / Project Admin |
| GET | `/:projectId/t/:taskId` | Get task details | 🔒 Role-based |
| PUT | `/:projectId/t/:taskId` | Update task | 🔒 Admin / Project Admin |
| DELETE | `/:projectId/t/:taskId` | Delete task | 🔒 Admin / Project Admin |
| POST | `/:projectId/t/:taskId/subtasks` | Create subtask | 🔒 Admin / Project Admin |
| PUT | `/:projectId/st/:subTaskId` | Update subtask | 🔒 Role-based |
| DELETE | `/:projectId/st/:subTaskId` | Delete subtask | 🔒 Admin / Project Admin |

### Notes — `/api/v1/notes`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/:projectId` | List project notes | 🔒 Role-based |
| POST | `/:projectId` | Create a note | 🔒 Admin |
| GET | `/:projectId/n/:noteId` | Get note details | 🔒 Role-based |
| PUT | `/:projectId/n/:noteId` | Update note | 🔒 Admin |
| DELETE | `/:projectId/n/:noteId` | Delete note | 🔒 Admin |

### Health Check — `/api/v1/healthcheck`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Returns system health status |

---

## 🗂️ Data Models

**User roles:** `admin`, `project_admin`, `member`

**Task status:** `todo`, `in_progress`, `done`

**Task attachments** store metadata: file `url`, `mimetype`, and `size`.

---

## 🛡️ Security

- JWT authentication with refresh tokens
- Role-based authorization middleware
- Input validation on all endpoints
- Email verification for new accounts
- Secure password reset flow
- Safe file uploads using **Multer**
- Configured **CORS** for cross-origin requests

---

## 📎 File Uploads

- Multiple files can be attached to a single task
- Files are stored in `public/images`
- Metadata (URL, MIME type, size) is saved with each file

---

## 🚀 Getting Started

> Update the commands below to match your actual stack and scripts.

### Prerequisites
- Node.js (v18+ recommended)
- A database (e.g. MongoDB)
- An SMTP service for sending emails (e.g. Mailtrap, Gmail)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
# then fill in the values

# 4. Start the development server
npm run dev
```

The API will be available at `http://localhost:<PORT>/api/v1`.

Test it:

```bash
curl http://localhost:<PORT>/api/v1/healthcheck
```
<!-- 
---

## 🔧 Environment Variables

Example `.env` (adjust names to match your code):

```env
PORT=8000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/project-camp

# JWT
ACCESS_TOKEN_SECRET=your_access_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRY=10d

# Email (SMTP)
MAIL_SMTP_HOST=
MAIL_SMTP_PORT=
MAIL_SMTP_USER=
MAIL_SMTP_PASS=

# Frontend / base URL used in email links
FORGOT_PASSWORD_REDIRECT_URL=http://localhost:3000/reset-password
```

⚠️ Never commit your real `.env` file. Add it to `.gitignore`. -->

---

## 📂 Project Structure

Suggested layout (adjust to match your repo):

```
├── public/
│   └── images/          # Uploaded task attachments
├── src/
│   ├── controllers/     # Route logic
│   ├── routes/          # API route definitions
│   ├── models/          # Database schemas
│   ├── middlewares/     # Auth, role checks, validation, multer
│   ├── validators/      # Input validation rules
│   ├── utils/           # Helpers (email, API response/error)
│   ├── db/              # Database connection
│   ├── app.js
│   └── index.js
├── .env.example
├── package.json
└── README.md
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).