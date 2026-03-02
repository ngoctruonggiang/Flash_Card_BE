# FlashLearn API Documentation

This document provides a comprehensive reference for the FlashLearn API. The API allows you to manage users, decks, and flashcards.

## Base URL

All API requests should be made to the base URL configured for the environment (e.g., `http://localhost:3000`). In this documentation, `{{url}}` refers to the base URL.

## Authentication

The API uses **Bearer Token** authentication.
Most endpoints require a valid JWT token in the `Authorization` header.

**Header Format:**

```
Authorization: Bearer <your_token>
```

---

## 1. User Endpoints

Manage user accounts, authentication, and administrative tasks.

### 1.1 Sign Up

Register a new user.

- **URL**: `/user/signup`
- **Method**: `POST`
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

- `username` (string, required): Unique username for the user
- `email` (string, required): Valid email address
- `password` (string, required): User's password
- `confirmPassword` (string, required): Must match the `password` field exactly

**Validation:**

- The `confirmPassword` field must match the `password` field, or the request will fail with a validation error.

### 1.2 Sign In

Authenticate a user and retrieve a JWT token.

- **URL**: `/user/signin`
- **Method**: `POST`
- **Auth Required**: No

**Request Body (JSON):**

```json
{
  "email": "test@gmail.com",
  "password": "12345678a"
}
```

### 1.3 Get Current User

Retrieve details of the currently authenticated user.

- **URL**: `/user`
- **Method**: `GET`
- **Auth Required**: Yes

### 1.4 Update Current User

Update the currently authenticated user's information. You can update one or more fields at a time.

- **URL**: `/user`
- **Method**: `PATCH`
- **Auth Required**: Yes

**Available Fields** (all optional):

- `username`: string - Update username
- `email`: string - Update email address
- `password`: string - Update password
- `role`: string - Update user role (typically admin-only)

**Request Body Examples:**

Update password only:

```json
{
  "password": "newPassword123"
}
```

Update email only:

```json
{
  "email": "newemail@example.com"
}
```

Update username only:

```json
{
  "username": "newusername"
}
```

Update multiple fields at once:

```json
{
  "username": "newusername",
  "email": "newemail@example.com",
  "password": "newPassword123"
}
```

### 1.5 Delete Current User

Delete the currently authenticated user's account.

- **URL**: `/user`
- **Method**: `DELETE`
- **Auth Required**: Yes

### 1.6 Get User By ID (Admin)

Retrieve details of a specific user by their ID. Requires Admin privileges.

- **URL**: `/user/:id`
- **Method**: `GET`
- **Auth Required**: Yes (Admin)

### 1.7 Get All Users (Admin)

Retrieve a list of all users. Requires Admin privileges.

- **URL**: `/user/all`
- **Method**: `GET`
- **Auth Required**: Yes (Admin)

### 1.8 Admin Update User

Update a specific user's details (e.g., role). Requires Admin privileges.

- **URL**: `/user/:id`
- **Method**: `PATCH`
- **Auth Required**: Yes (Admin)

**Request Body (JSON):**

```json
{
  "role": "ADMIN"
}
```

### 1.9 Admin Delete User

Delete a specific user by their ID. Requires Admin privileges.

- **URL**: `/user/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (Admin)

---

## 2. Deck Endpoints

Manage collections of flashcards (decks).

### 2.1 Create Deck

Create a new deck.

- **URL**: `/deck`
- **Method**: `POST`
- **Auth Required**: Yes

**Request Body (JSON):**

```json
{
  "title": "Basic Math",
  "description": "Simple arithmetic flashcards"
}
```

### 2.2 Get All Decks For Current User

Retrieve all decks belonging to the authenticated user.

- **URL**: `/deck`
- **Method**: `GET`
- **Auth Required**: Yes

### 2.3 Find Decks (Admin/Filter)

Find decks, optionally filtering by user ID.

- **URL**: `/deck/by`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:
  - `userId`: (Optional) ID of the user to filter decks by.

**Example URL:**
`{{url}}/deck/by?userId=1`

### 2.4 Get Deck By ID

Retrieve a specific deck by its ID.

- **URL**: `/deck/:id`
- **Method**: `GET`
- **Auth Required**: Yes

### 2.5 Update Deck

Update a deck's details.

- **URL**: `/deck/:id`
- **Method**: `PATCH`
- **Auth Required**: Yes

**Request Body (JSON):**

```json
{
  "title": "Updated title"
}
```

### 2.6 Delete Deck

Delete a specific deck.

- **URL**: `/deck/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes

---

## 3. Card Endpoints

Manage individual flashcards within decks.

### 3.1 Create Card

Add a new card to a deck.

- **URL**: `/card`
- **Method**: `POST`
- **Auth Required**: Yes

**Request Body (JSON):**

```json
{
  "deckId": 1,
  "front": "What is 2+2?",
  "back": "4",
  "tags": "math,basics"
}
```

### 3.2 Get Cards

Retrieve cards, optionally filtered by deck ID.

- **URL**: `/card`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:
  - `deckId`: (Optional) ID of the deck to retrieve cards from.

**Example URL:**
`{{url}}/card?deckId=1`

### 3.3 Get Card By ID

Retrieve a specific card by its ID.

- **URL**: `/card/:id`
- **Method**: `GET`
- **Auth Required**: Yes

### 3.4 Update Card

Update a card's content.

- **URL**: `/card/:id`
- **Method**: `PATCH`
- **Auth Required**: Yes

**Request Body (JSON):**

```json
{
  "front": "New front text"
}
```

### 3.5 Delete Card

Delete a specific card.

- **URL**: `/card/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes
