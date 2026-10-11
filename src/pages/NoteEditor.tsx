import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, message } from "../api";
import { useAuth } from "../auth";
import { canManage, type Note, type User } from "../types";
import { useResource } from "../useResource";
import { ErrorMessage, Loading, ResourceError } from "../components/Feedback";
export default function NoteEditor() {
  const { id } = useParams();
  const { user: current } = useAuth();
  const navigate = useNavigate();
  const users = useResource<User[]>("/users/assignees");
  const note = useResource<Note | { user: User }>(
    id ? `/notes/${id}` : "/auth/session",
  );
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [user, setUser] = useState(current?._id || "");
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    if (id && note.data && "title" in note.data) {
      setTitle(note.data.title);
      setText(note.data.text);
      setUser(note.data.user);
      setCompleted(note.data.completed);
    }
  }, [id, note.data]);
  if (users.loading || note.loading) return <Loading />;
  if (users.error || note.error)
    return (
      <ResourceError
        message={users.error || note.error}
        retry={() => {
          users.reload();
          note.reload();
        }}
      />
    );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(id ? `/notes/${id}` : "/notes", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify({ user, title, text, completed }),
      });
      navigate("/dash/notes");
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setError("");
    try {
      await api(`/notes/${id}`, { method: "DELETE" });
      navigate("/dash/notes");
    } catch (error) {
      setError(message(error));
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  }
  const assignees = canManage(current)
    ? users.data
    : users.data?.filter((user) => user._id === current?._id);
  return (
    <>
      <Link className="back-link" to="/dash/notes">
        ← Service notes
      </Link>
      <p className="eyebrow">
        {id && note.data && "ticket" in note.data
          ? `TICKET #${note.data.ticket}`
          : "A NEW ASSIGNMENT"}
      </p>
      <h1>{id ? "Edit service note" : "New service note"}</h1>
      <form className="editor" onSubmit={submit}>
        <ErrorMessage>{error}</ErrorMessage>
        <fieldset disabled={busy}>
          <label>
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
            />
          </label>
          <label>
            Description
            <textarea
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              maxLength={10000}
            />
          </label>
          <label>
            Assigned to
            <select
              required
              value={user}
              onChange={(e) => setUser(e.target.value)}
            >
              <option value="">Choose a team member</option>
              {assignees?.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.username}
                </option>
              ))}
            </select>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
            />
            Completed
          </label>
          <div className="form-actions">
            <button type="submit">{busy ? "Saving…" : "Save note"}</button>
            <Link className="button secondary" to="/dash/notes">
              Cancel
            </Link>
            {id && canManage(current) && (
              <button
                className="danger"
                type="button"
                onClick={() => setConfirmDelete(true)}
              >
                Delete note
              </button>
            )}
          </div>
          {confirmDelete && (
            <div className="confirmation" role="alert">
              <p>Delete this note permanently?</p>
              <button
                className="danger"
                type="button"
                onClick={() => void remove()}
              >
                Confirm delete
              </button>
              <button
                className="secondary"
                type="button"
                onClick={() => setConfirmDelete(false)}
              >
                Keep note
              </button>
            </div>
          )}
        </fieldset>
      </form>
    </>
  );
}
