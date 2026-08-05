import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const pages = [
  ["home", path.join(root, ".next", "server", "app", "index.html")],
  ["catalog", path.join(root, ".next", "server", "app", "catalog.html")],
];

const localAssetPattern =
  /(?:href|src)="(\/(?:_next\/static|favicon\.svg|og-cut-paste\.webp)[^"]*)"/g;
const cardPattern = /aria-label="Open ([^"]+)"[^>]*href="(\/product\/[^"]+)"/g;
const photoPattern = /src="(https:\/\/[^"?]+\/storage\/v1\/object\/public\/item-photos\/[^"?]+)"/g;

function localFileFor(url) {
  const pathname = url.replaceAll("&amp;", "&").split("?", 1)[0];
  if (pathname.startsWith("/_next/static/")) {
    return path.join(root, ".next", "static", pathname.slice("/_next/static/".length));
  }
  return path.join(root, "public", pathname.slice(1));
}

const missingAssets = [];
const summaries = [];

for (const [name, file] of pages) {
  const html = await readFile(file, "utf8");
  const cards = [...html.matchAll(cardPattern)].map((match) => ({
    name: match[1],
    route: match[2],
  }));
  const photos = [...new Set([...html.matchAll(photoPattern)].map((match) => match[1]))];
  const explicitError =
    html.includes("couldn\u2019t load the shop") || html.includes("couldn't load the shop");

  if (cards.length === 0 && !explicitError) {
    throw new Error(
      `${name}: neither real product cards nor an explicit store error were rendered`,
    );
  }
  if (cards.length > 0 && photos.length === 0) {
    throw new Error(`${name}: product cards exist, but no public item photo URL was rendered`);
  }

  for (const match of html.matchAll(localAssetPattern)) {
    const localFile = localFileFor(match[1]);
    try {
      await access(localFile);
    } catch {
      missingAssets.push(path.relative(root, localFile));
    }
  }

  summaries.push({
    cards: cards.length,
    firstPhoto: photos[0] ?? null,
    firstProduct: cards[0] ?? null,
    page: name,
    state: cards.length > 0 ? "products" : "explicit-error",
  });
}

if (missingAssets.length > 0) {
  throw new Error(`Missing local production assets: ${[...new Set(missingAssets)].join(", ")}`);
}

for (const summary of summaries) console.log(JSON.stringify(summary));
console.log("Prerendered HTML and local production assets verified.");
