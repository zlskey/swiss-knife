// Prepares a release: bumps the version in package.json, package-lock.json and
// src/manifest.json, and moves the Unreleased changelog section under the new version.
//
//   node scripts/release.js <patch|minor|major|x.y.z> [notes-file]
//
// Prints the new version; writes the release notes to notes-file when given.

import { readFileSync, writeFileSync } from "node:fs";

const [spec, notesFile] = process.argv.slice(2);
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const write = (path, text) => writeFileSync(new URL(`../${path}`, import.meta.url), text);
const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const pkg = JSON.parse(read("package.json"));
const [major, minor, patch] = pkg.version.split(".").map(Number);
const version =
  { major: `${major + 1}.0.0`, minor: `${major}.${minor + 1}.0`, patch: `${major}.${minor}.${patch + 1}` }[spec] ??
  spec;
if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) fail(`Invalid version or bump: ${spec}`);

const changelog = read("CHANGELOG.md");
const heading = "## [Unreleased]";
const start = changelog.indexOf(heading);
if (start === -1) fail(`CHANGELOG.md has no "${heading}" section`);
const bodyStart = start + heading.length;
const next = changelog.indexOf("\n## ", bodyStart);
const notes = changelog.slice(bodyStart, next === -1 ? undefined : next).trim();
if (!notes) fail("The Unreleased section of CHANGELOG.md is empty; add entries before releasing");
if (changelog.includes(`## [${version}]`)) fail(`CHANGELOG.md already has a ${version} section`);

const date = new Date().toISOString().slice(0, 10);
write(
  "CHANGELOG.md",
  `${changelog.slice(0, bodyStart)}\n\n## [${version}] - ${date}\n\n${notes}\n${next === -1 ? "" : changelog.slice(next)}`,
);

// Edit the version lines in place so the rest of each file keeps its formatting.
const setVersion = (path, count) => {
  let left = count;
  const text = read(path).replace(/^(\s*"version": )"[^"]*"/gm, (match, prefix) =>
    left-- > 0 ? `${prefix}"${version}"` : match,
  );
  if (left > 0) fail(`Expected ${count} version field(s) in ${path}`);
  write(path, text);
};
setVersion("package.json", 1);
setVersion("package-lock.json", 2); // root and packages[""]
setVersion("src/manifest.json", 1);

if (notesFile) writeFileSync(notesFile, `${notes}\n`);
console.log(version);
