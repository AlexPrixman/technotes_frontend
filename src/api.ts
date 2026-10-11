export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const base = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "AbortError"
    )
      throw error;
    throw new ApiError(0, "Unable to connect. Please try again.");
  }
  if (options.signal?.aborted)
    throw new DOMException("Request cancelled.", "AbortError");
  const data =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (options.signal?.aborted)
    throw new DOMException("Request cancelled.", "AbortError");
  if (!response.ok) {
    if (response.status === 401 && path !== "/auth/login")
      window.dispatchEvent(new Event("technotes:session-expired"));
    throw new ApiError(
      response.status,
      data?.message || "The request could not be completed.",
    );
  }
  return data as T;
}
export const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "The request could not be completed.";
