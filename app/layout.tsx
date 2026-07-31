import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getSiteOrigin } from "@/lib/site-url";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const origin = await getSiteOrigin();
  const socialImage = new URL("/og.webp", origin).toString();

  return {
    metadataBase: new URL(origin),
    title: {
      default: "SECONDTRACK — отобранная одежда",
      template: "%s — SECONDTRACK",
    },
    description:
      "Отобранная винтажная одежда и оригинальные вещи в единственном экземпляре. Осознанный стиль с доставкой по Польше.",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    applicationName: "SECONDTRACK",
    alternates: { canonical: "/" },
    keywords: [
      "винтажная одежда",
      "second hand",
      "одежда Польша",
      "SECONDTRACK",
    ],
    openGraph: {
      title: "SECONDTRACK — вещи с историей",
      description:
        "Отобранная одежда в единственном экземпляре. Стиль без срока.",
      type: "website",
      locale: "ru_RU",
      images: [
        {
          alt: "SECONDTRACK — вещи с историей. Стиль без срока.",
          height: 630,
          url: socialImage,
          width: 1200,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: [socialImage],
      title: "SECONDTRACK — вещи с историей",
      description: "Отобранная одежда в единственном экземпляре.",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <a className="skip-link" href="#main-content">
          Перейти к содержимому
        </a>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
