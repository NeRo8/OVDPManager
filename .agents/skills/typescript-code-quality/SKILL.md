---
name: typescript-code-quality
description: Apply KISS, DRY, YAGNI, and clean code when implementing, refactoring, or reviewing TypeScript or TSX. Use for maintainability decisions in existing code; skip pure documentation and unrelated languages.
---

# TypeScript code quality

Use this skill to make the smallest maintainable change that satisfies the user's request. Read the affected code, its callers, and local project instructions before choosing a design. Preserve existing behavior and public contracts unless the task calls for a change.

## Make design choices

- **KISS:** Prefer direct control flow and a small number of concepts. Add layers, classes, factories, or generic types only when they make a concrete requirement easier to express or verify. Clarity matters more than fewer lines.
- **DRY:** Share a rule when multiple places must stay in sync, such as the same domain calculation or validation. Do not extract an abstraction just because two blocks look alike. Keep code local when the cases have different meanings or are likely to change independently.
- **YAGNI:** Implement current requirements. Avoid speculative options, extension points, compatibility paths, and dependencies. If a future need is uncertain, leave the code simple enough to change later.
- **Clean code:** Use names that describe domain meaning and observable behavior. Keep functions and modules cohesive. Make types precise at module and data boundaries; avoid `any`, unchecked casts, and hidden side effects. Handle errors where recovery or a useful message is possible.

For TypeScript, model real states with existing domain types or narrow unions. Use generics only when callers genuinely vary by type. Keep one authoritative definition for a data shape; derive related types from an existing schema or type when that is clearer than maintaining copies. Validate untrusted data at runtime, because static types do not check incoming values.

## Apply the principles

1. Identify the behavior that must be preserved or added, then inspect nearby conventions and call sites.
2. Choose the simplest design that meets that behavior. Explain a new abstraction by the shared rule it owns, not by reduced duplication alone.
3. Keep the edit within the requested scope. Follow repository architecture, formatting, and dependency rules when they are more specific.
4. Verify with the relevant existing checks and tests. Add tests for meaningful behavior or regression risk, not for implementation shape.

For a code review, report concrete findings with file locations and impact. Avoid style-only refactors unless they resolve a real maintenance problem or the user explicitly asks for them.
