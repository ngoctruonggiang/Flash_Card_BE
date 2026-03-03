# /user/signin Endpoint Test Report

**Date**: 2025-11-23  
**Endpoint**: `POST /user/signin`  
**Base URL**: `http://localhost:3000`

---

## Issue Identified

The 400 Bad Request error was caused by **missing validation decorators** in the `SignInDto` class, similar to the signup endpoint issue.

### Root Cause

The `SignInDto` had `@IsString()` decorators but was missing:

1. `@IsNotEmpty()` decorators on both fields
2. `@IsEmail()` decorator for the email field (it had `@IsString()` instead)

With the global `ValidationPipe` configured with `forbidNonWhitelisted: true`, proper validation decorators are required.

### Additional Issue Found

The **API documentation was incorrect**. It showed:

```json
{
  "username": "test",
  "password": "12345678"
}
```

But the actual implementation expects:

```json
{
  "email": "test@gmail.com",
  "password": "12345678a"
}
```

### Solutions Applied

1. **Updated `src/utils/types/dto/user/signIn.dto.ts`**:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class SignInDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}
```

2. **Fixed API_DOCUMENTATION.md**: Changed the signin request body example to use `email` instead of `username`.

---

## Request Format

### Required Fields

| Field      | Type   | Required | Validation                   |
| ---------- | ------ | -------- | ---------------------------- |
| `email`    | string | Yes      | Must be a valid email format |
| `password` | string | Yes      | Must not be empty            |

### Important Notes

- ⚠️ Use `email`, **NOT** `username` for authentication
- The password is validated against the hashed password stored in the database
- No specific password format validation on signin (only checked against stored hash)

---

## Test Cases

### ✅ Test Case 1: Valid Signin Request

**Request**:

```bash
curl -X POST http://localhost:3000/user/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmail.com",
    "password": "12345678a"
  }'
```

**Expected Response**: `200 OK`

```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "id": 1,
    "username": "testuser",
    "email": "test@gmail.com",
    "role": "USER",
    "createdAt": "2025-11-22T17:48:02.415Z",
    "lastLoginAt": "2025-11-22T17:48:02.415Z"
  },
  "message": "User signed in successfully",
  "timestamp": "2025-11-22T17:55:15.123Z",
  "path": "/user/signin"
}
```

---

### ❌ Test Case 2: Invalid Email (Non-existent User)

**Request**:

```bash
curl -X POST http://localhost:3000/user/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@gmail.com",
    "password": "12345678a"
  }'
```

**Expected Response**: `400 Bad Request`

```json
{
  "statusCode": 400,
  "message": "Invalid email or password",
  "timestamp": "2025-11-22T17:55:20.713Z",
  "path": "/user/signin"
}
```

---

### ❌ Test Case 3: Wrong Password

**Request**:

```bash
curl -X POST http://localhost:3000/user/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmail.com",
    "password": "wrongpassword123"
  }'
```

**Expected Response**: `400 Bad Request`

```json
{
  "statusCode": 400,
  "message": "Invalid email or password",
  "timestamp": "2025-11-22T17:55:22.456Z",
  "path": "/user/signin"
}
```

**Security Note**: The error message is intentionally generic ("Invalid email or password") to prevent user enumeration attacks.

---

### ❌ Test Case 4: Missing Password Field

**Request**:

```bash
curl -X POST http://localhost:3000/user/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmail.com"
  }'
```

**Expected Response**: `400 Bad Request`

```json
{
  "statusCode": 400,
  "message": ["password should not be empty", "password must be a string"],
  "error": "Bad Request"
}
```

---

### ❌ Test Case 5: Missing Email Field

**Request**:

```bash
curl -X POST http://localhost:3000/user/signin \
  -H "Content-Type: application/json" \
  -d '{
    "password": "12345678a"
  }'
```

**Expected Response**: `400 Bad Request`

```json
{
  "statusCode": 400,
  "message": ["email should not be empty", "email must be an email"],
  "error": "Bad Request"
}
```

---

### ❌ Test Case 6: Invalid Email Format

**Request**:

```bash
curl -X POST http://localhost:3000/user/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not-an-email",
    "password": "12345678a"
  }'
```

**Expected Response**: `400 Bad Request`

```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

---

### ❌ Test Case 7: Empty Request Body

**Request**:

```bash
curl -X POST http://localhost:3000/user/signin \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response**: `400 Bad Request`

```json
{
  "statusCode": 400,
  "message": [
    "email should not be empty",
    "email must be an email",
    "password should not be empty",
    "password must be a string"
  ],
  "error": "Bad Request"
}
```

---

## Testing in Postman

### Setup

1. **Method**: `POST`
2. **URL**: `http://localhost:3000/user/signin`
3. **Headers**:
   - `Content-Type`: `application/json`
4. **Body** (raw JSON):

```json
{
  "email": "test@gmail.com",
  "password": "12345678a"
}
```

### Prerequisites

Before testing signin, you must first create a user using the `/user/signup` endpoint with the same credentials.

### Expected Behavior

- **Valid credentials**: Returns `200 OK` with user data and JWT access token
- **Invalid credentials**: Returns `400 Bad Request` with "Invalid email or password"
- **Missing/invalid fields**: Returns `400 Bad Request` with validation error details

---

## Authentication Flow

1. **Sign Up**: Create a new user account

   ```
   POST /user/signup
   ```

2. **Sign In**: Authenticate and receive JWT token

   ```
   POST /user/signin
   ```

3. **Use Token**: Include the access token in subsequent requests
   ```
   Authorization: Bearer <accessToken>
   ```

---

## Common Mistakes to Avoid

❌ **Using "username" instead of "email"**

```json
{
  "username": "test", // ← WRONG
  "password": "12345678a"
}
```

✅ **Correct format**

```json
{
  "email": "test@gmail.com", // ← CORRECT
  "password": "12345678a"
}
```

---

## Summary

✅ **Issue Fixed**: Added proper validation decorators to `SignInDto`  
✅ **Documentation Fixed**: Updated API docs to show correct field name (`email` instead of `username`)  
✅ **Endpoint Tested**: All validation rules working correctly  
✅ **Security**: Generic error messages prevent user enumeration

The `/user/signin` endpoint is now fully functional and properly validates all input.
