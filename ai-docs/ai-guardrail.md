# AI Guardrail

1. AI loves deeply nested conditionals and early-exit chains. Ask it explicitly to flatten the logic — one level deep where possible. If the generated function has more than two levels of nesting, push back.
2. AI-generated polling loops, retry logic, and recursive crawlers routinely lack caps. Always ask: what is the maximum number of times this runs, and what happens when we hit it?
3. AI-generated code opens database connections and file handles without cleanup, especially in error branches. Follow the code through every exit path and confirm it closes what it opened.
4. AI generates monolithic functions that do many things at once because it’s optimizing for task completion, not maintainability. Set a hard line before you prompt: no function longer than 40–60 lines. Ask for decomposition upfront, not as a refactoring afterthought.
5. AI-generated code skips validation almost universally. Prompt explicitly: add assertions for expected preconditions before this runs, and postconditions after. Make the assumptions visible and loud.
6. AI routinely generates empty catch blocks and unchecked return values. Enforce one rule with no exceptions: every error must be logged, raised, or explicitly returned. Nothing gets swallowed. Ever.
7. AI leans on class-level state and module-level globals because they’re easier to generate. Ask it to scope state locally and pass dependencies explicitly — make the data flow visible at every call site.
8. AI buries writes and API calls inside what appear to be utility functions. Ask for a clear structural separation between pure computation and side-effectful operations. The dangerous stuff should be visible, named, and obvious.
9. AI stacks abstractions eagerly. After every generation, ask: can this be written more directly? Favour composition you can read linearly over elegance you have to decode. When something breaks at 2am, you want to be able to read the code.
10. AI-generated code almost never sets up linting or static analysis. These must be part of your project scaffold — wired into CI, configured to fail the build on violations. Set them up before the AI starts writing code, not after.
11. Never commit code you haven’t read in full. You are still the engineer of record. The AI has no skin in the game.
12. AI optimizes for the happy path. Tests force it to reason about edge cases and failure modes — which is exactly where AI-generated code tends to be weakest.
