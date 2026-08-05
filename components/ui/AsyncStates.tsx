import { RotateCcw } from "lucide-react";
import Link from "next/link";

export function LoadingState({ count = 4 }: { count?: number }) {
  return (
    <div aria-label="Loading the latest finds…" aria-live="polite" className="skeleton-grid">
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-card" key={index}>
          <div className="skeleton skeleton--image" />
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line skeleton--short" />
        </div>
      ))}
      <span className="sr-only">Loading the latest finds…</span>
    </div>
  );
}

export function ErrorState({
  description = "Please try again in a moment.",
  retry,
  title = "We couldn’t load the shop.",
}: {
  description?: string;
  retry: () => void;
  title?: string;
}) {
  return (
    <section className="state-panel state-panel--error" role="alert">
      <p className="eyebrow">Connection interrupted</p>
      <h2>{title}</h2>
      <p>{description}</p>
      <button className="button button--outline" onClick={retry} type="button">
        <RotateCcw aria-hidden="true" />
        Try again
      </button>
    </section>
  );
}

export function EmptyState({
  filtered = false,
  onReset,
  variant = "catalog",
}: {
  filtered?: boolean;
  onReset?: () => void;
  variant?: "catalog" | "favorites";
}) {
  const favorites = variant === "favorites";
  return (
    <section className="state-panel state-panel--empty">
      <p className="eyebrow">
        {favorites ? "Saved objects" : filtered ? "No items found" : "Nothing here yet."}
      </p>
      <h2>
        {favorites
          ? "Your favorites are empty."
          : filtered
            ? "No items match your filters."
            : "Fresh finds are on the way."}
      </h2>
      <p>
        {favorites
          ? "Save a one-of-one piece from the archive and it will stay here on this device."
          : filtered
            ? "Try changing or resetting the filters."
            : "We publish small, carefully selected drops rather than filling the rack with placeholders."}
      </p>
      {filtered && onReset ? (
        <button className="button button--outline" onClick={onReset} type="button">
          Reset filters
        </button>
      ) : (
        <Link className="text-link" href={favorites || filtered ? "/catalog" : "/"}>
          {favorites ? "Browse the archive" : filtered ? "Reset filters" : "Back home"}
        </Link>
      )}
    </section>
  );
}
