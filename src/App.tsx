import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useState } from "react";
import { useAuth } from "./auth";
import { canManage } from "./types";
import { message } from "./api";
import { Loading, ResourceError, ErrorMessage } from "./components/Feedback";
import Login from "./pages/Login";
import Notes from "./pages/Notes";
import NoteEditor from "./pages/NoteEditor";
import Users from "./pages/Users";
import UserEditor from "./pages/UserEditor";
function Home() {
  return (
    <main id="main" className="landing">
      <header className="public-header">
        <Link className="brand" to="/">
          tech<span>Notes</span>
          <small>service desk</small>
        </Link>
        <Link className="button secondary" to="/login">
          Staff sign in
        </Link>
      </header>
      <section className="hero">
        <p className="eyebrow">THE WORK BEHIND EVERY REPAIR</p>
        <h1>
          Keep every
          <br />
          service moving.
        </h1>
        <p className="hero-copy">
          One place for your team’s notes, assignments and completed work. From
          the first inspection to the final check.
        </p>
        <Link className="button" to="/login">
          Open your workspace <span aria-hidden="true">↗</span>
        </Link>
      </section>
      <section className="feature-grid" aria-label="Workspace features">
        <article>
          <span className="number">01</span>
          <h2>Assign with clarity</h2>
          <p>Give each service note an owner and a clear next step.</p>
        </article>
        <article>
          <span className="number">02</span>
          <h2>Follow the work</h2>
          <p>Find tickets, review details and keep their status up to date.</p>
        </article>
        <article>
          <span className="number">03</span>
          <h2>Work as a team</h2>
          <p>A shared workspace with the right access for every role.</p>
        </article>
      </section>
      <footer className="public-footer">
        techNotes · Staff service workspace
      </footer>
    </main>
  );
}
function Protected({ managers = false }: { managers?: boolean }) {
  const auth = useAuth();
  const location = useLocation();
  if (auth.loading)
    return (
      <main id="main" className="center">
        <Loading />
      </main>
    );
  if (auth.error)
    return (
      <main id="main" className="center">
        <ResourceError message={auth.error} retry={() => void auth.refresh()} />
      </main>
    );
  if (!auth.user)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (managers && !canManage(auth.user))
    return <Navigate to="/dash/notes" replace />;
  return <Outlet />;
}
function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    setError("");
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="workspace">
      <aside className="sidebar">
        <Link className="brand" to="/dash">
          tech<span>Notes</span>
          <small>service desk</small>
        </Link>
        <nav aria-label="Workspace">
          <NavLink end to="/dash">
            Overview
          </NavLink>
          <NavLink to="/dash/notes">Service notes</NavLink>
          {canManage(user) && <NavLink to="/dash/users">Team members</NavLink>}
        </nav>
        <div className="identity">
          <strong>{user?.username}</strong>
          <span>{user?.roles.join(" · ")}</span>
          <button
            className="signout"
            disabled={busy}
            onClick={() => void logout()}
          >
            {busy ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>
      <main id="main" className="workspace-main">
        <ErrorMessage>{error}</ErrorMessage>
        <Outlet />
      </main>
    </div>
  );
}
function Overview() {
  const { user } = useAuth();
  return (
    <>
      <p className="eyebrow">YOUR WORKSPACE</p>
      <h1>Welcome, {user?.username}.</h1>
      <p className="intro">
        A clear view of the work ahead. Start with your service notes.
      </p>
      <div className="overview-grid">
        <Link className="overview-card" to="/dash/notes">
          <span className="number">01</span>
          <h2>Service notes ↗</h2>
          <p>Review assignments, update a ticket or start a new note.</p>
        </Link>
        {canManage(user) && (
          <Link className="overview-card" to="/dash/users">
            <span className="number">02</span>
            <h2>Team members ↗</h2>
            <p>Manage staff accounts, roles and active status.</p>
          </Link>
        )}
      </div>
    </>
  );
}
export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route element={<Protected />}>
          <Route path="/dash" element={<Dashboard />}>
            <Route index element={<Overview />} />
            <Route path="notes" element={<Notes />} />
            <Route path="notes/new" element={<NoteEditor />} />
            <Route path="notes/:id" element={<NoteEditor />} />
            <Route element={<Protected managers />}>
              <Route path="users" element={<Users />} />
              <Route path="users/new" element={<UserEditor />} />
              <Route path="users/:id" element={<UserEditor />} />
            </Route>
          </Route>
        </Route>
        <Route
          path="*"
          element={
            <main id="main" className="center">
              <h1>Page not found</h1>
              <Link className="button" to="/">
                Back to home
              </Link>
            </main>
          }
        />
      </Routes>
    </>
  );
}
