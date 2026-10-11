import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, message } from "../api";
import { useAuth } from "../auth";
import { useResource } from "../useResource";
import type { Role, User } from "../types";
import { ErrorMessage, Loading, ResourceError } from "../components/Feedback";
export default function UserEditor() {
  const { id } = useParams();
  const { user: current, refresh } = useAuth();
  const navigate = useNavigate();
  const users = useResource<User[]>("/users");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState<Role[]>(["Employee"]);
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const original = users.data?.find((user) => user._id === id);
  useEffect(() => {
    if (original) {
      setUsername(original.username);
      setRoles(original.roles);
      setActive(original.active);
    }
  }, [original]);
  if (users.loading) return <Loading />;
  if (users.error)
    return <ResourceError message={users.error} retry={users.reload} />;
  if (id && !original)
    return (
      <>
        <h1>User not found</h1>
        <Link to="/dash/users">Back to team members</Link>
      </>
    );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!roles.length) {
      setError("Choose at least one role.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await api(id ? `/users/${id}` : "/users", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify({ username, password, roles, active }),
      });
      if (id === current?._id) await refresh();
      navigate("/dash/users");
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
      await api(`/users/${id}`, { method: "DELETE" });
      navigate("/dash/users");
    } catch (error) {
      setError(message(error));
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  }
  const restrictedAdmin =
    original?.roles.includes("Admin") && !current?.roles.includes("Admin");
  return (
    <>
      <Link className="back-link" to="/dash/users">
        ← Team members
      </Link>
      <p className="eyebrow">STAFF ACCOUNT</p>
      <h1>{id ? "Edit team member" : "New team member"}</h1>
      {restrictedAdmin ? (
        <p className="error" role="alert">
          Only an Admin may change this account.
        </p>
      ) : (
        <form className="editor" onSubmit={submit}>
          <ErrorMessage>{error}</ErrorMessage>
          <fieldset disabled={busy}>
            <label>
              Username
              <input
                autoComplete="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_-]{3,30}"
              />
            </label>
            <label>
              {id ? "New password (optional)" : "Password"}
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!id}
                minLength={8}
                maxLength={72}
              />
            </label>
            <p className="field-help">
              Passwords need at least 8 characters. Leave blank when editing to
              keep the current password.
            </p>
            <fieldset className="role-options">
              <legend>Roles</legend>
              {(["Employee", "Manager", "Admin"] as Role[])
                .filter(
                  (role) =>
                    role !== "Admin" || current?.roles.includes("Admin"),
                )
                .map((role) => (
                  <label className="check" key={role}>
                    <input
                      type="checkbox"
                      checked={roles.includes(role)}
                      onChange={(e) =>
                        setRoles(
                          e.target.checked
                            ? [...roles, role]
                            : roles.filter((value) => value !== role),
                        )
                      }
                    />
                    {role}
                  </label>
                ))}
            </fieldset>
            {id && (
              <label className="check">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                Active account
              </label>
            )}
            <div className="form-actions">
              <button type="submit">{busy ? "Saving…" : "Save user"}</button>
              <Link className="button secondary" to="/dash/users">
                Cancel
              </Link>
              {id && id !== current?._id && (
                <button
                  type="button"
                  className="danger"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete user
                </button>
              )}
            </div>
            {confirmDelete && (
              <div className="confirmation" role="alert">
                <p>Delete this account permanently?</p>
                <button
                  type="button"
                  className="danger"
                  onClick={() => void remove()}
                >
                  Confirm delete
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setConfirmDelete(false)}
                >
                  Keep user
                </button>
              </div>
            )}
          </fieldset>
        </form>
      )}
    </>
  );
}
