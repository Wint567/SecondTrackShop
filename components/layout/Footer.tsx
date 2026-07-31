import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-shell footer-grid">
        <div className="footer-brand">
          <Link className="wordmark wordmark--footer" href="/">
            SECONDTRACK
          </Link>
          <p>
            Вещи с прошлым, которые готовы стать частью новой истории.
          </p>
        </div>
        <div>
          <p className="footer-heading">Магазин</p>
          <Link href="/catalog?sort=newest">Новинки</Link>
          <Link href="/catalog">Весь каталог</Link>
          <Link href="/catalog?status=Куплено">Скоро в продаже</Link>
        </div>
        <div>
          <p className="footer-heading">Категории</p>
          <Link href="/catalog?category=Куртки">Куртки</Link>
          <Link href="/catalog?category=Трикотаж">Трикотаж</Link>
          <Link href="/catalog?category=Обувь">Обувь</Link>
        </div>
        <div>
          <p className="footer-heading">Как это работает</p>
          <Link href="/#concept">О SECONDTRACK</Link>
          <Link href="/#delivery">Доставка и покупка</Link>
          <p className="footer-small">Покупка и оплата проходят через Vinted.</p>
        </div>
      </div>
      <div className="page-shell footer-bottom">
        <span>© {new Date().getFullYear()} SECONDTRACK</span>
        <span>Warszawa · Polska</span>
      </div>
    </footer>
  );
}
