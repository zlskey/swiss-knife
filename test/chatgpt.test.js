import { test } from "node:test";
import assert from "node:assert/strict";
import { flush, loadScripts } from "./helpers.js";

const FILES = ["shared/settings.js", "content/watch-setting.js", "content/chatgpt.js"];

test("toggles the Claude theme class", async () => {
  const page = loadScripts(FILES, { href: "https://chatgpt.com/" });
  await flush();
  assert.equal(page.classes.has("sk-claude-theme"), false);

  await page.browser.storage.local.set({ chatgptClaudeTheme: true });
  assert.equal(page.classes.has("sk-claude-theme"), true);
});

test("maps ChatGPT colors to Claude's palette", () => {
  const { run } = loadScripts(FILES);
  const map = (rgba, pageBg) =>
    run(`skClaudeColor(${JSON.stringify(rgba)}, {
      pageBg: ${JSON.stringify(pageBg)}, dark: skIsDark(${JSON.stringify(pageBg)}) })`);
  const black = [0, 0, 0, 1];
  const white = [255, 255, 255, 1];

  // Page background -> #111111 in dark mode, ivory in light mode
  assert.equal(map(black, black), "rgb(17 17 17)");
  assert.equal(map(white, white), "rgb(250 249 245)");
  // Neutral grays become warm, alpha is kept
  assert.equal(map(white, black), "rgb(251 249 241)");
  assert.equal(map([48, 48, 48, 0.5], black), "rgb(47 47 45 / 0.5)");
  // Blue accent -> clay
  const [r, g, b] = map([58, 131, 247, 1], black).match(/\d+/g).map(Number);
  assert.ok(r > g && g > b, `expected a clay tone, got rgb(${r} ${g} ${b})`);
  // Error red stays as is
  assert.equal(map([220, 38, 38, 1], black), null);
});
