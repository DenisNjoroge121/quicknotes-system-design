# QuickNotes System Design

QuickNotes System Design is a learning project that demonstrates how a browser client communicates with a REST API and documents a proposed backend capable of serving one million registered users.

## Project contents

- `index.html` — accessible HTML5 interface for loading, creating, and deleting notes.
- `api.js` — reusable `fetch` helper, GET/POST/DELETE requests, validation, request states, and error handling.
- `style.css` — responsive layout and distinct success/error status styles.
- `docs/api-design.md` — proposed production REST API endpoints, examples, and error conventions.
- `docs/data-model.md` — SQL entities, relationships, DDL, indexes, and sample queries.
- `docs/architecture.md` — requirements, scale estimates, architecture diagram, request flows, and trade-offs.

## How to run the API client

1. Download or clone this repository.
2. Open `index.html` in a modern browser. If your browser restricts local files, use VS Code's Live Server extension or run a simple local static server.
3. Click **Load notes** to fetch up to 10 posts from `https://jsonplaceholder.typicode.com/posts?_limit=10`.
4. Use the form to create a note or click **Delete** on a note.
5. An internet connection is required because the practice API is hosted remotely.

### Important demo limitation

JSONPlaceholder is a mock API. Its POST response simulates a created post and its DELETE response simulates deletion; neither operation permanently changes the remote dataset. The client inserts a created note into the current page and removes a deleted note from the current page so the UI demonstrates the expected flow. Reloading notes may not preserve those changes. The design documents describe a real API and database that would persist user data.

## Design documents

- [API design](docs/api-design.md)
- [Data model](docs/data-model.md)
- [Architecture and scaling](docs/architecture.md)

## What I learned

1. How to use asynchronous `fetch` requests with GET, POST, and DELETE, including checking HTTP response status and handling errors.
2. Why forms need input validation, accessible status feedback, and disabled buttons while requests are running.
3. How REST endpoints, HTTP status codes, JSON request/response bodies, and consistent error formats fit together.
4. How primary keys, foreign keys, indexes, and junction tables represent one-to-many and many-to-many relationships.
5. How caching, load balancing, read replicas, queues, workers, and redundancy address scale and reliability—and what trade-offs they introduce.

## Suggested Git history

Make each commit after implementing and checking the corresponding part. Example sequence:

1. `Add HTML structure and responsive styles`
2. `Add API client with GET`
3. `Add create note with POST`
4. `Add delete with DELETE`
5. `Add API design doc`
6. `Add data model doc`
7. `Add architecture doc`
8. `Add README`

Do not create empty commits just to reach the required count; each commit should contain a meaningful change.

## License

This project is provided for educational use. Add a license file if your course or team requires a specific license.
