export function Loading() {
  return (
    <p role="status" className="muted">
      Loading your workspace…
    </p>
  );
}
export function ErrorMessage({ children }: { children: string }) {
  return children ? (
    <p role="alert" className="error">
      {children}
    </p>
  ) : null;
}
export function ResourceError({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div>
      <ErrorMessage>{message}</ErrorMessage>
      <button className="secondary" onClick={retry}>
        Try again
      </button>
    </div>
  );
}
