---
name: brainstorming
description: "Use this before any creative or design work in this project - adding a feature, changing behavior, or shaping a new part of the app. Turns a raw idea into a clarified, approved design through clarifying questions and conversation, before any spec is written or any code is touched. Trigger this whenever the user proposes a new feature, asks 'how should we build X', or describes something to add/change and hasn't yet agreed on an approach."
---

# Brainstorming

Turn an idea into a clarified, approved design through conversation — before writing a spec or touching code.

This project's workflow is: brainstorm (this skill) → spec (`docs/`) → implementation (TDD) → verification → commit. This skill covers only the first step. Writing the spec file and planning implementation are out of scope here — they happen after this skill's approval gate.

<HARD-GATE>
Do NOT invoke any implementation skill, write any code, write a spec file, or take any implementation action until you have told your human partner what you intend and they have explicitly approved it.
</HARD-GATE>

## Anti-Pattern: "Too Simple To Need Approval"

Every brainstorm ends with the human partner approving the design before anything else happens. For a small change the design might be two sentences in chat — but you must still present it and get a yes. "Simple" changes the size of the design, never whether approval is needed.

| Thought | Reality |
|---------|---------|
| "This is too simple to need a design" | Simple means a short design, not no design. |
| "The design is obvious — I'll start while they read it" | Present, then stop. Don't act until you hear yes. |
| "They approved something similar before" | Each idea gets its own approval. |
| "They said 'go ahead' / 'sure, do it' — I can also draft the spec while I'm at it" | Approving the design isn't approval to skip the next checkpoint. Announce the next step and stop — don't bundle it into the same message. |

## The Process

1. **Explore project context** — check relevant files, docs, and recent commits before asking anything. Don't make the human repeat what's already visible in the repo.
2. **Ask clarifying questions, one at a time** — focus on purpose, constraints, and success criteria. Prefer multiple choice when a question has a natural small set of answers; open-ended is fine otherwise. One question per message — if a topic needs more exploration, split it into several questions rather than stacking them.
3. **Propose approaches** — once the shape of the idea is clear, offer 1-3 approaches with trade-offs. Lead with the one you'd recommend and say why. Cut anything not needed for the actual request (YAGNI) — a smaller design is easier to approve and easier to build.
4. **Present the design in chat** — a few sentences for something small, up to a couple of short paragraphs for something with more moving parts. Cover whatever is non-obvious: approach, what it touches, edge cases, how it'll be tested. For anything with multiple parts, check in after each part rather than dropping the whole design at once.
5. **Get explicit approval** — stop and wait for a clear yes. Presenting the design and moving on in the same breath skips the gate.

If new complexity turns up mid-conversation that changes the scope significantly, say so and re-confirm the design rather than quietly expanding it.

## Design for isolation and clarity

When the design involves more than one moving part, shape it so that:

- Each unit has one clear purpose and talks to the rest through a well-defined interface.
- For each unit you can answer: what does it do, how do you use it, what does it depend on?
- Someone could understand what a unit does without reading its internals, and you could change the internals without breaking whoever calls it.

Smaller, well-bounded units are also easier to reason about and edit reliably — if a proposed unit is growing a lot of responsibility, that's a signal to split it during the design, not after.

## Working in existing code

- Explore the current structure before proposing changes, and follow the patterns already in use.
- If existing code has a problem that genuinely affects the work at hand (a file that's grown too large, tangled responsibilities), it's fine to fold a targeted improvement into the design.
- Don't propose unrelated refactoring just because you're in the area — stay focused on what the current idea actually needs.

## After Approval

Once the human approves the design, stop. Tell them the design is approved and that the next step is writing the spec (`docs/`) — but don't write it yourself as part of this skill.

A short or casual approval ("go ahead", "sure", "do it") still counts as approving the design — it does not extend to drafting the spec in the same message. Name the next step and stop there, even if the user's tone suggests they're in a hurry.
