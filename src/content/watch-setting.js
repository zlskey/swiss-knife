/* global SK_DEFAULTS */
/* exported skWatchSetting */

// Calls `onChange(enabled)` with the stored value of `key` now and on every
// change, and mirrors it as `className` on <html> so CSS can react to it.
function skWatchSetting(key, className, onChange = () => {}) {
  const root = document.documentElement;
  const apply = (value) => {
    const enabled = Boolean(value);
    root.classList.toggle(className, enabled);
    onChange(enabled);
  };

  browser.storage.local
    .get({ [key]: SK_DEFAULTS[key] })
    .then((stored) => apply(stored[key]));

  browser.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && key in changes) apply(changes[key].newValue);
  });
}
