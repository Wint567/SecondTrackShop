import { Globe2, Smile, Sparkles, Star } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="club-ticker" aria-label="SECONDTRACK principles">
        <span>
          <Globe2 aria-hidden="true" /> Global shipping
        </span>
        <span>
          <Sparkles aria-hidden="true" /> Quality checked
        </span>
        <span>
          <Smile aria-hidden="true" /> Second hand first
        </span>
        <span>
          <Star aria-hidden="true" /> Cut-paste spirit
        </span>
        <span>
          <i aria-hidden="true">*</i> Independent archive
        </span>
      </div>
      <div className="site-footer__inner">
        <Link className="club-logo" href="/">
          <strong>SECONDTRACK</strong>
          <em>CUT-PASTE CLUB</em>
        </Link>
        <nav aria-label="Footer navigation">
          <Link href="/catalog">Shop</Link>
          <Link href="/new-drop">New drop</Link>
          <Link href="/brands">Brands</Link>
          <Link href="/about">About</Link>
          <Link href="/saved">Favorites</Link>
        </nav>
        <span>© SECONDTRACK {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
