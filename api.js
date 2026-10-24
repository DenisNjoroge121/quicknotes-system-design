const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.getElementById("load-btn");
const noteForm = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const submitButton = document.getElementById("submit-btn");
const statusElement = document.getElementById("status");
const notesList = document.getElementById("notes-list");

function setStatus(message, type = "") {
  statusElement.textContent = message;
  statusElement.className = type ? `status ${type}` : "status";
}

function setBusy(button, busy, busyLabel, normalLabel) {
  button.disabled = busy;
  button.textContent = busy ? busyLabel : normalLabel;
}

function showEmptyState() {
  if (notesList.children.length === 0) {
    const item = document.createElement("li");
    item.className = "empty-state";
    item.textContent = "No notes to display yet. Load notes or create one.";
    notesList.appendChild(item);
  }
}

function renderNote(note, prepend = false) {
  const emptyState = notesList.querySelector(".empty-state");
  if (emptyState) emptyState.remove();

  const item = document.createElement("li");
  item.className = "note-card";
  item.dataset.noteId = String(note.id);

  const heading = document.createElement("h3");
  heading.textContent = note.title || "(Untitled note)";

  const body = document.createElement("p");
  body.textContent = note.body || "No body provided.";

  const meta = document.createElement("small");
  meta.textContent = `Note ID: ${note.id}`;

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-btn";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => deleteNote(note.id, deleteButton));

  item.append(heading, body, meta, deleteButton);
  if (prepend) notesList.prepend(item);
  else notesList.appendChild(item);
}

// Reusable request helper: every request checks HTTP status and parses JSON when present.
async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json; charset=UTF-8" } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}. Please try again.`);
  }

  // DELETE endpoints may return an empty response body.
  if (response.status === 204) {
    return { data: null, status: response.status };
  }

  const data = await response.json();
  return { data, status: response.status };
}

async function loadNotes() {
  setBusy(loadButton, true, "Loading...", "Load notes");
  setStatus("Loading notes...");
  notesList.replaceChildren();

  try {
    const { data: notes } = await request(`${API_URL}?_limit=10`);
    if (!Array.isArray(notes) || notes.length === 0) {
      showEmptyState();
      setStatus("No notes were returned by the server.", "success");
      return;
    }

    notes.forEach(note => renderNote(note));
    setStatus(`Loaded ${notes.length} notes from the server.`, "success");
  } catch (error) {
    showEmptyState();
    setStatus(error.message || "We couldn't load notes. Check your connection and try again.", "error");
  } finally {
    setBusy(loadButton, false, "Loading...", "Load notes");
  }
}

async function createNote(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title) {
    setStatus("Please enter a title before creating a note.", "error");
    titleInput.focus();
    return;
  }
  if (title.length > 100) {
    setStatus("The title must be 100 characters or fewer.", "error");
    titleInput.focus();
    return;
  }

  setBusy(submitButton, true, "Creating...", "Create note");
  setStatus("Creating note...");

  try {
    const { data: note, status } = await request(API_URL, {
      method: "POST",
      body: JSON.stringify({ title, body, userId: 1 })
    });

    // JSONPlaceholder returns a simulated new ID but does not persist the post.
    // We display the returned note locally; reloading the page will not retain it.
    renderNote(note, true);
    noteForm.reset();
    setStatus(`Note created (status ${status}, id ${note.id}).`, "success");
  } catch (error) {
    setStatus(error.message || "We couldn't create the note. Please try again.", "error");
  } finally {
    setBusy(submitButton, false, "Creating...", "Create note");
  }
}

async function deleteNote(noteId, button) {
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = "Deleting...";
  setStatus(`Deleting note ${noteId}...`);

  try {
    await request(`${API_URL}/${encodeURIComponent(noteId)}`, { method: "DELETE" });
    const item = notesList.querySelector(`[data-note-id="${CSS.escape(String(noteId))}"]`);
    if (item) item.remove();

    // JSONPlaceholder simulates deletion. Removing the item here updates only this page's view.
    showEmptyState();
    setStatus(`Note ${noteId} deleted from this view. JSONPlaceholder does not persist deletions.`, "success");
  } catch (error) {
    setStatus(error.message || "We couldn't delete the note. Please try again.", "error");
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

loadButton.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);
