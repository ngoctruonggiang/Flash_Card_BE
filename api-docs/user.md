# **2\. User Endpoints**

Manage user accounts.

### **2.1 Get Current User**

Retrieve details of the currently authenticated user.

- **URL**: /user
- **Method**: GET
- **Auth Required**: Yes

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-23T13:44:28.928Z",
  "message": "Get Current User",
  "data": {
    "username": "test",
    "email": "test@gmail.com",
    "role": "USER",
    "createdAt": "2025-11-23T13:44:28.843Z",
    "lastLoginAt": "2025-11-23T13:44:28.841Z"
  },
  "path": "/api/user"
}
```

### **2.2 Update Current User**

Update the currently authenticated user's information.

- **URL**: /user
- **Method**: PATCH
- **Auth Required**: Yes

**Request Body (JSON):**

```json
{
  "username": "newusername",
  "email": "newemail@example.com"
}
```

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-23T13:44:28.966Z",
  "message": "Update User",
  "data": {
    "id": 7,
    "username": "newusername",
    "email": "newemail@example.com",
    "role": "USER",
    "passwordHash": "$2b$10$GGa/AfDJL6EnWiUelTNzi...",
    "createdAt": "2025-11-23T13:44:28.843Z",
    "lastLoginAt": "2025-11-23T13:44:28.841Z",
    "isEmailConfirmed": false
  },
  "path": "/api/user"
}
```

### **2.3 Delete Current User**

Delete the currently authenticated user's account.

- **URL**: /user
- **Method**: DELETE
- **Auth Required**: Yes

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-23T13:44:29.189Z",
  "message": "Delete User",
  "data": {
    "id": 7,
    "username": "test",
    "email": "test@gmail.com",
    "role": "USER",
    "createdAt": "2025-11-23T13:44:28.843Z",
    "lastLoginAt": "2025-11-23T13:44:28.841Z"
  },
  "path": "/api/user"
}
```

**Note:** Delete operations may return a 500 error if there are related records (cascading delete issue).

### **2.4 Get User By ID (Admin)**

Retrieve details of a specific user by their ID. Requires Admin privileges.

- **URL**: /user/:id
- **Method**: GET
- **Auth Required**: Yes (Admin)

### **2.5 Get All Users (Admin)**

Retrieve a list of all users. Requires Admin privileges.

- **URL**: /user/all
- **Method**: GET
- **Auth Required**: Yes (Admin)

### **2.6 Admin Update User**

Update a specific user's details (e.g., role). Requires Admin privileges.

- **URL**: /user/:id
- **Method**: PATCH
- **Auth Required**: Yes (Admin)

### **2.7 Admin Delete User**

Delete a specific user by their ID. Requires Admin privileges.

- **URL**: /user/:id
- **Method**: DELETE
- **Auth Required**: Yes (Admin)
