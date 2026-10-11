import { useState } from "react";
import { Link } from "react-router-dom";
import { useResource } from "../useResource";
import type { Note, User } from "../types";
import { Loading, ResourceError } from "../components/Feedback";
export default function Notes() {
  const notes = useResource<Note[]>("/notes");
  const users = useResource<User[]>("/users/assignees");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  if (notes.loading || users.loading) return <Loading />;
  if (notes.error || users.error)
    return (
      <ResourceError
        message={notes.error || users.error}
        retry={() => {
          notes.reload();
          users.reload();
        }}
      />
    );
  const staff = new Map(users.data?.map((user) => [user._id, user.username]));
  const visible =
    notes.data?.filter(
      (note) =>
        (status === "all" || note.completed === (status === "completed")) &&
        `${note.title} ${note.text} ${note.ticket} ${staff.get(note.user) || ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    ) || [];
  const open = notes.data?.filter((note) => !note.completed).length || 0;
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE WORK QUEUE</p>
          <h1>Service notes</h1>
          <p className="muted">
            {open} open · {(notes.data?.length || 0) - open} completed
          </p>
        </div>
        <Link className="button" to="/dash/notes/new">
          New note
        </Link>
      </div>
      <div className="filters">
        <label>
          Search notes
          <input
            type="search"
            placeholder="Title, ticket or team member"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All notes</option>
            <option value="open">Open</option>
            <option value="completed">Completed</option>
          </select>
        </label>
      </div>
      {visible.length ? (
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Service notes</caption>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Service note</th>
                <th>Assigned to</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((note) => (
                <tr key={note._id}>
                  <td className="ticket">#{note.ticket}</td>
                  <td>
                    <strong>{note.title}</strong>
                    <span className="table-detail">
                      Updated {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td>{staff.get(note.user) || "Inactive staff"}</td>
                  <td>
                    <span
                      className={`badge ${note.completed ? "complete" : "open"}`}
                    >
                      {note.completed ? "Completed" : "Open"}
                    </span>
                  </td>
                  <td>
                    <Link
                      className="table-link"
                      aria-label={`Edit note ${note.ticket}`}
                      to={`/dash/notes/${note._id}`}
                    >
                      Edit ↗
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <h2>
            {notes.data?.length ? "No matching notes" : "Your queue is clear"}
          </h2>
          <p>
            {notes.data?.length
              ? "Try another search or status filter."
              : "Create a service note to get started."}
          </p>
        </div>
      )}
    </>
  );
}
