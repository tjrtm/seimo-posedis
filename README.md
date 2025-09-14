# BMAD Debate Party Mode

This package contains a minimal **BMAD‑METHOD** setup tailored for **debate simulation** in **Codex CLI**:

- `AGENTS.md` — instructions for Codex
- `bmad-core/agents/*.md` — Agent‑as‑Code definitions
- `bmad-core/debate-format.md` — Oxford‑style format

## Run (example)

```bash
codex
# then paste:
# Read AGENTS.md. Use the BMAD Debate Orchestrator and load all agents in ./bmad-core/agents.
# Then run party mode as:
*party-mode topic="The moon should be colonized in this century." format="oxford" rounds=2 opening_minutes=2 rebuttal_minutes=1 closing_minutes=1 transcript_out="debate-transcript.md"
```

> Tip: If Codex doesn’t read `AGENTS.md` automatically, ask it explicitly to do so first.
