# Contributing to Stellar Path Finder

Thank you for your interest in contributing. This guide covers everything you need to get started, from setting up the project locally to submitting a pull request.

---

## Code of Conduct

Be respectful and constructive. This is an open project and contributions of all kinds are welcome, regardless of experience level.

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later
- A basic understanding of TypeScript and React

### Local Setup

```bash
git clone https://github.com/raymondintell/stellar-path-finder.git
cd stellar-path-finder
npm install
npm run dev
```

Open `http://localhost:3000`. The app connects directly to Stellar's public Horizon endpoints, so no API keys or environment variables are required.

To run a production build before submitting changes:

```bash
npm run build
```

Fix any type errors or build failures before opening a PR.

---

## Project Structure

A full breakdown of the codebase is available in [docs/documentation.md](./documentation.md). The short version:

- `src/types/` - domain types and helper functions
- `src/lib/` - service layer (Horizon client, path finder, asset registry, custom assets)
- `src/hooks/` - React hooks for network state and path search
- `src/components/` - all UI components
- `src/app/` - Next.js App Router pages and layout

---

## Ways to Contribute

### Bug Reports

Open a GitHub issue with:

- A clear description of the problem
- Steps to reproduce it
- What you expected to happen vs. what actually happened
- Browser and OS if the issue is visual or interactive

### Feature Requests

Check the roadmap in [README.md](../README.md) first. If your idea is not already listed, open an issue describing the use case. Good feature requests explain the problem they solve, not just the solution.

### Code Contributions

Contributions are welcome for:

- Bug fixes
- Roadmap features (XDR export, per-hop pricing, saved asset pairs, etc.)
- Accessibility improvements
- Performance improvements
- Test coverage

### Documentation

If you find something unclear or missing in the docs, a PR to improve it is just as valuable as a code change.

---

## Branch and Commit Conventions

Create a branch from `main` using a short, descriptive name:

```
feat/xdr-export
fix/empty-state-edge-case
docs/add-setup-guide
chore/upgrade-stellar-sdk
```

Write commit messages in conventional commit format:

```
feat(component): short description
fix(hook): short description
docs: short description
chore: short description
```

Keep the subject line under 72 characters. No extended body is needed for small changes.

---

## Pull Requests

1. Fork the repo and create your branch from `main`.
2. Make your changes and verify the build passes with `npm run build`.
3. Open a PR with a clear title and a short description of what changed and why.
4. Link any related issues in the PR description.

Keep PRs focused. One change per PR is easier to review and merge than a large mixed diff.

---

## Code Style

- TypeScript throughout. No `any` unless unavoidable.
- No explanatory comments in the code. Name things clearly instead.
- Tailwind CSS for all styling. No inline styles except for dynamic values (e.g. computed pixel widths in graphs).
- No new dependencies without discussion in an issue first.

---

## Asset Registry

If you want to add a well-known asset to the curated list in `src/lib/asset-registry.ts`, open a PR with:

- The asset code and issuer address
- A link to the anchor's website or documentation
- Which network it belongs to (mainnet or testnet)

Custom assets can already be added at runtime through the UI, so the registry is reserved for widely-used anchors.

---

## Questions

Open a GitHub issue with the `question` label if something is unclear. There are no dumb questions.
