import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, test, expect, vi } from "vitest";
import App from "../App";
import { AuthProvider } from "../auth";
import { canManage, type User } from "../types";
const employee: User = {
  _id: "emp",
  username: "employee",
  roles: ["Employee"],
  active: true,
};
const admin: User = {
  _id: "admin",
  username: "admin",
  roles: ["Admin"],
  active: true,
};
const note = {
  _id: "note",
  user: "emp",
  ticket: 1000,
  title: "Inspect brakes",
  text: "Check pads",
  completed: false,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};
let session: User | null;
let responseError: string;
beforeEach(() => {
  session = null;
  responseError = "";
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, options?: RequestInit) => {
      const path = input.replace("/api", "");
      let status = 200;
      let data: unknown;
      if (path === "/auth/session") {
        status = session ? 200 : 401;
        data = session ? { user: session } : { message: "Please sign in." };
      } else if (path === "/auth/login") {
        if (responseError) {
          status = 401;
          data = { message: responseError };
        } else {
          session = admin;
          data = { user: admin };
        }
      } else if (path === "/auth/logout") {
        session = null;
        status = 204;
      } else if (path === "/users/assignees" || path === "/users")
        data = [admin, employee];
      else if (path === "/notes" && !options?.method) data = [note];
      else if (path === "/notes/note") data = note;
      else if (options?.method === "POST" || options?.method === "PATCH")
        data = { ...note, ...JSON.parse(String(options.body)) };
      return new Response(status === 204 ? null : JSON.stringify(data), {
        status,
      });
    }),
  );
});
function show(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}
test("public site has a working staff entry and descriptive content", () => {
  show("/");
  expect(
    screen.getByRole("heading", { name: /keep every/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Staff sign in" })).toHaveAttribute(
    "href",
    "/login",
  );
});
test("protected deep links redirect to login", async () => {
  show("/dash/notes");
  expect(
    await screen.findByRole("heading", { name: "Welcome back." }),
  ).toBeInTheDocument();
});
test("login submits credentials and restores the requested page", async () => {
  show("/dash/notes");
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText("Username"), "admin");
  await user.type(screen.getByLabelText("Password"), "TechNotes123!");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  expect(
    await screen.findByRole("heading", { name: "Service notes" }),
  ).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith(
    "/api/auth/login",
    expect.objectContaining({
      credentials: "include",
      body: JSON.stringify({ username: "admin", password: "TechNotes123!" }),
    }),
  );
});
test("invalid login displays the server error", async () => {
  responseError = "Invalid username or password.";
  show("/login");
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText("Username"), "admin");
  await user.type(screen.getByLabelText("Password"), "wrong");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(responseError);
});
test("employees cannot see team navigation or open manager pages", async () => {
  session = employee;
  show("/dash/users");
  expect(
    await screen.findByRole("heading", { name: "Service notes" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Team members" }),
  ).not.toBeInTheDocument();
});
test("notes filter by status and search, with a useful empty state", async () => {
  session = admin;
  show("/dash/notes");
  const user = userEvent.setup();
  expect(await screen.findByText("Inspect brakes")).toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText("Status"), "completed");
  expect(screen.getByText("No matching notes")).toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText("Status"), "all");
  await user.type(screen.getByLabelText("Search notes"), "unknown");
  expect(screen.getByText("No matching notes")).toBeInTheDocument();
});
test("new note sends the full API contract and returns to the queue", async () => {
  session = employee;
  show("/dash/notes/new");
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText("Title"), "Oil service");
  await user.type(screen.getByLabelText("Description"), "Change the oil.");
  await user.click(screen.getByRole("button", { name: "Save note" }));
  await waitFor(() =>
    expect(fetch).toHaveBeenCalledWith(
      "/api/notes",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          user: "emp",
          title: "Oil service",
          text: "Change the oil.",
          completed: false,
        }),
      }),
    ),
  );
  expect(
    await screen.findByRole("heading", { name: "Service notes" }),
  ).toBeInTheDocument();
});
test("employee note editor hides the delete action", async () => {
  session = employee;
  show("/dash/notes/note");
  expect(await screen.findByDisplayValue("Inspect brakes")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Delete note" }),
  ).not.toBeInTheDocument();
});
test("sign out clears authenticated pages", async () => {
  session = admin;
  show("/dash");
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "Sign out" }));
  expect(
    await screen.findByRole("heading", { name: "Welcome back." }),
  ).toBeInTheDocument();
});
test("a server outage shows retry feedback", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
  show("/dash");
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Unable to connect",
  );
  expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
});
test("role helpers only grant staff administration to Managers and Admins", () => {
  expect(canManage(employee)).toBe(false);
  expect(canManage(admin)).toBe(true);
  expect(canManage(null)).toBe(false);
});
