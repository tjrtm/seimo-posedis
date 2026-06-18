# Posėdis — The Parliament Simulator

### Generate a full, realistic Lithuanian Seimas plenary session — speeches, factions, votes, voices and all — from a single question.

---

## What it is

**Posėdis** (Lithuanian for *"the sitting / parliamentary session"*) is an AI-driven simulator of the
Lithuanian Parliament — the **Seimas**. You type a topic, choose a language, and the system
generates an entire plenary debate: an opening by the session chair, a ministry briefing, party-group
speeches, cross-examination, a recess, the final debate and a closing — performed by the **full roster of
141 named Members of Parliament**, each speaking in character according to their real faction, expertise
and political incentives.

The result is not a single blob of text. It is a **structured, time-stamped broadcast** of 50–60 events
that plays back in an LRT-style live-stream interface, complete with a scrubber timeline, an agenda
sidebar, per-speaker voices, and an optional WebGL animated speaking face. Sessions can be narrated aloud,
archived to disk as JSON, and replayed later.

Everything runs **local-first**: in its default mode no data leaves your machine.

---

## Why it matters

Public deliberation is expensive to rehearse. Communications teams, policy units, civic-education
programmes and researchers all face the same problem: you cannot easily *dry-run* a parliamentary debate
before it happens. Posędis turns that into a few minutes of compute.

- **Communications & public affairs** — pressure-test a message before a real session. See how each
  faction is likely to frame an issue, what counter-arguments surface, and where the vote lands.
- **Policy & research** — stress a proposal against 141 distinct viewpoints and generate transcript-grade
  material for analysis, summarisation or training data.
- **Civic education & journalism** — show students and audiences *how* parliament actually works: agenda,
  procedure, party speeches, cross-examination and the path to a vote — using real names and real factions.
- **Product & AI demos** — a self-contained, visually rich showcase of structured LLM output, local
  text-to-speech, and real-time playback that runs without any cloud account at all.

---

## Key features

### 🏛️ The full Seimas — 141 members
Every one of the 141 Members of the 2024–2028 Seimas is modelled with an individual profile: a personality
brief, explicit **goals**, **abilities** and **constraints**, and their real party. Factions include
**LSDP, TS-LKD, Nemuno aušra, DSVL, Liberalai, LVŽS, LLRA-KŠS** and more. Speeches are written *from* each
member's ideology, so a constitutional-law expert argues differently than an environmental activist or an
interior minister. A searchable member modal exposes every profile.

### 🤖 Dual generation engine — local or cloud
Posędis is provider-agnostic by design:
- **Local mode** routes transcript generation to your own **Ollama** server (e.g. `llama3.1:70b`) and
  synthesises voices through a local **Speaches** TTS server. No cloud, no per-token cost, nothing leaves
  the device.
- **Cloud mode** uses **OpenAI GPT-5-mini** for maximally detailed transcripts and **gpt-4o-mini-tts**
  for voices, with no local setup required.

The same topic, language and audio settings drive both paths — you switch with one toggle.

### 🗳️ Transparent recorded votes
Following the **Statute of the Seimas**, every session is required to reach a vote — and that vote is
fully transparent to the viewer. A first-class `vote` event records the question put to the chamber, the
**procedure** (open roll-call via the electronic system, or secret ballot), the number of **registered
members against the quorum** (at least 71 of 141), the exact **Už / Prieš / Susilaikė** (For / Against /
Abstained) counts, and the **result** decided by majority. The broadcast stage renders this as a public
**vote report** (*balsavimo protokolas*): a colour-coded tally, a pass/fail badge, a quorum check that
turns red when quorum is not met, a **per-faction breakdown** whose columns reconcile with the totals, and
a list of MPs who **broke from their faction line**. Counts and the outcome are self-consistent by
construction — the engine recomputes totals, quorum and result so the published report can be trusted.

### 📜 Structured, broadcast-grade transcripts
Each session is emitted as structured JSON: a title, topic, total event count, duration, and an ordered
list of events with `time`, `timestamp`, `type`, `speaker`, `party`, `title` and `text`. Speeches run
150–400 words with real arguments, statistics and international comparisons — not filler.

### 📺 Live-stream playback
A faithful, LRT-style broadcast stage plays the session back in real time: current-speaker card, agenda
tracker, progress bar, an interactive scrubber timeline, and **variable playback speed from 0.25× to 10×**
including slow motion. Pause, restart, or skip to the next speaker.

### 🔊 Per-member voices & a speaking face
With TTS enabled, every speaker is assigned a **distinct voice** (Kokoro voices such as `af_heart`,
`am_echo`, `bf_emma` locally, or OpenAI voices in the cloud) with per-speaker rate tuning. Audio can be
written alongside the session in `mp3`, `wav` or `ogg`. An optional **Three.js WebGL animated face**
provides lip-sync, eye-blinking and head movement driven by the audio, with a graceful 2D fallback.

### 🌐 Bilingual
A single switch generates the entire session — speeches, summaries and resolutions — in **Lithuanian
(default)** or **English**. The choice is remembered between visits and applies to prompts, system
instructions and live updates alike.

### 💾 Session archiving & replay
Generated transcripts auto-save to a `sessions/` folder via a small Node API (`POST /api/sessions`), or
download as JSON / write to a chosen folder through the browser **File System Access API**. Saved sessions
can be reloaded and replayed later, building a chronological archive of debates.

### 🌓 Modern, accessible UI
A professional dark, corporate React interface with clear mode cards, segmented controls and contextual
status badges — built so a stakeholder demo works without extra configuration.

---

## How it works

1. **Choose a topic and language** in the setup panel.
2. **Pick a mode** — local (Ollama + Speaches) or cloud (OpenAI) — and point it at your servers / key.
3. **Generate.** The engine builds a parliamentary agenda and prompts the model to produce in-character,
   structured events for the relevant members across the full session arc.
4. **Watch it live.** The broadcast stage plays the debate back with voices, timeline and the optional
   animated face.
5. **Archive & replay.** The session is saved as JSON (and optional audio) for later analysis or playback.

---

## Architecture at a glance

- **UI** — React 19 + Vite single-page app (`src/App.jsx`), dark corporate styling.
- **Engine** — a dependency-free vanilla-JS simulation controller (`public/legacy/seimas_stream_enhanced.js`)
  handling prompting, timeline, playback, TTS orchestration and storage, shared by the UI and the Node
  archiving API.
- **Data** — all 141 member profiles embedded for offline use (`seimas_members_data.js`) plus Markdown
  profiles under `seimas/`.
- **Voice & face** — Speaches/OpenAI TTS with per-speaker voice mapping; an optional Three.js animated
  face (`animated_face.js`).
- **Privacy** — local-first; API keys stay in the browser, outputs stay in local storage or `sessions/`.

---

## Why it's different

Most "AI debate" demos generate one wall of text from one prompt. Posędis models a **whole institution** —
141 distinct actors, real factions, real procedure — and delivers the result as a **playable, voiced,
archivable broadcast** that runs entirely on your own hardware if you want it to. It is equal parts
deliberation sandbox, communications rehearsal tool, civic-education instrument and a polished reference
implementation of structured LLM output with local text-to-speech.

> *Type a question. Convene a parliament. Watch the debate unfold.*
