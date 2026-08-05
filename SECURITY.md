# Security policy

## Supported version

Only the latest version on the default branch is supported.

## Data boundary

This storefront is read-only. It may contain only the public Supabase URL and publishable/anon key. Do not add admin credentials, a `service_role` key, customer data, or private inventory fields to repository files, browser bundles, build logs, or deployment variables.

External purchase links are rendered only for secure `vinted.pl` hosts. Favorites are stored on the visitor's device and are not transmitted to an application database.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting for the repository. Include the affected route, reproduction steps, impact, and any relevant response headers or status codes. Do not include credentials or personal data in the report.
