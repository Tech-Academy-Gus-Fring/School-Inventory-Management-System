# School-Inventory-Management-System

School inventory management system with:

- Express + Sequelize + PostgreSQL backend
- Vite + React frontend UI shell

## Backend Status

The backend currently provides:

- JWT authentication with refresh tokens
- Role-based access for `student`, `teacher`, and `admin`
- Equipment management
- Borrow request creation, approval, rejection, and return flows
- Inventory-aware request quantities
- Historical return-condition logging with admin query endpoints by request and equipment item

## Actual Backend API

All currently mounted backend routes are served under the `/api` prefix.

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Admin

- `GET /api/admin/dashboard`
- `POST /api/admin/users`
- `DELETE /api/admin/users/:id`
- `PUT /api/admin/users/:id/role`

### Equipment

- `GET /api/equipment`
- `GET /api/equipment/:id`
- `GET /api/equipment/:id/condition-history`
- `POST /api/equipment`
- `PUT /api/equipment/:id/status`
- `DELETE /api/equipment/:id`

### Requests

- `POST /api/requests`
- `GET /api/requests/my`
- `GET /api/requests/history/equipment/:id`
- `GET /api/requests/history/users/:id`
- `GET /api/requests/:id/condition-history`
- `PUT /api/requests/:id/approve`
- `PUT /api/requests/:id/reject`
- `PUT /api/requests/:id/return`

### Reports

- `GET /api/reports/usage`
- `GET /api/reports/history`
- `GET /api/reports/export`

### Notes

- `GET /api/requests/:id/condition-history/` is also accepted with a trailing slash.
- `GET /api/equipment/:id/condition-history/` is also accepted with a trailing slash.
- `src/routes/userRoutes.js` exists, but `/api/users/profile` is not currently mounted in `src/app.js`.

## Data Model Notes

- Primary keys are integer auto-increment IDs
- Equipment tracks available `quantity`
- Requests now store requested `quantity`
- Approving a request decreases available equipment quantity
- Returning a request restores equipment quantity
- Returning a request also writes a record to `return_condition_logs`
- Return-condition history can be queried by request or equipment item
- Returning a damaged item moves the equipment status to `under_repair`

## Backend Setup

```bash
cd backend
npm install
npx sequelize-cli db:create
npx sequelize-cli db:migrate
node seed.js
npm start
```

The backend runs on `http://localhost:5000` by default.

## Seed Data

The current seed script inserts sample equipment only. It does not create sample users.

## Frontend Note

The frontend in `frontend/` is still a design-phase UI and is not yet wired to the backend.
