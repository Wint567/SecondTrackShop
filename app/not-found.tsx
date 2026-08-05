import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main id="main-content" className="not-found cutpaste-sheet">
      <p className="eyebrow">Wrong turn</p>
      <h1>404 — LOST IN THE RACK</h1>
      <p>This page is no longer part of the collection.</p>
      <div className="not-found__actions">
        <Link className="club-button" href="/catalog">
          Back to shop
        </Link>
        <Link className="text-link" href="/">
          Home
        </Link>
      </div>
      <span aria-hidden="true" className="not-found__sticker">
        KEEP
        <br />
        LOOKING :)
      </span>
    </main>
  );
}
