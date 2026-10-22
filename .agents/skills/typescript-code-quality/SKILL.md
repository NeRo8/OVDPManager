---
name: typescript-code-quality
description: Apply KISS, DRY, YAGNI, and clean code when implementing, refactoring, or reviewing TypeScript or TSX. Use for maintainability decisions in existing code; skip pure documentation and unrelated languages.
---

# TypeScript code quality

Use this skill to make the smallest maintainable change that satisfies the user's request. Read the affected code, its callers, and local project instructions before choosing a design. Preserve existing behavior and public contracts unless the task calls for a change. Treat the [Clean Code TypeScript guide](https://github.com/labs42io/clean-code-typescript) and [KISS in TypeScript article](https://thiraphat-ps-dev.medium.com/the-kiss-principle-in-typescript-keep-it-simple-stupid-86a49d77f069) as sources of judgment, not checklists; project conventions and concrete requirements take precedence.

## Make design choices

- **KISS:** Start with readable names, direct control flow, and a small number of concepts. Use built-in JavaScript or TypeScript operations when they make intent clearer; a straightforward loop may be clearer than a chain of array methods. Use early returns or named intermediate values to simplify deeply nested branches. Keep functions focused, and extract helpers when they make a task easier to follow. Add layers, classes, factories, or generic types only when they help express or verify a concrete requirement. Optimize for a measured bottleneck or a known constraint, and preserve clarity elsewhere.
- **DRY:** Share a rule when multiple places must stay in sync, such as the same domain calculation or validation. Do not extract an abstraction just because two blocks look alike. Keep code local when the cases have different meanings or are likely to change independently.
- **YAGNI:** Implement current requirements. Avoid speculative options, extension points, compatibility paths, and dependencies. If a future need is uncertain, leave the code simple enough to change later.

## Apply Clean Code to TypeScript

- Use one vocabulary for the same domain concept. Prefer searchable names and named constants when a value's meaning is not obvious. Do not add redundant context already supplied by the type or module.
- Keep a function focused on one observable task. A boolean parameter that selects different operations can signal two functions; several related arguments can justify a named options type. Neither is a rule to split a clear function or wrap a short parameter list.
- Prefer nonmutating data flow when callers may share an object or array. Keep writes to storage, network, or shared state explicit at the boundary that owns them. Use `readonly` where it prevents a real accidental mutation.
- Use precise TypeScript types to express valid states. Derive related types from an authoritative schema or type when clearer than maintaining copies. Use generics only when callers genuinely vary by type; avoid `any` and unchecked casts. Validate untrusted input at runtime because static types cannot. Choose a union, object, or class that fits the domain; do not introduce enums, inheritance, getters, or dependency injection to satisfy a pattern.
- Prefer `async`/`await` when it clarifies sequential work. Throw `Error` objects, handle rejected promises, and make caught errors lead to recovery or a useful message. A deliberate fallback may ignore an error when its reason is clear from the code.
- Make code and names explain _what_ happens; use comments for _why_, non-obvious constraints, and external contracts. Remove dead or commented-out code. Follow the repository's formatter and lint rules instead of inventing formatting rules.
- Test behavior and meaningful edge cases with focused, independent tests when regression risk warrants them. Do not add tests for coverage targets or to mirror implementation details.

## Apply the principles

1. Identify the behavior that must be preserved or added, then inspect nearby conventions and call sites.
2. Choose the simplest design that meets that behavior. Explain a new abstraction by the shared rule it owns, not by reduced duplication alone.
3. Keep the edit within the requested scope. Follow repository architecture, formatting, and dependency rules when they are more specific.
4. Verify with the relevant existing checks and tests. Add tests for meaningful behavior or regression risk, not for implementation shape.

For a code review, report concrete findings with file locations and impact. Avoid style-only refactors unless they resolve a real maintenance problem or the user explicitly asks for them.
