# CampusChain Documentation Audit

This audit evaluates all documentation files (`*.md`) in the repository against the actual implemented smart contracts and Next.js frontend code as of July 31, 2026.

## Audit Summary Table

| File Path | Category | Target / Actions | One-Line Reason |
| :--- | :---: | :--- | :--- |
| [`README.md`](file:///home/sandipansingh/Projects/CampusChain/README.md) | **KEEP** | - | Main project entry point; fully accurate with the three-contract model, local setup, and security considerations. |
| [`.agents/AGENTS.md`](file:///home/sandipansingh/Projects/CampusChain/.agents/AGENTS.md) | **KEEP** | - | Active Workspace Customization root agent instructions for coding standards, commits, and graphify. |
| [`.agents/rules/graphify.md`](file:///home/sandipansingh/Projects/CampusChain/.agents/rules/graphify.md) | **KEEP** | - | Active Graphify query rules configuration loaded by the agent. |
| [`.agents/workflows/graphify.md`](file:///home/sandipansingh/Projects/CampusChain/.agents/workflows/graphify.md) | **KEEP** | - | Active Graphify workflow customization loaded by the agent. |
| [`CLAUDE.md`](file:///home/sandipansingh/Projects/CampusChain/CLAUDE.md) | **KEEP** | - | Active developer command reference for build, test, lint, and graphify commands. |
| [`GEMINI.md`](file:///home/sandipansingh/Projects/CampusChain/GEMINI.md) | **KEEP** | - | Active Graphify rule definition loaded by Gemini. |
| [`DEMO_ACCOUNTS.md`](file:///home/sandipansingh/Projects/CampusChain/DEMO_ACCOUNTS.md) | **KEEP** | - | Active, seeded Testnet accounts, contract IDs, and the manual onboarding evaluation guide. |
| [`DEPLOYMENT.md`](file:///home/sandipansingh/Projects/CampusChain/DEPLOYMENT.md) (root) | **MERGE** | Fold into [`README.md`](file:///home/sandipansingh/Projects/CampusChain/README.md) | Overlaps entirely with `README.md` Sections 7 and 10; fold native XLM SAC contract address and `./deploy/testnet.sh` pipeline details before deleting. |
| [`AGENTS.md`](file:///home/sandipansingh/Projects/CampusChain/AGENTS.md) (root) | **DELETE** | Remove | Outdated instructions that duplicate `CLAUDE.md` and `README.md`, and incorrectly refer to only two contracts. |
| [`GAP_ANALYSIS.md`](file:///home/sandipansingh/Projects/CampusChain/GAP_ANALYSIS.md) | **DELETE** | Remove | One-off validation report comparing early contracts against UX designs; no longer needed post-implementation. |
| [`PRODUCTION_FIX_PLAN.md`](file:///home/sandipansingh/Projects/CampusChain/PRODUCTION_FIX_PLAN.md) | **DELETE** | Remove | Temporary planning document for Phase 0/1 fixes that have already been completely implemented and verified. |
| [`RBAC_PLAN.md`](file:///home/sandipansingh/Projects/CampusChain/RBAC_PLAN.md) | **DELETE** | Remove | Design document for the university-scoped RBAC transition; the transition is complete and the plan is obsolete. |
| [`docs/DEPLOYMENT.md`](file:///home/sandipansingh/Projects/CampusChain/docs/DEPLOYMENT.md) | **DELETE** | Remove | Outdated deployment guide containing obsolete CLI commands and incorrect contract initialization parameters. |
| [`docs/API.md`](file:///home/sandipansingh/Projects/CampusChain/docs/API.md) | **DELETE** | Remove | Obsolete frontend API specifications listing non-existent files and outdated contract functions. |
| [`docs/architecture.md`](file:///home/sandipansingh/Projects/CampusChain/docs/architecture.md) | **DELETE** | Remove | Outdated architecture document omitting `CampusIdentity` and C2C checks, which are correctly documented in `README.md`. |
| [`docs/CONTRACTS.md`](file:///home/sandipansingh/Projects/CampusChain/docs/CONTRACTS.md) | **DELETE** | Remove | Obsolete contract specifications describing an outdated layout where role management was inside the token contract. |
| [`docs/SECURITY.md`](file:///home/sandipansingh/Projects/CampusChain/docs/SECURITY.md) | **DELETE** | Remove | Generic threat model checklist superseded by the detailed, project-specific security considerations in `README.md`. |
| [`frontend/BUSINESS_LOGIC.md`](file:///home/sandipansingh/Projects/CampusChain/frontend/BUSINESS_LOGIC.md) | **DELETE** | Remove | Obsolete business logic reference detailing non-existent hooks, incorrect contract interfaces, and old page routes. |
