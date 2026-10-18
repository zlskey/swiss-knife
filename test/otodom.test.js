import { test } from "node:test";
import assert from "node:assert/strict";
import { flush, loadScripts } from "./helpers.js";

const FILES = ["shared/settings.js", "content/watch-setting.js", "content/otodom.js"];

test("toggles the Otodom background class", async () => {
  const page = loadScripts(FILES, { href: "https://www.otodom.pl/" });
  await flush();
  assert.equal(page.classes.has("sk-otodom-claude-bg"), false);

  await page.browser.storage.local.set({ otodomClaudeBackground: true });
  assert.equal(page.classes.has("sk-otodom-claude-bg"), true);
});

test("maps white and light gray backgrounds to Claude's", () => {
  const { run } = loadScripts(FILES);
  assert.equal(run('skOtodomOverrides("rgb(255, 255, 255)")'), "#faf9f5");
  assert.equal(run('skOtodomOverrides("#FFF")'), "#faf9f5");
  assert.equal(run('skOtodomOverrides("#F2F3F6")'), "#f0eee6");
  assert.equal(run('skOtodomOverrides("rgb(7, 17, 33)")'), null);
});
