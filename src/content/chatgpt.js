/* global skWatchSetting */
/* exported skClaudeColor, skClaudePalette, skIsDark */

// Claude's palette. The dark background comes from the reference screenshot.
const SK_CLAUDE = Object.freeze({
  darkBg: [17, 17, 17], // #111111
  lightBg: [250, 249, 245], // #faf9f5 (ivory)
  clay: [217, 119, 87], // #d97757
});

const skLuma = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function skIsDark(rgba) {
  return skLuma(rgba) < 128;
}

const skCss = ([r, g, b, a = 1]) =>
  a >= 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${Number(a.toFixed(3))})`;

function skToHsl([r, g, b]) {
  [r, g, b] = [r / 255, g / 255, b / 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h =
    max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

function skFromHsl([h, s, l]) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
      : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r, g, b].map((v) => Math.round((v + m) * 255));
}

// Maps one of ChatGPT's colors to its Claude counterpart, or null to keep it.
//  - the page background -> Claude's background
//  - neutral grays       -> Claude's warm grays (white text becomes ivory)
//  - blue accents        -> Claude's clay orange, same lightness
//  - anything else (errors, success, warnings) is left alone
function skClaudeColor(rgba, { pageBg, dark }) {
  const [r, g, b, a = 1] = rgba;
  const same = (x, y) => x.slice(0, 3).every((v, i) => Math.abs(v - y[i]) <= 1);
  if (a >= 1 && same(rgba, pageBg)) return skCss(dark ? SK_CLAUDE.darkBg : SK_CLAUDE.lightBg);

  if (Math.max(r, g, b) - Math.min(r, g, b) <= 4) {
    const l = (r + g + b) / 3;
    return skCss([l * 0.985, l * 0.975, l * 0.945].map(Math.round).concat(a));
  }

  const [h, s, l] = skToHsl(rgba);
  if (h >= 195 && h <= 260 && s > 0.3) {
    const [clayH, clayS] = skToHsl(SK_CLAUDE.clay);
    return skCss([...skFromHsl([clayH, Math.min(s, clayS), l]), a]);
  }
  return null;
}

// [[name, rgba]] -> [[name, css]] for every variable that should change.
function skClaudePalette(vars, pageBg) {
  const dark = skIsDark(pageBg);
  return vars
    .map(([name, rgba]) => [name, skClaudeColor(rgba, { pageBg, dark })])
    .filter(([, css]) => css);
}

(() => {
  const html = document.documentElement;
  const style = document.createElement("style");
  style.id = "sk-claude-theme";
  let enabled = false;
  let pending = 0;

  // Any CSS color (oklch, color-mix, ...) -> [r, g, b, a] in sRGB.
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const toRgba = (value) => {
    ctx.fillStyle = "#010203";
    ctx.fillStyle = value;
    if (ctx.fillStyle === "#010203" && value !== "#010203") return null;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };

  // ChatGPT's CSS variable names are hashed and change between deploys, so we
  // read every color variable and decide by value.
  const colorVars = (computed) => {
    const vars = [];
    for (const name of computed) {
      if (!name.startsWith("--")) continue;
      const value = computed.getPropertyValue(name).trim();
      if (!value || value.includes("var(") || /^-?[\d.]+(px|rem|em|%|ms|s)?$/.test(value)) continue;
      const rgba = toRgba(value);
      if (rgba) vars.push([name, rgba]);
    }
    return vars;
  };

  function update() {
    pending = 0;
    style.remove(); // measure ChatGPT's own colors, without our override
    if (!enabled || !document.body) return;

    const computed = getComputedStyle(document.body);
    const pageBg = toRgba(computed.backgroundColor);
    if (!pageBg || pageBg[3] < 1) return;

    const bg = skCss(skIsDark(pageBg) ? SK_CLAUDE.darkBg : SK_CLAUDE.lightBg);
    const clay = skCss(SK_CLAUDE.clay);
    const decls = skClaudePalette(colorVars(computed), pageBg)
      .map(([name, css]) => `${name}: ${css} !important;`)
      .join(" ");

    // ChatGPT redefines its variables below :root (e.g. on <body>), hence `*`.
    style.textContent = `
      html.sk-claude-theme, html.sk-claude-theme * { ${decls} }
      html.sk-claude-theme, html.sk-claude-theme body, html.sk-claude-theme main { background-color: ${bg} !important; }
      html.sk-claude-theme { caret-color: ${clay}; }
      html.sk-claude-theme ::selection { background-color: ${skCss([...SK_CLAUDE.clay, 0.35])}; }
    `;
    (document.head ?? html).append(style);
  }

  const schedule = () => {
    if (!pending) pending = setTimeout(update, 50);
  };

  skWatchSetting("chatgptClaudeTheme", "sk-claude-theme", (on) => {
    enabled = on;
    schedule();
  });

  // Re-measure when the theme flips or new stylesheets arrive.
  const watch = () => {
    const isOurs = (r) =>
      r.type === "childList" && [...r.addedNodes, ...r.removedNodes].every((n) => n === style);
    const observer = new MutationObserver((records) => {
      if (!records.every(isOurs)) schedule();
    });
    observer.observe(html, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    if (document.head) observer.observe(document.head, { childList: true });
    schedule();
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", watch, { once: true });
  } else {
    watch();
  }
  window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener("change", schedule);
  window.addEventListener("load", schedule);
})();
