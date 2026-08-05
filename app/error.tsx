"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Storefront route error", {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <main className="cutpaste-sheet not-found" id="main-content">
      <p className="eyebrow">Connection interrupted</p>
      <h1>THE ARCHIVE HIT A SNAG</h1>
      <p>The page could not be completed. Your saved objects are still safe on this device.</p>
      <button className="club-button" onClick={reset} type="button">
        Try again
      </button>
    </main>
  );
}
