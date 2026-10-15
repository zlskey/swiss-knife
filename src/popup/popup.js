/* global SK_FEATURES, SK_DEFAULTS */

const list = document.getElementById("features");
const template = document.getElementById("feature-template");
const summary = document.getElementById("summary");
const state = { ...SK_DEFAULTS };

document.getElementById("version").textContent = `v${browser.runtime.getManifest().version}`;

function renderSummary() {
  const on = SK_FEATURES.filter((f) => state[f.key]).length;
  summary.textContent = `${on} of ${SK_FEATURES.length} tools on`;
  summary.parentElement.classList.toggle("status--active", on > 0);
}

async function init() {
  Object.assign(state, await browser.storage.local.get(SK_DEFAULTS));

  for (const feature of SK_FEATURES) {
    const node = template.content.firstElementChild.cloneNode(true);
    node.classList.add(`feature--${feature.accent}`);
    node.querySelector(".feature__site").textContent = feature.site;
    node.querySelector(".feature__title").textContent = feature.title;
    node.querySelector(".feature__desc").textContent = feature.description;

    const toggle = node.querySelector(".switch");
    toggle.checked = Boolean(state[feature.key]);
    toggle.addEventListener("change", () => {
      state[feature.key] = toggle.checked;
      browser.storage.local.set({ [feature.key]: toggle.checked });
      renderSummary();
    });

    list.append(node);
  }

  renderSummary();
}

init();
