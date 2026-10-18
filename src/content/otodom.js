/* global skWatchSetting */
/* exported skOtodomOverrides */

const SK_OTODOM_IVORY = "#faf9f5"; // Claude's background
const SK_OTODOM_SAND = "#f0eee6"; // Claude's secondary surface

// Otodom paints surfaces from CSS variables, but many generated (emotion) rules
// hardcode white. Returns a replacement color for such a background value.
function skOtodomOverrides(value) {
  const v = value.trim().toLowerCase();
  if (v === "rgb(255, 255, 255)" || v === "#fff" || v === "#ffffff" || v === "white") return SK_OTODOM_IVORY;
  if (v === "rgb(242, 243, 246)" || v === "#f2f3f6") return SK_OTODOM_SAND;
  return null;
}

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
    ${ROOT} body { background-color: ${SK_OTODOM_IVORY} !important; }
    ${ROOT} main { background-color: ${SK_OTODOM_SAND} !important; }
  `;

  const style = document.createElement("style");
  style.id = "sk-otodom-claude-bg";
  let pending = 0;

  // Mirrors every rule that hardcodes a white/gray background with the same
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
        const bg = rule.style?.backgroundColor;
        const color = bg && skOtodomOverrides(bg);
        if (!color) continue;
        const selector = rule.selectorText
          .split(",")
          .map((s) => `${ROOT} ${s.trim()}`)
          .join(", ");
        generated += `${selector} { background-color: ${color} !important; }\n`;
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
