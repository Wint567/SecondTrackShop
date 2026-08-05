"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";

export function BackToCatalogLink() {
  const router = useRouter();

  const preserveCatalogState = (event: MouseEvent<HTMLAnchorElement>) => {
    try {
      const referrer = new URL(document.referrer);
      if (referrer.origin === window.location.origin && referrer.pathname === "/catalog") {
        event.preventDefault();
        router.back();
      }
    } catch {
      // Direct visitors use the catalog fallback link.
    }
  };

  return (
    <Link className="product-back" href="/catalog" onClick={preserveCatalogState}>
      ← Back to shop
    </Link>
  );
}
