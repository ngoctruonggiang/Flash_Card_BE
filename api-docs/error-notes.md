# **Errors & Notes**

## **Error Responses**

All endpoints may return error responses in the following format:

**400 Bad Request:**

```json
{
  "statusCode": 400,
  "message": ["Validation error messages"],
  "error": "Bad Request"
}
```

**401 Unauthorized:**

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "data": null
}
```

**404 Not Found:**

```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "data": null
}
```

**500 Internal Server Error:**

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "data": null,
  "timestamp": "2025-11-23T13:44:29.189Z",
  "path": "/api/endpoint"
}
```

## **General Notes**

1. **Authentication**: Store the accessToken received from login/register and include it in the Authorization header for all authenticated requests.
2. **Timestamps**: All timestamps are in ISO 8601 format (UTC).
3. **IDs**: All IDs are integers.
4. **Cascading Deletes**: Some delete operations may fail with a 500 error if there are related records. This is a known issue with the current implementation.
5. **Spaced Repetition**: The study system uses the SM-2 algorithm for spaced repetition learning.

```

```
