---
description: 'This rule provides standards for refactoring code to jump the project version'
alwaysApply: true
---

# Rule: No Backwards Compatibility

## Core Principle

This codebase **does not support backward compatibility**.

All code MUST target:

- The **current architecture**
- The **latest agreed runtime versions**
- The **current public API contract**

Any logic written solely to preserve behavior for older versions, legacy consumers, deprecated APIs, or historical edge cases is **strictly forbidden**.

## Hard Prohibitions (Must NOT Do)

The following patterns are **not allowed** under any circumstances:

### ❌ Version-Conditional Logic

- Do NOT check runtime versions to branch behavior
  (e.g. `if (version < X)`, `switch(apiVersion)`, `legacyMode`, `isOldClient`)
- Do NOT support multiple protocol versions simultaneously
- Do NOT introduce feature flags solely for backward compatibility

### ❌ Legacy Code Paths

- Do NOT keep old implementations alongside new ones
- Do NOT add fallback logic to preserve old behavior
- Do NOT leave “temporary” compatibility code
- Do NOT keep deprecated interfaces alive

> If a behavior changes, the old behavior is removed completely.

### ❌ Compatibility Layers & Shims

- Do NOT introduce adapters, polyfills, shims, or translation layers
- Do NOT normalize old data formats to new ones at runtime
- Do NOT silently transform legacy inputs

### ❌ Defensive Compatibility Coding

- Do NOT add extra branches like:
  - `if (!newField) { useOldField }`
  - `try newLogic catch oldLogic`
- Do NOT attempt to “handle both”
- Do NOT write code whose only purpose is “not breaking existing users”

## Required Behavior (Must Do)

### ✅ Break Cleanly

- If an API, schema, or behavior changes:
  - Update the contract
  - Update all call sites
  - Remove the old behavior entirely
- Breaking changes are **intentional and acceptable**

### ✅ Fail Fast and Loud

- Prefer explicit errors over silent fallback
- Invalid or outdated input MUST:
  - Throw
  - Reject
  - Crash fast during development
- Error messages should clearly state the expected new format

### ✅ Single Source of Truth

- There must be **one correct way** to do something
- No parallel implementations
- No duplicated logic for different “eras” of the system

## Migration Policy

### Allowed

- One-time **offline migration scripts**
- Manual data migrations
- Explicit major version bumps

### Forbidden

- Runtime migrations
- Automatic compatibility conversion in production code
- Hidden upgrade logic

> Migration is a **process**, not a **feature**.

## How to Respond as an AI Assistant

When modifying or generating code:

- DO NOT ask:
  - “Should we keep compatibility?”
  - “Do we need to support old behavior?”
- DO NOT suggest compatibility approaches
- DO NOT preserve deprecated logic

Instead:

- Assume all consumers will update
- Rewrite code cleanly against the new model
- Remove outdated patterns entirely

## Philosophy

> Backward compatibility is a form of technical debt.
> This project chooses **clarity, correctness, and evolution** over preservation.

If maintaining backward compatibility would:

- Increase complexity
- Introduce branching logic
- Obscure the true model

**Then it must be removed.**
