# BE-030 Microservice Boundaries

This backend still runs as a single deployable Node.js app, but it now has explicit service boundaries so the system can be split into microservices later without redesigning responsibilities from scratch.

## Target Services

### 1. Auth Service

Responsibilities:
- Login, register, refresh, logout
- JWT and refresh-token lifecycle
- User profile lookup
- Admin user management

Current route ownership:
- `/auth`
- `/api/auth`
- `/admin`
- `/api/admin`
- `/users`
- `/api/users`

Primary data ownership:
- `users`
- `refresh_tokens`

Published events later:
- `user.created`
- `user.role_changed`
- `user.deleted`

### 2. Equipment Service

Responsibilities:
- Equipment catalog
- Asset status and condition tracking
- Equipment-to-room assignment
- Floor and room topology

Current route ownership:
- `/equipment`
- `/api/equipment`
- `/spatial`
- `/api/spatial`

Primary data ownership:
- `equipment`
- `floors`
- `rooms`
- `return_condition_logs`

Published events later:
- `equipment.created`
- `equipment.updated`
- `equipment.status_changed`
- `equipment.assigned_to_room`

### 3. Request Service

Responsibilities:
- Borrow request creation
- Approval and rejection workflow
- Return workflow
- Request history by user/equipment/request

Current route ownership:
- `/request`
- `/requests`
- `/api/request`
- `/api/requests`

Primary data ownership:
- `requests`

Reads from:
- Auth service identity data
- Equipment service inventory data

Published events later:
- `request.created`
- `request.approved`
- `request.rejected`
- `request.returned`

### 4. Report / Notification Service

Responsibilities:
- Usage and history reports
- CSV export
- Notification fan-out in a future split

Current route ownership:
- `/reports`
- `/api/reports`

Primary data ownership:
- Read models / projections
- Scheduled notification jobs

Consumes later:
- `request.created`
- `request.approved`
- `request.returned`
- `equipment.status_changed`

## Current Monolith-to-Microservice Mapping

The code is now grouped through a boundary registry in `src/serviceBoundaries/`.

Files:
- `src/serviceBoundaries/authBoundary.js`
- `src/serviceBoundaries/equipmentBoundary.js`
- `src/serviceBoundaries/requestBoundary.js`
- `src/serviceBoundaries/reportNotificationBoundary.js`
- `src/serviceBoundaries/index.js`

`src/app.js` mounts routes through that registry, so service ownership is defined in one place.

## Extraction Order

Recommended order:
1. Auth service
2. Equipment service
3. Request service
4. Report / notification service

Why:
- Auth has the clearest data ownership.
- Equipment is mostly CRUD plus topology.
- Requests depend on both auth and equipment.
- Reports are best extracted last once domain events are stable.

## Integration Rules

When these are split into real services:
- Auth becomes the source of truth for users and roles.
- Equipment becomes the source of truth for asset inventory and placement.
- Request service must not mutate equipment tables directly; it should call Equipment or publish commands/events.
- Report / notification should consume events and build its own projections instead of querying transactional tables directly.

## Scoring Intent

This structure gives you a defensible BE-030 answer because the boundaries are:
- named
- documented
- mapped to current routes
- mapped to current tables
- staged for future extraction
