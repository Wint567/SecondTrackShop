"use client";

import {
  Heart,
  Menu,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useBodyLock } from "@/hooks/use-body-lock";
import { useDialogFocus } from "@/hooks/use-dialog-focus";

const navLinks = [
  { href: "/catalog?sort=newest", label: "Новинки" },
  { href: "/catalog", label: "Одежда" },
  { href: "/catalog?category=Обувь", label: "Обувь" },
  { href: "/catalog?category=Аксессуары", label: "Аксессуары" },
  { href: "/catalog?status=Куплено", label: "Скоро в продаже" },
];

export function Header() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuDialogRef = useRef<HTMLElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);
  const searchDialogRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useBodyLock(menuOpen || searchOpen);
  useDialogFocus({
    dialogRef: menuDialogRef,
    initialFocusRef: menuCloseRef,
    open: menuOpen,
  });
  useDialogFocus({
    dialogRef: searchDialogRef,
    initialFocusRef: searchInputRef,
    open: searchOpen,
  });

  useEffect(() => {
    if (!menuOpen && !searchOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen, searchOpen]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const query = String(form.get("search") ?? "").trim();
    setSearchOpen(false);
    router.push(query ? `/catalog?q=${encodeURIComponent(query)}` : "/catalog");
  };

  return (
    <>
      <header className="site-header">
        <div className="announcement">
          Бесплатная доставка от 300 zł
        </div>
        <div className="header-main page-shell">
          <button
            aria-controls="mobile-menu"
            aria-expanded={menuOpen}
            aria-label="Открыть меню"
            className="icon-button header-menu-button"
            onClick={() => setMenuOpen(true)}
            type="button"
          >
            <Menu aria-hidden="true" />
          </button>

          <Link className="wordmark" href="/" aria-label="SECONDTRACK — главная">
            SECONDTRACK
          </Link>

          <nav className="desktop-nav" aria-label="Основная навигация">
            {navLinks.map((link) => (
              <Link href={link.href} key={link.label}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <button
              aria-controls="catalog-search"
              aria-expanded={searchOpen}
              aria-label="Поиск"
              className="icon-button"
              onClick={() => setSearchOpen(true)}
              type="button"
            >
              <Search aria-hidden="true" />
            </button>
            <Link
              aria-label="Избранное"
              className="icon-button desktop-heart"
              href="/catalog?favorites=1"
            >
              <Heart aria-hidden="true" />
            </Link>
            <span className="locale">RU / PLN</span>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="overlay" onMouseDown={() => setMenuOpen(false)}>
          <aside
            aria-label="Мобильное меню"
            aria-modal="true"
            className="mobile-menu"
            id="mobile-menu"
            onMouseDown={(event) => event.stopPropagation()}
            ref={menuDialogRef}
            role="dialog"
          >
            <div className="mobile-menu__top">
              <span className="wordmark wordmark--small">SECONDTRACK</span>
              <button
                aria-label="Закрыть меню"
                className="icon-button"
                onClick={() => setMenuOpen(false)}
                ref={menuCloseRef}
                type="button"
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Мобильная навигация">
              <Link href="/" onClick={() => setMenuOpen(false)}>Главная</Link>
              <Link href="/catalog" onClick={() => setMenuOpen(false)}>Каталог</Link>
              {navLinks.map((link) => (
                <Link
                  href={link.href}
                  key={link.label}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/catalog?favorites=1"
                onClick={() => setMenuOpen(false)}
              >
                Избранное
              </Link>
            </nav>
            <p className="mobile-menu__note">
              Каждая вещь существует в одном экземпляре.
            </p>
          </aside>
        </div>
      )}

      {searchOpen && (
        <div className="overlay overlay--search" onMouseDown={() => setSearchOpen(false)}>
          <section
            aria-label="Поиск по каталогу"
            aria-modal="true"
            className="search-panel"
            id="catalog-search"
            onMouseDown={(event) => event.stopPropagation()}
            ref={searchDialogRef}
            role="dialog"
          >
            <button
              aria-label="Закрыть поиск"
              className="icon-button search-panel__close"
              onClick={() => setSearchOpen(false)}
              type="button"
            >
              <X aria-hidden="true" />
            </button>
            <p className="eyebrow">Найти вещь</p>
            <form onSubmit={submitSearch}>
              <label htmlFor="header-search">Название, бренд или категория</label>
              <div className="search-panel__field">
                <input
                  id="header-search"
                  name="search"
                  placeholder="Например, куртка"
                  ref={searchInputRef}
                  type="search"
                />
                <button className="button button--primary" type="submit">
                  Найти
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
