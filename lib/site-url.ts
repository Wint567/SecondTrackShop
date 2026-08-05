const FALLBACK_ORIGIN = "http://localhost:3000";

export function getSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ?? process.env.VERCEL_URL?.trim();
  const candidate = configured || (vercelHost ? `https://${vercelHost}` : "");
  if (!candidate) return FALLBACK_ORIGIN;

  try {
    const origin = new URL(candidate).origin;
    return /^https?:\/\//i.test(origin) ? origin : FALLBACK_ORIGIN;
  } catch {
    console.error("[SECONDTRACK] NEXT_PUBLIC_SITE_URL is not a valid absolute HTTP(S) URL.");
    return FALLBACK_ORIGIN;
  }
}
