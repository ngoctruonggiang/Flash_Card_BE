# Update User Endpoint - Usage Guide

## Overview

The `PATCH /user` endpoint allows authenticated users to update their own profile information. You can update **one or more fields** in a single request.

---

## Available Fields

All fields are **optional** - include only the fields you want to update:

| Field      | Type   | Description       | Validation                                   |
| ---------- | ------ | ----------------- | -------------------------------------------- |
| `username` | string | New username      | 3-20 alphanumeric characters/underscores     |
| `email`    | string | New email address | Valid email format                           |
| `password` | string | New password      | Min 8 chars, at least 1 letter and 1 number  |
| `role`     | string | User role         | Enum: `USER`, `ADMIN` (typically admin-only) |

---

## How to Specify Which Fields to Edit

Simply include **only the fields you want to update** in the request body. The endpoint uses a PATCH method, which means it will only update the fields you provide.

### Example 1: Update Password Only

```bash
curl -X PATCH http://localhost:3000/user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "password": "newPassword123"
  }'
```

**Result**: Only the password is updated. Username and email remain unchanged.

---

### Example 2: Update Email Only

```bash
curl -X PATCH http://localhost:3000/user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "email": "newemail@example.com"
  }'
```

**Result**: Only the email is updated. Username and password remain unchanged.

---

### Example 3: Update Username Only

```bash
curl -X PATCH http://localhost:3000/user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "username": "mynewusername"
  }'
```

**Result**: Only the username is updated. Email and password remain unchanged.

---

### Example 4: Update Multiple Fields at Once

```bash
curl -X PATCH http://localhost:3000/user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "username": "mynewusername",
    "email": "newemail@example.com",
    "password": "newPassword123"
  }'
```

**Result**: All three fields are updated simultaneously.

---

## Testing in Postman

### Step 1: Get Your Access Token

First, sign in to get your JWT token:

1. **Method**: `POST`
2. **URL**: `http://localhost:3000/user/signin`
3. **Body** (raw JSON):

```json
{
  "email": "test@gmail.com",
  "password": "12345678a"
}
```

4. **Copy the `accessToken`** from the response.

---

### Step 2: Update Your Profile

1. **Method**: `PATCH`
2. **URL**: `http://localhost:3000/user`
3. **Headers**:
   - `Content-Type`: `application/json`
   - `Authorization`: `Bearer YOUR_ACCESS_TOKEN_HERE`
4. **Body** (raw JSON) - **Include only the fields you want to update**:

```json
{
  "password": "newPassword123"
}
```

Or to update multiple fields:

```json
{
  "username": "newusername",
  "email": "newemail@example.com"
}
```

---

## Important Notes

### ✅ Do's

- ✅ Include only the fields you want to update
- ✅ Provide a valid JWT token in the Authorization header
- ✅ Ensure new values meet validation requirements
- ✅ You can update one field or multiple fields in a single request

### ❌ Don'ts

- ❌ Don't include fields you don't want to change
- ❌ Don't forget the `Bearer` prefix in the Authorization header
- ❌ Don't use invalid email formats or weak passwords
- ❌ Don't try to update other users (this endpoint only updates your own profile)

---

## Validation Rules

### Username

- **Format**: Alphanumeric and underscores only
- **Length**: 3-20 characters
- **Regex**: `/^[a-zA-Z0-9_]{3,20}$/`

### Email

- **Format**: Valid email address
- **Example**: `user@example.com`

### Password

- **Minimum**: 8 characters
- **Requirements**: At least one letter AND one number
- **Regex**: `/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/`

---

## Response Examples

### Success Response (200 OK)

```json
{
  "statusCode": 200,
  "data": {
    "id": 1,
    "username": "newusername",
    "email": "newemail@example.com",
    "role": "USER",
    "createdAt": "2025-11-22T17:48:02.415Z",
    "lastLoginAt": "2025-11-22T17:48:02.415Z",
    "isEmailConfirmed": false
  },
  "message": "User updated successfully",
  "timestamp": "2025-11-22T18:05:30.123Z",
  "path": "/user"
}
```

### Error Response - Validation Failed (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": "Invalid username format",
  "timestamp": "2025-11-22T18:05:35.456Z",
  "path": "/user"
}
```

### Error Response - Unauthorized (401 Unauthorized)

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "timestamp": "2025-11-22T18:05:40.789Z",
  "path": "/user"
}
```

---

## Summary

**To specify which field to edit**: Simply include only that field in your request body!

- Want to change password? → Send `{"password": "newPassword123"}`
- Want to change email? → Send `{"email": "new@email.com"}`
- Want to change both? → Send `{"password": "newPassword123", "email": "new@email.com"}`

The PATCH method ensures only the fields you provide will be updated.
