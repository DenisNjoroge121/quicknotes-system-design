# QuickNotes Data Model

## Database choice

Use a relational SQL database such as PostgreSQL. Users, notes, and tags have clear relationships and need referential integrity; transactions make note and tag updates reliable. SQL joins support tag filtering and reporting. A document database could be useful for a different access pattern, but it would duplicate tag data or make many-to-many consistency harder to enforce. Add caching only for measured hot reads; the database remains the source of truth.

## Entities and relationships

- **users**: one user can own many notes and create many tags (one-to-many).
- **notes**: each note belongs to one user; a note may have many tags.
- **tags**: each tag belongs to one user, avoiding global tag ownership confusion.
- **note_tags**: junction table joining notes and tags. Notes and tags have a many-to-many relationship. A composite primary key prevents attaching the same tag twice to one note.

All IDs below use PostgreSQL types. `BIGINT GENERATED ... AS IDENTITY` creates numeric IDs; timestamps are stored with time zone.

## CREATE TABLE statements

```sql
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tags (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tags_user_name UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
    note_id BIGINT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (note_id, tag_id)
);
```

## Indexes

```sql
-- Speeds up a user's notes feed, ordered newest first.
CREATE INDEX idx_notes_user_created
    ON notes (user_id, created_at DESC, id DESC);

-- Speeds up reverse lookups: which notes use a particular tag?
CREATE INDEX idx_note_tags_tag
    ON note_tags (tag_id, note_id);
```

The unique indexes created by the primary keys and constraints already help common lookups. Additional indexes should be driven by query plans and production metrics because indexes consume storage and slow writes.

## Example queries

### 1. List the latest notes for one user

```sql
SELECT id, title, body, created_at, updated_at
FROM notes
WHERE user_id = 42
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

### 2. JOIN notes to their tags

```sql
SELECT n.id, n.title, t.name AS tag
FROM notes AS n
JOIN note_tags AS nt ON nt.note_id = n.id
JOIN tags AS t ON t.id = nt.tag_id
WHERE n.user_id = 42
ORDER BY n.created_at DESC, t.name;
```

### 3. Create a note

```sql
INSERT INTO notes (user_id, title, body)
VALUES (42, 'Plan project', 'Write API and data model documents.')
RETURNING id, title, body, created_at;
```

### 4. Count notes per user

```sql
SELECT u.id, u.email, COUNT(n.id) AS note_count
FROM users AS u
LEFT JOIN notes AS n ON n.user_id = u.id
GROUP BY u.id, u.email
ORDER BY note_count DESC;
```

## Data integrity and implementation notes

- Store password hashes produced by a modern password-hashing algorithm; never store plaintext passwords.
- Use a transaction when creating a note and attaching multiple tags so the operation succeeds or rolls back as one unit.
- Enforce ownership in application queries as well as foreign keys; a valid note ID alone does not grant access.
- Consider soft deletion only if product requirements need recovery or audit history; the schema above uses cascading hard deletes for simplicity.
- Use migrations to version schema changes and test them before production deployment.
