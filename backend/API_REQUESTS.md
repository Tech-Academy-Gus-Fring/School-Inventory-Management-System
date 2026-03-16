# API Request Examples

Base URL: `http://localhost:5000`

---

## 🔐 Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student"
}
```

**Roles:** `student`, `teacher`, `admin`

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "student",
    "createdAt": "2026-03-12T14:30:00.000Z"
  }
}
```

---

### 2. Login
**POST** `/auth/login`

**Option A - Login with Email:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Option B - Login with Username:**
```json
{
  "username": "john_doe",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "student",
    "createdAt": "2026-03-12T14:30:00.000Z"
  }
}
```

**Note:** `refreshToken` is automatically set as httpOnly cookie

---

### 3. Refresh Access Token
**POST** `/auth/refresh`

**Headers:**
```
Cookie: refreshToken=abc123def456...
```

**OR Body (if not using cookies):**
```json
{
  "refreshToken": "abc123def456..."
}
```

**Response (200):**
```json
{
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

---

### 4. Logout
**POST** `/auth/logout`

**Headers:**
```
Cookie: refreshToken=abc123def456...
```

**OR Body (if not using cookies):**
```json
{
  "refreshToken": "abc123def456..."
}
```

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

---

## 👤 User Endpoints

### 5. Get User Profile
**GET** `/users/profile`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "message": "User profile accessed successfully",
  "user": {
    "userId": 1,
    "role": "student",
    "email": "john@example.com"
  }
}
```

---

## 🔧 Equipment Endpoints

### 6. Get Equipment by ID
**GET** `/equipment/:id`

**Example:** `GET /equipment/1`

**Response (200):**
```json
{
  "id": 1,
  "name": "MacBook Pro",
  "type": "Laptop",
  "serial_number": "MBP123456",
  "condition": "good",
  "status": "available",
  "location": "Room 101",
  "photo_url": "https://example.com/photo.jpg",
  "quantity": 5,
  "created_at": "2026-03-12T10:00:00.000Z",
  "updated_at": "2026-03-12T10:00:00.000Z"
}
```

**Response (404):**
```json
{
  "message": "Equipment with ID 999 not found"
}
```

---

### 7. Get All Equipment (with filters)
**GET** `/equipment`

**Query Parameters:**
- `search` - Search in name, type, serial_number
- `type` - Filter by equipment type
- `status` - Filter by status (available, checked_out, under_repair, retired)
- `condition` - Filter by condition (new, good, fair, damaged)

**Examples:**

```
GET /equipment
GET /equipment?search=laptop
GET /equipment?type=Laptop
GET /equipment?status=available
GET /equipment?search=mac&status=available
GET /equipment?type=Laptop&condition=good
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "MacBook Pro",
    "type": "Laptop",
    "serial_number": "MBP123456",
    "condition": "good",
    "status": "available",
    "location": "Room 101",
    "photo_url": "https://example.com/photo.jpg",
    "quantity": 5,
    "created_at": "2026-03-12T10:00:00.000Z",
    "updated_at": "2026-03-12T10:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Dell Monitor",
    "type": "Monitor",
    "serial_number": "DM789012",
    "condition": "new",
    "status": "available",
    "location": "Room 102",
    "photo_url": null,
    "quantity": 10,
    "created_at": "2026-03-12T11:00:00.000Z",
    "updated_at": "2026-03-12T11:00:00.000Z"
  }
]
```

---

### 7.1 Delete Equipment (Admin Only)
**DELETE** `/equipment/:id`

**Example:** `DELETE /equipment/1`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Note:** Requires `admin` role. Only equipment with status `retired` can be deleted.

**Response (200):**
```json
{
  "message": "Equipment with ID 1 deleted successfully"
}
```

**Response (400) - If not retired:**
```json
{
  "message": "Cannot delete equipment that is not retired"
}
```

**Response (403) - If not admin:**
```json
{
  "message": "Access denied. Insufficient permissions."
}
```

**Response (404):**
```json
{
  "message": "Equipment with ID 999 not found"
}
```

---

## 🔒 Admin Endpoints

### 8. Get Admin Dashboard
**GET** `/admin/dashboard`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Note:** Requires `admin` role

**Response (200):**
```json
{
  "message": "Welcome to the admin dashboard",
  "user": {
    "userId": 1,
    "role": "admin",
    "email": "admin@example.com"
  }
}
```

**Response (403) - If not admin:**
```json
{
  "message": "Access denied. Insufficient permissions."
}
```

---

### 9. Delete User (Admin Only)
**DELETE** `/admin/users/:id`

**Example:** `DELETE /admin/users/5`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Note:** Requires `admin` role

**Response (200):**
```json
{
  "message": "Admin is allowed to delete user with id 5"
}
```

---

## 📋 cURL Examples

### Register
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "student"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Profile (with token)
```bash
curl -X GET http://localhost:5000/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### Get Equipment by ID
```bash
curl -X GET http://localhost:5000/equipment/1
```

### Get All Equipment with Search
```bash
curl -X GET "http://localhost:5000/equipment?search=laptop&status=available"
```

### Delete Equipment (Admin Only)
```bash
curl -X DELETE http://localhost:5000/equipment/1 \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN_HERE"
```

### Refresh Token
```bash
curl -X POST http://localhost:5000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

### Logout
```bash
curl -X POST http://localhost:5000/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

### Admin Dashboard
```bash
curl -X GET http://localhost:5000/admin/dashboard \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN_HERE"
```

---

## 🔑 Authentication Flow Example

1. **Register a new user:**
```bash
POST /auth/register
```

2. **Login to get tokens:**
```bash
POST /auth/login
# Save the accessToken from response
# refreshToken is automatically saved in httpOnly cookie
```

3. **Use access token for authenticated requests:**
```bash
GET /users/profile
Header: Authorization: Bearer {accessToken}
```

4. **When access token expires (after 15 min), refresh it:**
```bash
POST /auth/refresh
# Get new accessToken
```

5. **Logout when done:**
```bash
POST /auth/logout
```

---

## ⚠️ Common Error Responses

### 400 Bad Request
```json
{
  "message": "Email or username and password are required"
}
```

### 401 Unauthorized
```json
{
  "message": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied. Insufficient permissions."
}
```

### 404 Not Found
```json
{
  "message": "Equipment with ID 999 not found"
}
```

### 409 Conflict
```json
{
  "message": "Email already exists"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal Server Error"
}
```

---

## 📝 Notes

- **Access Token Expiration:** 15 minutes
- **Refresh Token Expiration:** 7 days
- **Base URL:** http://localhost:5000 (development)
- **Content-Type:** application/json (for all POST/PUT requests)
- **Authorization Header Format:** `Bearer {token}`
