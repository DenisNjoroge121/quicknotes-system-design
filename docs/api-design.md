# QuickNotes REST API Design

## Overview

This document describes the proposed production QuickNotes API, not the JSONPlaceholder practice service. The API uses JSON over HTTPS, plural resource names, consistent status codes, and authenticated ownership checks. Base URL: `https://api.quicknotes.example/v1`.

## Endpoints

| Method | Path | Description | Success status |
|---|---|---|---|
| POST | `/auth/register` | Create a user account | `201 Created` |
| POST | `/auth/login` | Authenticate and issue access/refresh tokens | `200 OK` |
| GET | `/notes` | List the authenticated user's notes; supports `page`, `limit`, `tag`, and `q` | `200 OK` |
| POST | `/notes` | Create a note owned by the authenticated user | `201 Created` |
| GET | `/notes/{noteId}` | Retrieve one note the user owns | `200 OK` |
| PATCH | `/notes/{noteId}` | Update selected note fields | `200 OK` |
| DELETE | `/notes/{noteId}` | Delete a note the user owns | `204 No Content` |
| GET | `/tags` | List the user's tags | `200 OK` |
| POST | `/notes/{noteId}/tags` | Attach an existing tag to a note | `201 Created` |

All `/notes` and `/tags` endpoints require authentication. The server must derive the user identity from the verified token rather than trusting a `userId` supplied by the client.

## Create a note

Request:

```http
POST /v1/notes
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{
  "title": "Study REST APIs",
  "body": "Review HTTP methods and status codes.",
  "tagIds": [2, 4]
}
```

Response (`201 Created`):

```json
{
  "id": "note_01JABC123",
  "title": "Study REST APIs",
  "body": "Review HTTP methods and status codes.",
  "createdAt": "2026-10-24T12:00:00Z",
  "updatedAt": "2026-10-24T12:00:00Z",
  "tags": [
    {"id": 2, "name": "school"},
    {"id": 4, "name": "backend"}
  ]
}
```

The response should include a `Location: /v1/notes/note_01JABC123` header.

## List notes

Request:

```http
GET /v1/notes?page=1&limit=20
Authorization: Bearer <access-token>
```

Response (`200 OK`):

```json
{
  "data": [
    {
      "id": "note_01JABC123",
      "title": "Study REST APIs",
      "body": "Review HTTP methods and status codes.",
      "createdAt": "2026-10-24T12:00:00Z",
      "updatedAt": "2026-10-24T12:00:00Z",
      "tags": [{"id": 4, "name": "backend"}]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

Use stable ordering, such as `created_at DESC, id DESC`, so pagination is predictable. Enforce a maximum page size.

## Error responses

| Status | Meaning | Example situation |
|---|---|---|
| `400 Bad Request` | Invalid input or malformed JSON | Missing title or title over 100 characters |
| `401 Unauthorized` | Missing, invalid, or expired credentials | No bearer token |
| `403 Forbidden` | Authenticated user lacks permission | Attempt to use an admin-only operation |
| `404 Not Found` | Resource does not exist or is not visible to this user | Unknown note ID |
| `409 Conflict` | Request conflicts with current state | Duplicate unique tag name |
| `422 Unprocessable Content` | Well-formed request fails field validation (if used consistently by the API) | Unsupported field value |
| `429 Too Many Requests` | Rate limit exceeded | Too many requests in a short window |
| `500 Internal Server Error` | Unexpected server failure | Unhandled application error |
| `503 Service Unavailable` | Service temporarily unavailable | Database failover in progress |

Example error body (`400 Bad Request`):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": [
      {"field": "title", "message": "Title is required and must be 100 characters or fewer."}
    ],
    "requestId": "req_7f91c2"
  }
}
```

Do not expose stack traces, database details, secrets, or internal infrastructure names in client-facing errors. Include a request ID for troubleshooting.

## API conventions and security

- Require HTTPS and bearer-token authentication for private resources.
- Validate and normalize all input on the server; client-side validation is only a usability aid.
- Return `204 No Content` for a successful delete.
- Use pagination and bounded query limits; never return every note in one response.
- Apply per-user authorization to every note and tag operation to prevent insecure direct object references.
- Rate-limit authentication and write endpoints, and log request IDs without logging passwords or access tokens.
- Use UTC ISO-8601 timestamps and a consistent JSON error shape.
