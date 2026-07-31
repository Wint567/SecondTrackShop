import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Страница не найдена",
};

export default function NotFound() {
  return (
    <main id="main-content" className="not-found page-shell">
      <p className="eyebrow">404</p>
      <h1>Эта страница продолжила путь без нас.</h1>
      <p>
        Возможно, товар уже снят с публикации или адрес был введён с ошибкой.
      </p>
      <div className="not-found__actions">
        <Link className="button button--primary" href="/catalog">
          Перейти в каталог
        </Link>
        <Link className="text-link" href="/">
          На главную
        </Link>
      </div>
    </main>
  );
}
