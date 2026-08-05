import { readdir, readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import path from "node:path";

const chunkDirectory = path.join(process.cwd(), ".next", "static", "chunks");
const limitKb = Number(process.env.BUNDLE_GZIP_LIMIT_KB ?? 300);

async function listJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return listJavaScriptFiles(entryPath);
      return entry.isFile() && entry.name.endsWith(".js") ? [entryPath] : [];
    }),
  );
  return nested.flat();
}

const chunks = await listJavaScriptFiles(chunkDirectory);
const oversized = [];

for (const chunk of chunks) {
  const source = await readFile(chunk);
  const gzipKb = gzipSync(source).length / 1024;
  if (gzipKb > limitKb) {
    oversized.push({ chunk: path.relative(process.cwd(), chunk), gzipKb });
  }
}

if (oversized.length > 0) {
  for (const item of oversized) {
    console.error(`${item.chunk}: ${item.gzipKb.toFixed(1)} KB gzip`);
  }
  throw new Error(`Client chunk budget exceeded (${limitKb} KB gzip).`);
}

console.log(`Bundle budget passed: ${chunks.length} chunks at or below ${limitKb} KB gzip.`);
