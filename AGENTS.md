# Repository Guidelines

## Project Structure & Module Organization
- `src/` (React) – primary UI, layout, and controls (`App.jsx`, hooks, styles).
- `public/legacy/seimas_stream_enhanced.js` – core simulation, AI integration, timeline, storage (shared by React + Node archyvas API).
- `public/legacy/animated_face.js` – optional speaking face animation (attached globally).
- `public/legacy/seimas_members_data.js` – embedded member metadata for offline use.
- `seimas/` – 141 member profiles as Markdown (`First_Lastname-####.md`).
- `sessions/` – generated transcripts (JSON); kept empty by default (`.gitkeep`).
- `README.md` and other docs – product overview and usage.

## Runtime Services & Build Commands
- **Web assets**: run `npm install && npm run dev` (Vite) and open `http://localhost:5173`. Production preview via `npm run preview`. Legacy HTML serving is no longer supported.
- **Local TTS**: start Speaches (`cd speaches && docker compose -f compose.cpu.yaml up speaches`). Configure `ALLOW_ORIGINS=["http://127.0.0.1:5500","http://localhost:8000"]` when serving via dev servers to avoid CORS blocks.
- **Model preparation**: download the Kokoro TTS model once (`uvx speaches-cli model download speaches-ai/Kokoro-82M-v1.0-ONNX`) or add aliases in `speaches/model_aliases.json`.
- Quick data check: load the React UI and open the member modal; `window.SEIMAS_MEMBERS_DATA` is injected via `public/legacy/seimas_members_data.js`.

- React/JSX: functional components with hooks, 4‑space indentation, single quotes, semicolons. Legacy controllers remain ES6 classes.
- Keep legacy modules dependency‑free (vanilla JS) but feel free to use React ecosystem inside `src/`.
- Filenames: snake_case for JS/HTML; member profiles keep Lithuanian diacritics and use `First_Lastname-####.md`.
- Prefer small, focused methods; document non‑obvious logic with brief comments.

## Localization Rules
- Session language toggle lives in the setup panel (`#sessionLanguageSelect`). Default is Lithuanian (`lt`); English (`en`) is optional.
- Language choice informs prompt scaffolding, OpenAI system instructions, live updates, and persists in `localStorage` (`seimas_session_language`).
- When adding content, ensure strings exist for both languages or clearly document if a feature remains Lithuanian-only.

## Generation Modes
- The UI exposes a two-option toggle (`#generationModeToggle`). `local` mode routes transcripts to Ollama (`http://localhost:11434/api/chat`) and uses Speaches for TTS. `remote` mode uses OpenAI GPT-5-mini + gpt-4o-mini-tts.
- Keep `this.generationMode` in sync with the toggle, persist via `seimas_generation_mode`, and update `this.currentTTSOptions` whenever the mode or TTS settings change.
- Local mode validation requires both `localOllamaBaseUrlInput` and `localOllamaModelInput`. Remote mode requires an OpenAI API key starting with `sk-`.
- When extending functionality, always add provider-aware copy (statuses, logs, docs) so we never assume Speaches or OpenAI is the only pipeline.

- Manual verification in modern Chromium/Firefox:
  - Playback controls, timeline updates, and speaker info update correctly.
  - Transcript generation flow works with an API key and saves to `sessions/` when permitted.
  - No errors in DevTools console.
- Use the React modal to validate member data loads and ensure `SEIMAS_MEMBERS_DATA` is attached before initialization.
- Local TTS smoke test: with Speaches running, enable the TTS checkbox, confirm POST `http://localhost:8000/v1/audio/speech` returns 200 and that generated audio plays in the timeline.

## Commit & Pull Request Guidelines
- Commits: imperative present; concise subject (<72 chars). Use type prefixes when helpful (e.g., `feat:`, `fix:`, `docs:`). Example: `fix: handle missing Three.js dependency`.
- PRs: clear description, scope, testing steps, and before/after notes. Link related issues. Include screenshots/GIFs for UI changes.
- Do not commit large generated session JSON by default; include small, representative samples only when necessary.

## Security & Configuration Tips
- Never commit API keys. Enter keys via the UI; storage remains local.
- Keep assets local; avoid adding external network calls.
- If adding new data files, prefer JSON/MD under `seimas/` or `sessions/` with clear naming.
- For Speaches deployments, keep `.env` out of source control. When exposing dev servers, prefer explicit `ALLOW_ORIGINS` rather than `"*"`, and document any additional ports stakeholders might hit.
