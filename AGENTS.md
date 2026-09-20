# AI Agent Instructions

This is an existing project.

The source code is the ultimate source of truth.

## Before Every Task

Before modifying anything:

1. Read `.ai/PROJECT_CONTEXT.md`
2. Read `.ai/CURRENT_STATE.md`
3. Read `.ai/ARCHITECTURE.md`
4. Read the relevant recent section of `.ai/CHANGELOG.md`
5. Read `.ai/DECISIONS.md` when architecture or technical decisions are involved
6. Read `.ai/TASK_HISTORY.md` when the task relates to previous work

Then inspect ONLY the source files relevant to the user's request.

Do NOT unnecessarily scan the entire repository again.

## Before Editing

Determine:

* Which files are relevant
* What existing implementation does
* What dependencies exist
* What could be affected
* Whether the requested change conflicts with existing architecture

Preserve existing functionality unless the user explicitly asks for a change.

## Editing Rules

* Make the smallest reasonable change.
* Do not rewrite unrelated code.
* Do not refactor unnecessarily.
* Do not introduce unnecessary dependencies.
* Do not delete working functionality.
* Follow the existing project's coding patterns.
* Reuse existing components/services/utilities when appropriate.

## After Every Meaningful Task

After completing a task:

1. Verify the implementation.
2. Run appropriate tests/build/lint commands when available.
3. Update `.ai/CURRENT_STATE.md`.
4. Add a concise entry to `.ai/CHANGELOG.md`.
5. Add the completed task to `.ai/TASK_HISTORY.md`.
6. Update `.ai/ARCHITECTURE.md` only if architecture changed.
7. Update `.ai/DECISIONS.md` only if an important technical decision was made.
8. Keep all memory files concise.

## Memory Rules

Never store:

* complete source code
* huge code blocks
* unnecessary implementation details
* temporary conversation information
* duplicated documentation

Store:

* project structure
* important files
* important architecture
* current state
* completed work
* important decisions
* known issues
* important constraints

## Conflict Rule

If an AI memory file conflicts with the actual source code:

The actual source code wins.

Inspect the source code and correct the outdated memory file.

## Efficiency Rule

The purpose of `.ai/` is to give future AI agents a compact understanding of the project so they can avoid repeatedly reading the entire codebase.

However, when implementing a change, the AI MUST still inspect the relevant actual source files.
