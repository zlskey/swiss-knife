import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { loadScripts, readSrc } from "./helpers.js";

const manifest = JSON.parse(readSrc("manifest.json"));
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("manifest version matches package.json", () => {
  assert.equal(manifest.version, pkg.version);
});

test("every file referenced by the manifest exists", () => {
  const files = [
    ...Object.values(manifest.icons),
    ...Object.values(manifest.action.default_icon),
    manifest.action.default_popup,
    ...manifest.content_scripts.flatMap((cs) => [...cs.js, ...(cs.css ?? [])]),
  ];
  for (const file of files) {
    assert.ok(existsSync(new URL(`../src/${file}`, import.meta.url)), `missing ${file}`);
  }
});

test("every feature has a unique key and a default", () => {
  const { run } = loadScripts(["shared/settings.js"]);
  const keys = JSON.parse(run("JSON.stringify(SK_FEATURES.map((f) => f.key))"));
  assert.equal(new Set(keys).size, keys.length);
  assert.deepEqual(JSON.parse(run("JSON.stringify(Object.keys(SK_DEFAULTS))")), keys);
});
