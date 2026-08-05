import type { Metadata, Viewport } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getSiteOrigin } from "@/lib/site-url";
import "./styles/base.css";
import "./styles/home.css";
import "./styles/catalog.css";
import "./styles/product.css";
import "./styles/pages.css";
import "./styles/responsive.css";

export function generateMetadata(): Metadata {
  const origin = getSiteOrigin();
  const socialImage = new URL("/og-cut-paste.webp", origin).toString();

  return {
    metadataBase: new URL(origin),
    title: {
      default: "SECONDTRACK — Cut–Paste Club",
      template: "%s — SECONDTRACK",
    },
    description: "Found items. Worn again. Every piece gets a next track.",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    applicationName: "SECONDTRACK",
    keywords: ["second-hand clothing", "curated streetwear", "pre-owned fashion", "SECONDTRACK"],
    openGraph: {
      title: "SECONDTRACK — Cut–Paste Club",
      description: "Found items. Worn again. Every piece gets a next track.",
      type: "website",
      locale: "en_GB",
      images: [{ alt: "SECONDTRACK Cut–Paste Club", height: 630, url: socialImage, width: 1200 }],
    },
    twitter: {
      card: "summary_large_image",
      images: [socialImage],
      title: "SECONDTRACK — Cut–Paste Club",
      description: "Found items. Worn again.",
    },
  };
}

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { color: "#f5f1e8", media: "(prefers-color-scheme: light)" },
    { color: "#0a0909", media: "(prefers-color-scheme: dark)" },
  ],
  width: "device-width",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
