import { test } from "node:test";
import assert from "node:assert/strict";
import { flush, loadScripts } from "./helpers.js";

const FILES = ["shared/settings.js", "content/watch-setting.js", "content/youtube.js"];

test("skShortsToWatchUrl rewrites Shorts URLs only", () => {
  const { run } = loadScripts(FILES);
  const convert = (url) => run(`skShortsToWatchUrl(${JSON.stringify(url)})`);

  assert.equal(
    convert("https://www.youtube.com/shorts/abc_DEF-123?feature=share"),
    "https://www.youtube.com/watch?v=abc_DEF-123",
  );
  assert.equal(convert("https://m.youtube.com/shorts/xyz"), "https://m.youtube.com/watch?v=xyz");
  assert.equal(convert("https://www.youtube.com/watch?v=abc"), null);
  assert.equal(convert("https://www.youtube.com/@channel/shorts"), null);
});

test("is off by default", async () => {
  const page = loadScripts(FILES, { href: "https://www.youtube.com/shorts/abc" });
  await flush();
  assert.equal(page.classes.has("sk-hide-shorts"), false);
  assert.equal(page.location.replaced, null);
});

test("when enabled, hides Shorts and redirects a Short to the watch page", async () => {
  const page = loadScripts(FILES, {
    href: "https://www.youtube.com/shorts/abc",
    storage: { hideYoutubeShorts: true },
  });
  await flush();
  assert.equal(page.classes.has("sk-hide-shorts"), true);
  assert.equal(page.location.replaced, "https://www.youtube.com/watch?v=abc");
});

test("reacts to toggling from the popup and to SPA navigation", async () => {
  const page = loadScripts(FILES);
  await flush();

  await page.browser.storage.local.set({ hideYoutubeShorts: true });
  assert.equal(page.classes.has("sk-hide-shorts"), true);

  page.location.href = "https://www.youtube.com/shorts/next";
  page.dispatch("yt-navigate-finish");
  assert.equal(page.location.replaced, "https://www.youtube.com/watch?v=next");

  await page.browser.storage.local.set({ hideYoutubeShorts: false });
  assert.equal(page.classes.has("sk-hide-shorts"), false);
});
