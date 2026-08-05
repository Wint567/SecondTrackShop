import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#f5f1e8",
    description: "A curated archive of one-of-one second-hand clothing from SECONDTRACK.",
    display: "standalone",
    icons: [
      {
        sizes: "any",
        src: "/favicon.svg",
        type: "image/svg+xml",
      },
    ],
    name: "SECONDTRACK Cut–Paste Club",
    short_name: "SECONDTRACK",
    start_url: "/",
    theme_color: "#0a0909",
  };
}
