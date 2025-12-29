---
description: 'This rule provides how cursor agent to work in the project'
alwaysApply: true
---

# Rule: Incremental Commits with Human Review

## Core Principle

**Every meaningful change MUST be small, isolated, and committed separately.**
The project advances through **many small, reviewable steps**, not large opaque changes.

Progress must be:

- Incremental
- Traceable
- Review-friendly
- Human-approved

## Commit Granularity Rules

### ✅ One Logical Change = One Commit

Each commit MUST represent **exactly one** of the following:

- One feature slice
- One behavior change
- One refactor step
- One bug fix
- One structural adjustment
- One test addition or update

### ❌ Forbidden Commit Patterns

- Mixing multiple features in one commit
- Feature + refactor combined
- Refactor + formatting combined
- Large “cleanup” commits
- “WIP”, “temp”, or “misc” commits

> If a commit message needs “and”, it is already too big.

## Step-by-Step Development Policy

### ✅ Decompose Before Implementing

Before implementing a feature:

- Break it down into **minimal executable steps**
- Each step must be independently commit-able
- Each step must keep the project in a working state

Allowed examples:

- Introduce type / interface
- Add stub implementation
- Wire dependency
- Enable logic
- Add validation
- Add tests

### ❌ No Big Bang Changes

- Do NOT implement full features in one commit
- Do NOT refactor entire subsystems at once
- Do NOT touch unrelated files “while you’re here”

> Large changes must be decomposed into a **sequence of safe commits**.

## Human Review Is Mandatory

### ✅ Pause for Review

After **each meaningful commit**:

- Stop further changes
- Wait for explicit human approval
- Continue only after confirmation

### ❌ No Autonomous Commit Chains

- Do NOT assume approval
- Do NOT stack commits without review
- Do NOT “finish everything first”

> The AI does not decide when a step is “good enough” — the human does.

## Commit Message Standards

### Required Format

Commit messages MUST:

- Be imperative
- Describe intent, not mechanics
- Reflect the _smallest possible scope_

Examples:

- `add user domain model`
- `introduce config loader`
- `wire http handler`
- `validate input schema`
- `remove unused legacy path`

### ❌ Forbidden Messages

- `update code`
- `fix stuff`
- `refactor`
- `cleanup`
- `final`
- `WIP`

## Traceability & Progress Visibility

### ✅ Every Commit Must Answer

Each commit should clearly answer:

- What changed?
- Why now?
- What new capability exists after this commit?

If this is not obvious from:

- the diff
- the commit message

Then the commit is invalid.

## How to Respond as an AI Assistant

When generating or modifying code:

- Proactively suggest splitting work into commits
- Stop after completing **one commit-sized step**
- Ask for review/confirmation before proceeding
- Never batch multiple logical steps together

If a request is large:

- Propose a commit plan
- Implement **only the first step**
- Wait for approval

## Philosophy

> Software is built through decisions, not diffs.
> Small commits make decisions visible.

This project values:

- Auditability over speed
- Intent over volume
- Review over automation

If a change cannot be easily reviewed,
**it is too large to be committed.**
