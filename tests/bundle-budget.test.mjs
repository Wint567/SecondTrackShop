import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { checkBundleBudget, resolveChunkDirectory } from "../scripts/check-bundle-budget.mjs";

async function withTemporaryBuild(run) {
  const cwd = await mkdtemp(path.join(tmpdir(), "secondtrack-bundle-"));
  try {
    await run(cwd);
  } finally {
    await rm(cwd, { force: true, recursive: true });
  }
}

test("bundle budget reads client chunks from the Vercel Build Output layout", async () => {
  await withTemporaryBuild(async (cwd) => {
    const chunks = path.join(cwd, ".vercel", "output", "static", "_next", "static", "chunks");
    await mkdir(path.join(chunks, "app"), { recursive: true });
    await writeFile(path.join(chunks, "app", "page.js"), "console.log('ok');\n");

    assert.equal(await resolveChunkDirectory({ cwd }), chunks);
    assert.deepEqual(await checkBundleBudget({ cwd, limitKb: 1 }), {
      chunkCount: 1,
      directory: path.join(".vercel", "output", "static", "_next", "static", "chunks"),
      limitKb: 1,
    });
  });
});

test("bundle budget reports every supported location when build output is missing", async () => {
  await withTemporaryBuild(async (cwd) => {
    await assert.rejects(resolveChunkDirectory({ cwd }), {
      message: /Next\.js client chunks were not found.*\.next.*\.vercel/s,
    });
  });
});
