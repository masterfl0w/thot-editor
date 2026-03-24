# Contributing to Thot Editor

Thanks for contributing to Thot Editor.

This project uses a lightweight quality flow:

- ESLint for code-quality checks
- TypeScript for type safety
- Prettier for formatting

## Prerequisites

- Node.js 20+ recommended
- npm

## Setup

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

## Quality Checks

Run these before opening a pull request:

```bash
npm run format
npm run lint
npm run typecheck
```

You can also verify formatting without changing files:

```bash
npm run format:check
```

## Workflow

Suggested contribution flow:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Run formatting, linting, and type checks.
5. Open a pull request with a clear summary.

## Formatting Rules

Prettier is the source of truth for formatting.

- Do not manually fight the formatter.
- If CI reports formatting changes, run:

```bash
npm run format
```

## Linting and TypeScript

- ESLint should pass with zero warnings.
- TypeScript should pass with `npm run typecheck`.

## Pull Request Guidance

Try to keep pull requests focused.

Include:

- what changed
- why it changed
- how it was tested

If your change affects collaboration, export, import, or workspace persistence, include a short manual test note.
