# Vercel deployment checklist

## Project configuration

- Framework preset: **Next.js**
- Install command: `npm ci` (Vercel default is acceptable)
- Build command: `npm run build`
- Output directory: leave empty; Next.js manages it
- Node.js: 22.x

Configure these variables for Preview and Production:

| Variable                        | Scope               | Notes                                                |
| ------------------------------- | ------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Preview, Production | Public Supabase project URL                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Preview, Production | Publishable/anon key only                            |
| `NEXT_PUBLIC_SITE_URL`          | Production          | Canonical `https://` origin without a trailing slash |

Never add a Supabase `service_role` key to this project.

## Preview acceptance

Use a Preview deployment with the same read-only public data configuration as production.

- Open `/`, `/catalog`, `/new-drop`, `/brands`, `/saved`, `/about`, and a live `/product/[slug]` route.
- Fetch `/` and `/catalog` as plain HTTP and confirm a live product name and image URL exist in the response HTML.
- Confirm product images return 200 and no request to Supabase or Storage returns 400, 401, 403, or 404.
- Exercise search, every filter group, sorting, Show more, browser back/forward, and a shared catalog URL.
- Add and remove favorites, reload, open a second tab, clear all, and use Undo.
- Open every gallery image, use keyboard arrows and Escape, and verify the Vinted link opens the expected listing.
- Test 320, 375, 768, 1024, 1440, and 1600 px widths.
- Test reduced motion and a browser with WebGL disabled; content and controls must remain usable.
- Verify `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, `/favicon.svg`, and `/og-cut-paste.webp` return 200.
- Inspect the response headers for CSP, HSTS, frame protection, MIME sniffing protection, and referrer policy.
- Run the production URL through Lighthouse and record the date, route, device profile, and result before publishing any score.

## Rollback

Vercel keeps previous deployments immutable. If a release introduces a regression, promote the last verified deployment while the fix is prepared. Database, Storage, and RLS changes are intentionally outside this repository and must not be coupled to a storefront rollback.
