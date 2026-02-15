"use client";

export default function PageLoadingError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <h2 className="text-lg font-semibold text-brand-primary">
        Something went wrong
      </h2>
      <p className="mt-2 text-sm text-brand-muted">{error.message}</p>
      <button
        onClick={reset}
        className="btn-primary mt-4 rounded-lg px-4 py-2 text-sm font-medium"
      >
        Try again
      </button>
    </div>
  );
}
