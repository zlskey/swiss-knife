# SwissKnife

A pocket multitool for your browser: a growing set of small, unrelated tweaks that make everyday sites a bit nicer.

| Tool | Site | What it does |
| --- | --- | --- |
| Hide YouTube Shorts | youtube.com | Hides Shorts shelves, feed items, tabs and nav entries; opens `/shorts/<id>` as `/watch?v=<id>` |
| Claude colors on ChatGPT | chatgpt.com | Repaints ChatGPT in Claude's palette: `#111111` background, warm grays, ivory text, clay accents |

Toggle each one from the toolbar popup.

## Development

```bash
npm install
npm start        # launches Firefox with the extension loaded
npm test         # node:test unit tests
npm run lint     # ESLint + web-ext lint (warnings are errors)
npm run build    # unsigned zip in web-ext-artifacts/
```

Adding a tool: register it in `src/shared/settings.js` (it shows up in the popup automatically), then add a content script that calls `skWatchSetting(key, className)` and CSS scoped under that class.

## Releasing

CI (`.github/workflows/ci.yml`) lints, tests and builds on every push and PR.

Releases are cut by the manually triggered **Release** workflow (`.github/workflows/release.yml`). Run it from the Actions tab on `main` and pick a `patch`, `minor` or `major` bump (or type an exact version). It:

1. lints and tests,
2. bumps the version in `package.json`, `package-lock.json` and `src/manifest.json`,
3. moves the **Unreleased** section of `CHANGELOG.md` under the new version,
4. signs and submits the extension to addons.mozilla.org, using that section as the release notes,
5. commits, tags `vX.Y.Z`, pushes to `main`, and creates a GitHub release with the zip attached.

Log changes under **Unreleased** in `CHANGELOG.md` as you make them; the workflow refuses to release with an empty section.

One-time setup:

1. Create AMO API credentials at https://addons.mozilla.org/developers/addon/api/key/.
2. In the GitHub repo, create an environment named `amo` with secrets `AMO_JWT_ISSUER` and `AMO_JWT_SECRET`.
3. If `main` is branch-protected, allow GitHub Actions to push to it (or the release commit will be rejected).
