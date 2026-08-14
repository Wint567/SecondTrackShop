"use client";

import { Heart, Menu, Search, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useBodyLock } from "@/hooks/use-body-lock";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { useFavorites } from "@/hooks/use-favorites";

const SearchOverlay = dynamic(
  () => import("./SearchOverlay").then((module) => module.SearchOverlay),
  { ssr: false },
);

const navLinks = [
  { href: "/catalog", label: "Shop" },
  { href: "/new-drop", label: "New drop" },
  { href: "/brands", label: "Brands" },
  { href: "/about", label: "About" },
];

export function Header() {
  const pathname = usePathname();
  const { favorites } = useFavorites();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuDialogRef = useRef<HTMLElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);

  useBodyLock(menuOpen);
  useDialogFocus({ dialogRef: menuDialogRef, initialFocusRef: menuCloseRef, open: menuOpen });

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const isActive = (href: string) =>
    pathname === href || (href === "/catalog" && pathname.startsWith("/product/"));

  return (
    <>
      <header className="site-header">
        <div className="header-main">
          <Link className="club-logo" href="/" aria-label="SECONDTRACK home">
            <strong>SECONDTRACK</strong>
            <em>CUT-PASTE CLUB</em>
          </Link>

          <nav className="desktop-nav" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                aria-current={isActive(link.href) ? "page" : undefined}
                className={isActive(link.href) ? "is-active" : undefined}
                href={link.href}
                key={link.label}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <button
              aria-label="Search"
              className="header-search"
              onClick={() => setSearchOpen(true)}
              type="button"
            >
              <span>Search</span>
              <Search aria-hidden="true" />
            </button>
            <Link
              aria-label={`Favorites, ${favorites.size} saved`}
              aria-current={pathname === "/saved" ? "page" : undefined}
              className={`saved-link ${pathname === "/saved" ? "is-active" : ""}`}
              href="/saved"
            >
              <span>Favorites</span>
              <Heart aria-hidden="true" />
              <b>{favorites.size}</b>
            </Link>
            <button
              aria-controls="mobile-menu"
              aria-expanded={menuOpen}
              aria-label="Open menu"
              className="header-menu-button"
              onClick={() => setMenuOpen(true)}
              type="button"
            >
              <Menu aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="overlay club-overlay" onMouseDown={() => setMenuOpen(false)}>
          <aside
            aria-label="Mobile menu"
            aria-modal="true"
            className="mobile-menu"
            id="mobile-menu"
            onMouseDown={(event) => event.stopPropagation()}
            ref={menuDialogRef}
            role="dialog"
          >
            <div className="mobile-menu__top">
              <Link className="club-logo" href="/" onClick={() => setMenuOpen(false)}>
                <strong>SECONDTRACK</strong>
                <em>CUT-PASTE CLUB</em>
              </Link>
              <button
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                ref={menuCloseRef}
                type="button"
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <Link
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={isActive(link.href) ? "is-active" : undefined}
                  href={link.href}
                  key={link.label}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setSearchOpen(true);
                }}
                type="button"
              >
                Search
              </button>
              <Link
                aria-current={pathname === "/saved" ? "page" : undefined}
                className={pathname === "/saved" ? "is-active" : undefined}
                href="/saved"
                onClick={() => setMenuOpen(false)}
              >
                Favorites <span>{String(favorites.size).padStart(2, "0")}</span>
              </Link>
            </nav>
            <p>
              Found items. Worn again.
              <br />
              Every piece gets a next track.
            </p>
          </aside>
        </div>
      )}

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
