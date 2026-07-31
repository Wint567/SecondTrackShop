import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

async function readLocalEnv() {
  let envText = "";
  try {
    envText = await readFile(new URL("../.env", import.meta.url), "utf8");
  } catch {
    return {};
  }

  return Object.fromEntries(
    envText
      .split(/\r?\n/)
      .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=");
        return [
          line.slice(0, separator).trim(),
          line
            .slice(separator + 1)
            .trim()
            .replace(/^['"]|['"]$/g, ""),
        ];
      }),
  );
}

async function getProductFixture() {
  const env = await readLocalEnv();
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    return { configured: false };
  }

  const supabase = createClient(
    env.VITE_SUPABASE_URL,
    env.VITE_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } },
  );
  const { data, error } = await supabase
    .from("public_store_items")
    .select("slug,title,brand,primary_photo_id")
    .not("primary_photo_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  assert.equal(error, null);
  assert.ok(data);
  return {
    brand: data.brand,
    configured: true,
    slug: data.slug,
    title: data.title,
  };
}

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set(
    "test",
    `${pathname}-${process.pid}-${Date.now()}`,
  );
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

function assertInitialProductMarkup(html, fixture) {
  assert.ok(html.includes(fixture.title));
  assert.ok(html.includes(fixture.brand));
  assert.match(html, /class="product-card"/);
  assert.match(
    html,
    /https:\/\/[^"'<>]+\/storage\/v1\/object\/public\/item-photos\//,
  );
  assert.doesNotMatch(
    html,
    /demo-fieldworks-jacket|skeleton-grid|product-contact-sheet\.webp|field-jacket-gallery\.webp/,
  );
}

test("home HTML contains a real initial product card", async () => {
  const fixture = await getProductFixture();
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /SECONDTRACK/);
  assert.match(html, /secondtrack-hero\.webp/);
  assert.doesNotMatch(html, /starter-preview|react-loading-skeleton/i);

  if (fixture.configured) {
    assertInitialProductMarkup(html, fixture);
  } else {
    assert.match(html, /role="alert"/);
    assert.doesNotMatch(html, /demo-fieldworks-jacket/);
  }
});

test("catalog HTML contains a real initial product card", async () => {
  const fixture = await getProductFixture();
  const response = await render("/catalog");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /SECONDTRACK/);
  if (fixture.configured) {
    assertInitialProductMarkup(html, fixture);
  } else {
    assert.match(html, /role="alert"/);
    assert.doesNotMatch(html, /demo-fieldworks-jacket/);
  }
});

test("product and missing-slug routes return the correct status", async () => {
  const fixture = await getProductFixture();
  const missingSlug = `net-takogo-sluga-${Date.now()}`;
  const missingResponse = await render(`/product/${missingSlug}`);

  assert.equal(missingResponse.status, 404);
  const missingHtml = await missingResponse.text();
  assert.match(missingHtml, /<meta name="robots" content="[^"]*noindex[^"]*"/);

  if (!fixture.configured) return;

  const productResponse = await render(
    `/product/${encodeURIComponent(fixture.slug)}`,
  );
  assert.equal(productResponse.status, 200);
  const productHtml = await productResponse.text();
  assert.ok(productHtml.includes(fixture.title));
  assert.ok(productHtml.includes(fixture.brand));
  assert.match(
    productHtml,
    /https:\/\/[^"'<>]+\/storage\/v1\/object\/public\/item-photos\//,
  );
});

test("malformed slugs do not produce a server error", async () => {
  const response = await render("/product/%25");
  assert.equal(response.status, 404);
  const html = await response.text();
  assert.doesNotMatch(html, /<title>Error<\/title>|URI malformed/);
});

test("Supabase configuration stays environment-only and has no demo fallback", async () => {
  const [client, example, store] = await Promise.all([
    readFile(new URL("../lib/supabase/client.ts", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
    readFile(new URL("../services/store.ts", import.meta.url), "utf8"),
  ]);

  assert.match(client, /VITE_SUPABASE_URL/);
  assert.match(client, /VITE_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(client, /service_role|https:\/\/[a-z0-9-]+\.supabase\.co/i);
  assert.equal(
    example,
    "VITE_SUPABASE_URL=\nVITE_SUPABASE_ANON_KEY=\n",
  );
  assert.doesNotMatch(store, /demoProducts|service_role/i);
});

test("every referenced local image exists in an optimized format", async () => {
  const localImages = [
    "../public/images/secondtrack-hero.webp",
    "../public/images/product-contact-sheet.webp",
    "../public/images/field-jacket-gallery.webp",
    "../public/og.webp",
  ];

  for (const pathname of localImages) {
    const contents = await readFile(new URL(pathname, import.meta.url));
    assert.equal(contents.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(contents.subarray(8, 12).toString("ascii"), "WEBP");
  }

  await Promise.all([
    access(new URL("../assets/source-images/secondtrack-hero.png", import.meta.url)),
    access(new URL("../assets/source-images/og.png", import.meta.url)),
  ]);

  const [homeSource, layoutSource] = await Promise.all([
    readFile(new URL("../components/pages/HomePage.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(homeSource, /secondtrack-hero\.webp/);
  assert.match(layoutSource, /og\.webp/);
  assert.doesNotMatch(
    `${homeSource}\n${layoutSource}`,
    /secondtrack-hero\.png|og\.png/,
  );
});
