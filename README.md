# Team Task Manager

A full-stack web app for managing projects and tasks with role-based access control.

## Live Demo
- Frontend: `https://artistic-insight-production-4c9e.up.railway.app`
- Backend API: `https://task-manager-production-02cf.up.railway.app`

## Features

- **Authentication** — Signup/Login with JWT tokens
- **Projects** — Create projects, add team members
- **Role-Based Access** — Admin (full control) / Member (view & update tasks)
- **Tasks** — Create, assign, set priority, track status (Todo / In Progress / Done)
- **Dashboard** — Stats: total, overdue, status breakdown

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React, Vite, React Router, Axios |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Auth | JWT + bcryptjs |
| Deployment | Railway |

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | — | Create account |
| POST | /api/auth/login | — | Login |
| GET | /api/projects | ✓ | List my projects |
| POST | /api/projects | ✓ | Create project |
| GET | /api/projects/:id | ✓ | Project + members |
| POST | /api/projects/:id/members | Admin | Add member |
| GET | /api/projects/:id/tasks | ✓ | List tasks |
| POST | /api/projects/:id/tasks | ✓ | Create task |
| PATCH | /api/projects/:id/tasks/:tid | ✓ | Update task |
| DELETE | /api/projects/:id/tasks/:tid | ✓ | Delete task |

## Local Setup

```bash
# Backend
cd backend
cp .env.example .env   # fill in DATABASE_URL and JWT_SECRET
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```
