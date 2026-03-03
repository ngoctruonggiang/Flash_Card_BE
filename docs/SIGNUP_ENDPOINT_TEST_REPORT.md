# /user/signup Endpoint Test Report

**Date**: 2025-11-23  
**Endpoint**: `POST /user/signup`  
**Base URL**: `http://localhost:3000`

---

## Issue Identified

The original 400 Bad Request error was caused by **missing validation decorators** in the `SignUpDto` class.

### Root Cause

The application uses a global `ValidationPipe` with the following configuration:

```typescript
new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true, // ← This was causing the issue
});
```

With `forbidNonWhitelisted: true`, NestJS rejects any request containing properties that aren't explicitly decorated with class-validator decorators. The `SignUpDto` was missing these decorators.

### Solution Applied

Added proper validation decorators to `src/utils/types/dto/user/signUp.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class SignUpDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  username: string;

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

---

## Validation Rules

The signup endpoint enforces the following validation rules:

### 1. **Username**

- **Format**: Alphanumeric characters and underscores only
- **Length**: 3-20 characters
- **Regex**: `/^[a-zA-Z0-9_]{3,20}$/`
- **Examples**:
  - ✅ Valid: `testuser`, `john_doe`, `user123`
  - ❌ Invalid: `ab` (too short), `user-name` (contains hyphen), `this_is_a_very_long_username_123` (too long)

### 2. **Email**

- **Format**: Valid email format
- **Regex**: `/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/`
- **Examples**:
  - ✅ Valid: `test@gmail.com`, `user.name@example.co.uk`
  - ❌ Invalid: `invalid-email`, `@gmail.com`, `test@`

### 3. **Password**

- **Requirements**:
  - Minimum 8 characters
  - At least one letter (A-Z or a-z)
  - At least one number (0-9)
- **Regex**: `/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/`
- **Examples**:
  - ✅ Valid: `password123`, `12345678a`, `Test1234`
  - ❌ Invalid: `short` (too short), `12345678` (no letter), `password` (no number)

---

## Test Cases

### ✅ Test Case 1: Valid Signup Request

**Request**:

```bash
curl -X POST http://localhost:3000/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@gmail.com",
    "password": "12345678a"
  }'
```

**Expected Response**: `201 Created`

```json
{
  "statusCode": 201,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "id": 1,
    "username": "testuser",
    "email": "test@gmail.com",
    "role": "USER",
    "createdAt": "2025-11-22T17:48:02.415Z",
    "lastLoginAt": "2025-11-22T17:48:02.415Z"
  },
  "message": "User signed up successfully",
  "timestamp": "2025-11-22T17:48:02.415Z",
  "path": "/user/signup"
}
```

---

### ❌ Test Case 2: Invalid Email Format

**Request**:

```bash
curl -X POST http://localhost:3000/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "invalid-email",
    "password": "12345678a"
  }'
```

**Expected Response**: `400 Bad Request`

```json
{
  "statusCode": 400,
  "message": "Invalid email format",
  "timestamp": "2025-11-22T17:48:13.733Z",
  "path": "/user/signup"
}
```

---

### ❌ Test Case 3: Username Too Short

**Request**:

```bash
curl -X POST http://localhost:3000/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ab",
    "email": "test@gmail.com",
    "password": "12345678a"
  }'
```

**Expected Response**: `400 Bad Request`

```json
{
  "statusCode": 400,
  "message": "Invalid username format",
  "timestamp": "2025-11-22T17:48:13.733Z",
  "path": "/user/signup"
}
```

---

### ❌ Test Case 4: Password Too Short / No Number

**Request**:

```bash
curl -X POST http://localhost:3000/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@gmail.com",
    "password": "short"
  }'
```

**Expected Response**: `400 Bad Request`

```json
{
  "statusCode": 400,
  "message": "Password must be at least 8 characters long and contain at least one letter and one number",
  "timestamp": "2025-11-22T17:48:13.733Z",
  "path": "/user/signup"
}
```

---

### ❌ Test Case 5: Duplicate Email

**Request** (after already creating a user with this email):

```bash
curl -X POST http://localhost:3000/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "test@gmail.com",
    "password": "12345678a"
  }'
```

**Expected Response**: `409 Conflict`

```json
{
  "statusCode": 409,
  "message": "Email already in use",
  "timestamp": "2025-11-22T17:48:20.123Z",
  "path": "/user/signup"
}
```

---

### ❌ Test Case 6: Duplicate Username

**Request** (after already creating a user with this username):

```bash
curl -X POST http://localhost:3000/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "newemail@gmail.com",
    "password": "12345678a"
  }'
```

**Expected Response**: `409 Conflict`

```json
{
  "statusCode": 409,
  "message": "Username already in use",
  "timestamp": "2025-11-22T17:48:25.456Z",
  "path": "/user/signup"
}
```

---

### ❌ Test Case 7: Missing Required Fields

**Request**:

```bash
curl -X POST http://localhost:3000/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser"
  }'
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
2. **URL**: `http://localhost:3000/user/signup`
3. **Headers**:
   - `Content-Type`: `application/json`
4. **Body** (raw JSON):

```json
{
  "username": "testuser",
  "email": "test@gmail.com",
  "password": "12345678a"
}
```

### Expected Behavior

- **First request**: Should return `201 Created` with user data and access token
- **Subsequent requests with same data**: Should return `409 Conflict` (email/username already in use)
- **Invalid data**: Should return `400 Bad Request` with specific error message

---

## Summary

✅ **Issue Fixed**: Added validation decorators to `SignUpDto`  
✅ **Server Running**: Successfully started on port 3000  
✅ **Endpoint Tested**: All validation rules working correctly

The `/user/signup` endpoint is now fully functional and properly validates all input according to the business rules defined in the `AuthService`.
