---
name: clean-code
description: Apply clean code principles (SOLID, readability, modularity) when writing or modifying code.
---

# Clean Code Guidelines

Whenever you are writing or modifying code in this codebase, you must adhere to clean coding practices:

## 1. Single Responsibility Principle (SRP)
- Every module, class, and function should have a single responsibility.
- Keep functions short and focused on a single task.

## 2. Meaningful Naming
- Choose descriptive, unambiguous, and intention-revealing names for variables, functions, structs, classes, and files.
- Avoid generic names like `data`, `info`, `temp`, or single-letter names except for short loop counters.

## 3. Don't Repeat Yourself (DRY)
- Extract common logic into reusable functions or helper modules instead of copying and pasting code.

## 4. Proper Documentation & Comments
- Write self-documenting code by choosing clear names and structures.
- Use comments to explain *why* something is done, not *what* is being done, unless the logic is inherently complex.
- Document public APIs, smart contract functions, and public traits.

## 5. Robust Error Handling
- Never silently swallow or ignore errors.
- Use expressive custom errors in smart contracts (e.g., Soroban error enums) and robust catch blocks or Result handling in frontend/TS code.

## 6. Formatting and Linting
- Ensure all code compiles and runs successfully.
- Run `cargo fmt` and `cargo clippy` for Rust contracts.
- Run `npm run lint` for frontend/TS code.
