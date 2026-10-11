import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError, message } from "./api";
import type { User } from "./types";
interface Auth {
  user: User | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function refresh(signal?: AbortSignal) {
    setError("");
    try {
      const result = await api<{ user: User }>("/auth/session", { signal });
      if (!signal?.aborted) setUser(result.user);
    } catch (error) {
      if (signal?.aborted) return;
      setUser(null);
      if (!(error instanceof ApiError && error.status === 401))
        setError(message(error));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }
  useEffect(() => {
    const expired = () => setUser(null);
    const controller = new AbortController();
    window.addEventListener("technotes:session-expired", expired);
    void refresh(controller.signal);
    return () => {
      controller.abort();
      window.removeEventListener("technotes:session-expired", expired);
    };
  }, []);
  async function signIn(username: string, password: string) {
    setUser(
      (
        await api<{ user: User }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ username, password }),
        })
      ).user,
    );
    setError("");
  }
  async function signOut() {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
  }
  return (
    <Context.Provider
      value={{ user, loading, error, refresh, signIn, signOut }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider is required.");
  return value;
}
