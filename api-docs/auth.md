# **1\. Auth Endpoints**

Manage user registration and authentication.

### **1.1 Register**

Register a new user.

- **URL**: /auth/register
- **Method**: POST
- **Auth Required**: No

**Request Body (JSON):**

```json
{
  "username": "test",
  "email": "test@gmail.com",
  "password": "12345678a",
  "confirmPassword": "12345678a"
}
```

**Field Descriptions:**

- username (string, required): Unique username for the user
- email (string, required): Valid email address
- password (string, required): User's password
- confirmPassword (string, required): Must match the password field exactly

**Success Response (201 Created):**

```json
{
  "statusCode": 201,
  "timestamp": "2025-11-23T13:44:28.850Z",
  "message": "",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "id": 7,
    "username": "test",
    "email": "test@gmail.com",
    "role": "USER",
    "createdAt": "2025-11-23T13:44:28.843Z",
    "lastLoginAt": "2025-11-23T13:44:28.841Z"
  },
  "path": "/api/auth/register"
}
```

### **1.2 Login**

Authenticate a user and retrieve a JWT token.

- **URL**: /auth/login
- **Method**: POST
- **Auth Required**: No

**Request Body (JSON):**

```json
{
  "email": "test@gmail.com",
  "password": "12345678a"
}
```

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-23T13:44:28.917Z",
  "message": "",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "id": 7,
    "username": "test",
    "email": "test@gmail.com",
    "role": "USER",
    "createdAt": "2025-11-23T13:44:28.843Z",
    "lastLoginAt": "2025-11-23T13:44:28.841Z"
  },
  "path": "/api/auth/login"
}
```
