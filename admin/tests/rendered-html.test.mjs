import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("build contains the Spot Research Desk and API routes", async () => {
  const [page, desk, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/research-desk.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    access(new URL("../dist/server/index.js", import.meta.url)),
  ]);
  assert.match(page, /Spot Research Desk/);
  assert.match(desk, /候補を確かめる/);
  assert.match(desk, /調査開始/);
  assert.match(desk, /定期調査・出力/);
  assert.match(desk, /軽量JSON/);
  assert.match(desk, /Google Maps・口コミ傾向/);
  assert.match(desk, /Schema 1\.2/);
  assert.match(css, /\.review-layout/);
  await access(new URL("../app/api/candidates/route.ts", import.meta.url));
  await access(new URL("../app/api/exports/route.ts", import.meta.url));
});
