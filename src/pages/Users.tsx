import { Link } from "react-router-dom";
import { useResource } from "../useResource";
import type { User } from "../types";
import { Loading, ResourceError } from "../components/Feedback";
export default function Users() {
  const users = useResource<User[]>("/users");
  if (users.loading) return <Loading />;
  if (users.error)
    return <ResourceError message={users.error} retry={users.reload} />;
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE PEOPLE BEHIND THE WORK</p>
          <h1>Team members</h1>
          <p className="muted">Manage accounts and staff access.</p>
        </div>
        <Link className="button" to="/dash/users/new">
          New user
        </Link>
      </div>
      <div className="table-wrap">
        <table>
          <caption className="sr-only">Team members</caption>
          <thead>
            <tr>
              <th>Username</th>
              <th>Roles</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.data?.map((user) => (
              <tr key={user._id}>
                <td>
                  <strong>{user.username}</strong>
                </td>
                <td>{user.roles.join(", ")}</td>
                <td>
                  <span
                    className={`badge ${user.active ? "complete" : "inactive"}`}
                  >
                    {user.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <Link
                    className="table-link"
                    aria-label={`Edit user ${user.username}`}
                    to={`/dash/users/${user._id}`}
                  >
                    Edit ↗
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!users.data?.length && <p className="empty">No team members found.</p>}
    </>
  );
}
