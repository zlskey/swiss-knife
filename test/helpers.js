import { readFileSync } from "node:fs";
import vm from "node:vm";

const SRC = new URL("../src/", import.meta.url);

export const readSrc = (path) => readFileSync(new URL(path, SRC), "utf8");

// Fake `browser.storage` with a working onChanged event.
export function createBrowser(initial = {}) {
  const data = { ...initial };
  const listeners = [];
  return {
    data,
    storage: {
      local: {
        async get(defaults) {
          return { ...defaults, ...data };
        },
        async set(values) {
          const changes = {};
          for (const [key, newValue] of Object.entries(values)) {
            changes[key] = { oldValue: data[key], newValue };
            data[key] = newValue;
          }
          listeners.forEach((fn) => fn(changes, "local"));
        },
      },
      onChanged: { addListener: (fn) => listeners.push(fn) },
    },
  };
}

// Runs extension scripts (in manifest order) in one sandboxed "page".
export function loadScripts(files, { href = "https://www.youtube.com/", storage = {} } = {}) {
  const classes = new Set();
  const listeners = {};
  const location = {
    href,
    replaced: null,
    replace(url) {
      this.replaced = url;
    },
  };
  const target = {
    addEventListener: (type, fn) => (listeners[type] ??= []).push(fn),
  };
  const browser = createBrowser(storage);
  const context = vm.createContext({
    URL,
    browser,
    location,
    setTimeout,
    MutationObserver: class {
      observe() {}
    },
    window: target,
    document: {
      ...target,
      readyState: "loading",
      createElement: () => ({ style: {}, remove() {}, getContext: () => null }),
      documentElement: {
        classList: {
          contains: (c) => classes.has(c),
          toggle: (c, force) => (force ? classes.add(c) : classes.delete(c), force),
        },
      },
    },
  });
  for (const file of files) vm.runInContext(readSrc(file), context, { filename: file });
  return {
    browser,
    classes,
    location,
    dispatch: (type) => listeners[type]?.forEach((fn) => fn()),
    run: (code) => vm.runInContext(code, context),
  };
}

export const flush = () => new Promise((resolve) => setImmediate(resolve));
