import { readdir, readFile, stat } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import path from "node:path";

const DEFAULT_LIMIT_KB = 300;

function chunkDirectoryCandidates(cwd, override) {
  const candidates = [
    override && path.resolve(cwd, override),
    path.join(cwd, ".next", "static", "chunks"),
    path.join(cwd, ".next", "output", "static", "_next", "static", "chunks"),
    path.join(cwd, ".vercel", "output", "static", "_next", "static", "chunks"),
  ];

  return [...new Set(candidates.filter(Boolean))];
}

async function isDirectory(directory) {
  try {
    return (await stat(directory)).isDirectory();
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

export async function resolveChunkDirectory({ cwd = process.cwd(), override } = {}) {
  const candidates = chunkDirectoryCandidates(cwd, override);

  for (const candidate of candidates) {
    if (await isDirectory(candidate)) return candidate;
  }

  const checked = candidates.map((candidate) => path.relative(cwd, candidate)).join(", ");
  throw new Error(`Next.js client chunks were not found. Checked: ${checked}`);
}

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

export async function checkBundleBudget({
  cwd = process.cwd(),
  limitKb = Number(process.env.BUNDLE_GZIP_LIMIT_KB ?? DEFAULT_LIMIT_KB),
  override = process.env.BUNDLE_CHUNKS_DIR,
} = {}) {
  if (!Number.isFinite(limitKb) || limitKb <= 0) {
    throw new Error("BUNDLE_GZIP_LIMIT_KB must be a positive number.");
  }

  const chunkDirectory = await resolveChunkDirectory({ cwd, override });
  const chunks = await listJavaScriptFiles(chunkDirectory);
  const oversized = [];

  for (const chunk of chunks) {
    const source = await readFile(chunk);
    const gzipKb = gzipSync(source).length / 1024;
    if (gzipKb > limitKb) {
      oversized.push({ chunk: path.relative(cwd, chunk), gzipKb });
    }
  }

  if (oversized.length > 0) {
    for (const item of oversized) {
      console.error(`${item.chunk}: ${item.gzipKb.toFixed(1)} KB gzip`);
    }
    throw new Error(`Client chunk budget exceeded (${limitKb} KB gzip).`);
  }

  return {
    chunkCount: chunks.length,
    directory: path.relative(cwd, chunkDirectory),
    limitKb,
  };
}

async function main() {
  const result = await checkBundleBudget();
  console.log(
    `Bundle budget passed: ${result.chunkCount} chunks in ${result.directory} at or below ${result.limitKb} KB gzip.`,
  );
}

const entryPoint = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (entryPoint === import.meta.url) await main();
