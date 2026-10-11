import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { message } from "../api";
import { ErrorMessage, Loading } from "../components/Feedback";
export default function Login() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const from =
    typeof location.state?.from === "string" &&
    location.state.from.startsWith("/dash")
      ? location.state.from
      : "/dash";
  if (loading)
    return (
      <main id="main" className="center">
        <Loading />
      </main>
    );
  if (user) return <Navigate to={from} replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signIn(username, password);
      navigate(from, { replace: true });
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main" className="login-page">
      <Link className="brand" to="/">
        tech<span>Notes</span>
        <small>service desk</small>
      </Link>
      <section className="login-card">
        <p className="eyebrow">STAFF ACCESS</p>
        <h1>Welcome back.</h1>
        <p className="muted">Sign in to your service workspace.</p>
        <form onSubmit={submit}>
          <ErrorMessage>{error}</ErrorMessage>
          <fieldset disabled={busy}>
            <label>
              Username
              <input
                autoComplete="username"
                required
                maxLength={30}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button type="submit">{busy ? "Signing in…" : "Sign in"}</button>
          </fieldset>
        </form>
        <Link className="back-link" to="/">
          ← Back to home
        </Link>
      </section>
    </main>
  );
}
