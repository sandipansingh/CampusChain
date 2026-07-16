# Claude Code Guidelines - CampusChain

## Build, Test, and Lint Commands

### Smart Contracts (Rust / Soroban)
- Build contracts: `cargo build --target wasm32-unknown-unknown --release`
- Test contracts: `cargo test`
- Format Rust code: `cargo fmt`
- Lint Rust code: `cargo clippy`

### Frontend (Next.js / TypeScript)
- Install dependencies: `cd frontend && npm install`
- Start development server: `cd frontend && npm run dev`
- Build production bundle: `cd frontend && npm run build`
- Run linting: `cd frontend && npm run lint`
- Run tests: `cd frontend && npm run test`

### Knowledge Graph (Graphify)
- Rebuild graph: `graphify update .`

---

## Code Style & Development Guidelines

1. **Clean Code Principles**:
   - Write clean, modular, and readable code.
   - Functions should be short, single-purpose, and clearly named.
   - Document public APIs, smart contract functions, and custom types.
   - Run linter/formatter on changed files before finalizing.

2. **Commit Messages**:
   - Commit incrementally and frequently. Do not make a single giant commit.
   - Commit messages must follow the Conventional Commits specification.
   - Subject line: `<type>(<optional-scope>): <description>` (max 72 chars, imperative mood, no ending period).
   - Use one of: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, or `revert`.

3. **Smart Contracts**:
   - Use Soroban SDK for smart contract development.
   - Implement clear events and appropriate errors using custom enums.

4. **Frontend**:
   - React 19 functional components, Next.js 15 App Router.
   - Use TypeScript.
   - Tailwind CSS v4 for styling.

---

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
