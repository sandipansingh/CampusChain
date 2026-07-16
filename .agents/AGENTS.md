# Agent Guidelines & Rules

All AI agents working on this project must adhere to the following rules and workflows:

## 1. Coding Standards (Clean Code)
- **Always use the `clean-code` skill** when writing or modifying any kind of code in this project.
- Follow the guidelines defined in [.agents/skills/clean-code/SKILL.md](file:///home/sandipansingh/Projects/CampusChain/.agents/skills/clean-code/SKILL.md) which includes:
  - Single Responsibility Principle (SRP)
  - Intention-revealing, clear naming conventions
  - Keeping functions/methods short and focused
  - Avoiding duplicate code (DRY)
  - Writing self-documenting code with meaningful comments where necessary
  - Implementing robust error handling
  - Running formatters and linters (`cargo fmt`, `cargo clippy`, `npm run lint`) before finalizing changes.

## 2. Iterative Development & Git Commits
- **Do NOT make a single giant commit** at the end of your task.
- **Commit incrementally and automatically** as you complete logical sub-steps or milestones of your task.
- Every git commit message **MUST** follow the Conventional Commits specification.
- Use the following rule to generate git commit messages:
  > **Commit Message Instruction:**
  > Generate Git commit messages using the Conventional Commits specification. Use one of: feat, fix, docs, style, refactor, perf, test, build, ci, chore, or revert. Format: <type>(<optional-scope>): <description>. Keep the subject under 72 characters, use the imperative mood, do not end the subject with a period, and output only the commit message. Make the subject describe the primary purpose and highest-impact change of the commit from the perspective of the project, prioritizing user-facing functionality, developer-visible capabilities, or architectural improvements over implementation details. If multiple changes are included, choose the most significant one for the subject and summarize supporting changes (such as migrations, refactors, schema updates, dependency changes, tests, or cleanup) in the body. Include a body only when it adds meaningful context.

## 3. Codebase Understanding & Navigation (Graphify)
- **Use the `graphify` skill** to explore the codebase and understand relationships between components before writing new features or refactoring.
- If `graphify-out/graph.json` exists:
  - Before answering codebase or architecture questions, run `graphify query "<question>"` (or use the `query_graph` MCP tool).
  - Use `graphify path "<A>" "<B>"` for exploring relationships and `graphify explain "<concept>"` for focused concepts.
  - If `graphify-out/wiki/index.md` exists, navigate it for documentation.
- After modifying code files in this session, run `graphify update .` to update the graph (this is AST-only and has no API cost).
