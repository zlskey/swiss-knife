// Feature registry shared by the popup and the content scripts.
// Each feature is a boolean stored in browser.storage.local under `key`.

/* exported SK_FEATURES, SK_DEFAULTS */

const SK_FEATURES = Object.freeze([
  {
    key: "hideYoutubeShorts",
    title: "Hide YouTube Shorts",
    description: "Removes Shorts shelves, tabs and links, and opens Shorts as regular videos.",
    site: "youtube.com",
    accent: "tangerine",
    defaultValue: false,
  },
  {
    key: "chatgptClaudeTheme",
    title: "Claude colors on ChatGPT",
    description: "Repaints ChatGPT in Claude's palette: deep #111111 background, warm grays, ivory text and clay accents.",
    site: "chatgpt.com",
    accent: "sky",
    defaultValue: false,
  },
  {
    key: "otodomClaudeBackground",
    title: "Claude colors on Otodom",
    description: "Swaps Otodom's white backgrounds and navy text for Claude's warm ivory and ink.",
    site: "otodom.pl",
    accent: "tangerine",
    defaultValue: false,
  },
]);

const SK_DEFAULTS = Object.freeze(
  Object.fromEntries(SK_FEATURES.map((f) => [f.key, f.defaultValue])),
);
