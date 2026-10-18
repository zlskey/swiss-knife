/* global skWatchSetting */
/* exported skOtodomOverrides */

const SK_OTODOM_IVORY = "#faf9f5"; // Claude's background
const SK_OTODOM_SAND = "#f0eee6"; // Claude's secondary surface
const SK_OTODOM_INK = "#141413"; // Claude's text
const SK_OTODOM_MUTED = "#5e5d59"; // Claude's secondary text
const SK_OTODOM_FAINT = "#87867f"; // Claude's placeholder text

// Otodom paints from CSS variables, but many generated (emotion) rules
// hardcode their colors. Returns Claude's replacement for such a value.
const SK_OTODOM_BACKGROUNDS = {
  "rgb(255, 255, 255)": SK_OTODOM_IVORY, "#fff": SK_OTODOM_IVORY, "#ffffff": SK_OTODOM_IVORY, white: SK_OTODOM_IVORY,
  "rgb(242, 243, 246)": SK_OTODOM_SAND, "#f2f3f6": SK_OTODOM_SAND,
};
const SK_OTODOM_TEXT = {
  "rgb(7, 17, 33)": SK_OTODOM_INK, "#071121": SK_OTODOM_INK,
  "rgb(27, 35, 46)": SK_OTODOM_INK, "#1b232e": SK_OTODOM_INK,
  "rgb(73, 82, 96)": SK_OTODOM_MUTED, "#495260": SK_OTODOM_MUTED,
};
const skOtodomOverrides = (value, table = SK_OTODOM_BACKGROUNDS) =>
  table[value.trim().toLowerCase()] ?? null;

(() => {
  const ROOT = "html.sk-otodom-claude-bg";
  const vars = (names, color) => names.map((name) => `${name}: ${color} !important;`).join(" ");
  const base = `
    ${ROOT} {
      ${vars(
        [
          "--colorsBackgroundPrimary", "--color-background-primary",
          "--colorsBackgroundElevated", "--color-background-elevated",
          "--primitivesColorsNeutralNeutral-0", "--color-neutral-neutral-0",
        ],
        SK_OTODOM_IVORY,
      )}
      ${vars(
        [
          "--colorsBackgroundSecondary", "--color-background-secondary",
          "--primitivesColorsNeutralNeutral-100", "--color-neutral-neutral-100",
        ],
        SK_OTODOM_SAND,
      )}
    }
    ${ROOT} {
      ${vars(
        [
          "--colorsForegroundPrimary", "--color-foreground-primary",
          "--colorsForegroundActionPrimary", "--color-foreground-action-primary",
          "--colorsForegroundOnLight", "--color-foreground-on-light",
          "--colorsForegroundOnPhoto",
        ],
        SK_OTODOM_INK,
      )}
      ${vars(["--colorsForegroundSecondary", "--color-foreground-secondary"], SK_OTODOM_MUTED)}
      ${vars(
        [
          "--colorsForegroundPlaceholder", "--color-foreground-placeholder",
          "--colorsForegroundDisabled", "--color-foreground-disabled",
        ],
        SK_OTODOM_FAINT,
      )}
    }
    ${ROOT} body { background-color: ${SK_OTODOM_IVORY} !important; color: ${SK_OTODOM_INK}; }
    ${ROOT} main { background-color: ${SK_OTODOM_SAND} !important; }
  `;

  const style = document.createElement("style");
  style.id = "sk-otodom-claude-bg";
  let pending = 0;

  // Mirrors every rule that hardcodes a white/gray background or dark text with the same
  // selector, scoped under our class.
  function scan() {
    pending = 0;
    let generated = "";
    for (const sheet of document.styleSheets) {
      if (sheet.ownerNode === style) continue;
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        continue; // cross-origin sheet
      }
      for (const rule of rules) {
        if (!rule.selectorText || !rule.style) continue;
        const selector = rule.selectorText
          .split(",")
          .map((s) => `${ROOT} ${s.trim()}`)
          .join(", ");
        const bg = skOtodomOverrides(rule.style.backgroundColor);
        const fg = skOtodomOverrides(rule.style.color, SK_OTODOM_TEXT);
        if (bg) generated += `${selector} { background-color: ${bg} !important; }\n`;
        if (fg) generated += `${selector} { color: ${fg} !important; }\n`;
      }
    }
    style.textContent = base + generated;
  }

  const schedule = () => {
    if (!pending) pending = setTimeout(scan, 100);
  };

  style.textContent = base;
  (document.head ?? document.documentElement).append(style);
  skWatchSetting("otodomClaudeBackground", "sk-otodom-claude-bg", schedule);

  const watch = () => {
    new MutationObserver(schedule).observe(document.head, { childList: true });
    schedule();
  };
  if (document.head) watch();
  else document.addEventListener("DOMContentLoaded", watch, { once: true });
  window.addEventListener("load", schedule);
})();
