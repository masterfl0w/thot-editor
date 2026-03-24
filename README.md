# Thot Editor

Thot Editor is a local-first visual workspace for diagrams, structured notes, architecture maps, math-rich explanations, and collaborative graph editing.

It combines an infinite canvas, nested boxes, text nodes, labeled links, JSON import/export, PNG/SVG export, math rendering, and host-driven live collaboration in a single React application.

## Overview

Thot Editor is designed for technical thinking:

- map systems and workflows on an infinite canvas
- write notes and equations directly inside nodes or free text blocks
- connect components with straight, curved, or angled links
- export boards as PNG, SVG, or JSON
- reopen your last local workspace automatically
- open a collaborative session with host approval and live cursors

The project is local-first by default. A single-user workspace is persisted in the browser. Collaboration is optional and can be enabled through a dedicated WebSocket server.

## Current Version

[![GitHub release](https://img.shields.io/github/v/release/masterfl0w/thot-editor?display_name=tag)](https://github.com/masterfl0w/thot-editor/releases)

## Features

### Canvas and editing

- Infinite workspace with pan and zoom
- Free mode and static snap mode
- Box nodes, text nodes, nested boxes, and multiple shapes
- Multi-selection and keyboard shortcuts
- Undo support with action history
- Floating UI with a dedicated landing page and embedded live demo

### Links and graph structure

- Port-to-port connections on box borders
- Straight, curved, and angled links
- Arrowheads, labels, descriptions, and hover tooltips
- Link labels with math-capable descriptions

### Text and math

- Inline text editing on canvas
- Math rendering with KaTeX
- Math support in text nodes, box title/description, and link descriptions

### Import and export

- Import workspace JSON from a modal editor
- Export workspace JSON
- Export/copy selection or workspace as PNG
- Export/copy selection or workspace as SVG

### Collaboration

- Host-controlled live collaboration
- Invite with a magic link
- Host approval before a guest joins
- Live collaborator cursors with unique colors and sci-fi nicknames
- Host-owned persistence: guest local workspaces are restored after leaving
- Self-hostable collaboration server

## Screens and UX

- Landing page with product presentation
- Minimal embedded live demo in the hero section
- Main editor with floating top bar and left-side properties panel
- Collaboration status pill and collaboration management modal

## Tech Stack

### Application

- React 19
- TypeScript
- Vite 8
- Zustand
- Panda CSS
- KaTeX
- html-to-image

### Collaboration

- Yjs packages are present in the dependency tree
- Current collaboration flow uses a custom WebSocket server in `server/collab-server.mjs`

## Project Structure

```text
.
├── public/                  # Static assets, icons, logos
├── server/                  # Collaboration WebSocket server
├── src/
│   ├── components/          # Editor UI, landing page, canvas, nodes, edges
│   ├── store/               # Zustand workspace store and persistence logic
│   ├── utils/               # Export and collaboration helpers
│   └── types/               # Shared TypeScript types
├── styled-system/           # Generated Panda CSS artifacts
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+ recommended
- npm

### Install dependencies

```bash
npm install
```

### Start the app

```bash
npm run dev
```

The app will start on the Vite development server, typically:

```text
http://localhost:5173/
```

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Collaboration Server

The editor can run as a local-first single-user application without any server.

For live collaboration, start the included WebSocket server:

```bash
npm run collab-server
```

Default server address:

```text
ws://127.0.0.1:1235
```

Environment variables:

- `HOST` default: `127.0.0.1`
- `PORT` default: `1235`

Example:

```bash
HOST=0.0.0.0 PORT=1235 npm run collab-server
```

### Important note about deployment

The collaboration server requires persistent WebSocket support.

That means:

- the frontend can be deployed on static hosts such as Vercel
- the collaboration server must be deployed on a WebSocket-capable Node host

## Available Scripts

- `npm run dev` - start the Vite development server
- `npm run build` - generate Panda CSS, type-check, and build the app
- `npm run preview` - preview the production build
- `npm run lint` - run ESLint
- `npm run collab-server` - start the collaboration WebSocket server

## Workspace Persistence

By default, the editor stores the local workspace in browser storage.

Persisted state includes:

- nodes and texts
- links
- viewport and zoom
- theme
- layout mode

Non-persisted transient state includes:

- temporary selections
- context menu state
- inline editing state
- live collaboration presence

## JSON Format

Thot Editor supports JSON import/export for the workspace state.

Typical exported data includes:

- nodes
- text nodes
- edges
- viewport
- zoom
- theme
- layout mode
- history metadata

This makes the editor suitable for graph-based workflows, config-driven diagrams, and tool interoperability.

## Dependencies

### Runtime dependencies

- `@pandacss/dev` `^1.9.1`
- `html-to-image` `^1.11.13`
- `katex` `^0.16.40`
- `react` `^19.2.4`
- `react-dom` `^19.2.4`
- `y-webrtc` `^10.3.0`
- `y-websocket` `^3.0.0`
- `yjs` `^13.6.30`
- `zustand` `^5.0.12`

### Development dependencies

- `@eslint/js` `^9.39.4`
- `@types/node` `^24.12.0`
- `@types/react` `^19.2.14`
- `@types/react-dom` `^19.2.3`
- `@vitejs/plugin-react` `^6.0.1`
- `eslint` `^9.39.4`
- `eslint-plugin-react-hooks` `^7.0.1`
- `eslint-plugin-react-refresh` `^0.5.2`
- `globals` `^17.4.0`
- `typescript` `~5.9.3`
- `typescript-eslint` `^8.57.0`
- `vite` `^8.0.1`

## Versioning

This repository currently follows manual release versioning.

Latest release:

- GitHub releases badge above updates automatically from the latest published release

The version is reflected in:

- `package.json`
- `package-lock.json`
- the editor UI

## Repository

- GitHub: `https://github.com/masterfl0w/thot-editor`

## Author

- `masterfl0w`

If you want, you can replace this section later with your real name, website, X/GitHub links, or a contributors section.

## License

No explicit project license file is currently present in this repository.

If you want Thot Editor to be used as a standard open source project, you should add a top-level license file such as `MIT`, `Apache-2.0`, or `GPL-3.0`.

## Roadmap Ideas

- richer JSON graph adapters
- read-only collaboration permissions
- improved code splitting for smaller production bundles
- more export presets
- templates and starter boards
- better mobile/editor ergonomics

## Contributing

Contributions, bug reports, and UX feedback are welcome.

Suggested workflow:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run build`
5. Open a pull request

## Status

Thot Editor is under active development and already includes:

- local-first editing
- collaboration
- math rendering
- JSON import/export
- PNG/SVG export
- landing page and product presentation

It is suitable for experimentation, demos, technical diagrams, and ongoing feature development.
