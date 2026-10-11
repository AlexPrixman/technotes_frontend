import { afterEach, test, expect, vi } from "vitest";
import { api, ApiError } from "../api";
afterEach(() => vi.unstubAllGlobals());
test("successful requests include cookies and parse JSON", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response('{"value":1}'));
  vi.stubGlobal("fetch", fetchMock);
  expect(await api("/notes")).toEqual({ value: 1 });
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/notes",
    expect.objectContaining({ credentials: "include" }),
  );
});
test("204 responses work without a JSON body", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
  );
  expect(await api("/notes/id", { method: "DELETE" })).toBeNull();
});
test("API errors retain HTTP status and server validation messages", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response('{"message":"Duplicate title"}', { status: 409 }),
      ),
  );
  await expect(api("/notes")).rejects.toMatchObject({
    status: 409,
    message: "Duplicate title",
  });
});
test("expired sessions broadcast an authentication reset", async () => {
  const expired = vi.fn();
  window.addEventListener("technotes:session-expired", expired);
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("{}", { status: 401 })),
  );
  await expect(api("/notes")).rejects.toBeInstanceOf(ApiError);
  expect(expired).toHaveBeenCalledOnce();
  window.removeEventListener("technotes:session-expired", expired);
});
test("aborted requests preserve AbortError and network failures are readable", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(new DOMException("aborted", "AbortError")),
  );
  await expect(api("/notes")).rejects.toMatchObject({ name: "AbortError" });
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
  await expect(api("/notes")).rejects.toMatchObject({
    status: 0,
    message: "Unable to connect. Please try again.",
  });
});
test("a cancelled stale 401 response does not clear a newer session", async () => {
  const expired = vi.fn();
  window.addEventListener("technotes:session-expired", expired);
  const controller = new AbortController();
  let finish!: (value: Response) => void;
  vi.stubGlobal(
    "fetch",
    vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    ),
  );
  const result = api("/auth/session", { signal: controller.signal });
  controller.abort();
  finish(new Response("{}", { status: 401 }));
  await expect(result).rejects.toMatchObject({ name: "AbortError" });
  expect(expired).not.toHaveBeenCalled();
  window.removeEventListener("technotes:session-expired", expired);
});
