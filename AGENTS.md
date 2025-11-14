# Repository Guidelines

## Project Structure & Module Organization
- `seimas_live_stream_enhanced.html` – primary UI and controls.
- `seimas_stream_enhanced.js` – core simulation, AI integration, timeline, storage.
- `animated_face.js` – optional speaking face animation.
- `seimas_members_data.js` – embedded member metadata for offline use.
- `seimas/` – 141 member profiles as Markdown (`First_Lastname-####.md`).
- `sessions/` – generated transcripts (JSON); kept empty by default (`.gitkeep`).
- `test_members.html` – quick manual verification of member data rendering.
- `README.md` and other docs – product overview and usage.

## Build, Test, and Development Commands
- Serve locally (no build step): `python3 -m http.server 8000`
  - Open `http://localhost:8000/seimas_live_stream_enhanced.html` in a browser.
- Quick data check: open `test_members.html` and confirm grid renders without console errors.
- Optional: open the HTML file directly, but a local server is recommended for File System API features.

## Coding Style & Naming Conventions
- JavaScript: 4‑space indentation, single quotes, semicolons, ES6 classes.
- Keep modules dependency‑free (vanilla JS, no bundlers).
- Filenames: snake_case for JS/HTML; member profiles keep Lithuanian diacritics and use `First_Lastname-####.md`.
- Prefer small, focused methods; document non‑obvious logic with brief comments.

## Testing Guidelines
- Manual verification in modern Chromium/Firefox:
  - Playback controls, timeline updates, and speaker info update correctly.
  - Transcript generation flow works with an API key and saves to `sessions/` when permitted.
  - No errors in DevTools console.
- Use `test_members.html` to validate member data loads and UI renders.

## Commit & Pull Request Guidelines
- Commits: imperative present; concise subject (<72 chars). Use type prefixes when helpful (e.g., `feat:`, `fix:`, `docs:`). Example: `fix: handle missing Three.js dependency`.
- PRs: clear description, scope, testing steps, and before/after notes. Link related issues. Include screenshots/GIFs for UI changes.
- Do not commit large generated session JSON by default; include small, representative samples only when necessary.

## Security & Configuration Tips
- Never commit API keys. Enter keys via the UI; storage remains local.
- Keep assets local; avoid adding external network calls.
- If adding new data files, prefer JSON/MD under `seimas/` or `sessions/` with clear naming.
