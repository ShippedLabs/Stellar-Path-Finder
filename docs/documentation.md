# Stellar Path Finder: Technical Documentation

## Overview

Stellar Path Finder is a web application for comparing path payment routes between any two assets on the Stellar network. It queries the Horizon API, normalizes the response into a structured format, and presents the results as a sortable table, a top-routes comparison strip, and per-route flow diagrams.

The application is built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and React Flow. No backend is required: all data comes directly from Stellar's public Horizon endpoints.

---

## How Path Payments Work

A path payment lets an account send one asset (the source) while the recipient receives a different asset (the destination). The Stellar network bridges the two through a chain of trades on the SDEX order books and classic AMM pools. Every hop in the chain executes atomically inside a single operation, so there is no risk of funds getting stuck in an intermediate asset if the full route cannot be completed.

Two modes are supported:

- **Strict-send:** the sender specifies an exact source amount. The recipient receives whatever the route yields, subject to a minimum the sender sets.
- **Strict-receive:** the recipient specifies an exact destination amount. The sender pays whatever the route costs, subject to a maximum the sender sets.

Horizon exposes `/paths/strict-send` and `/paths/strict-receive` for discovering available routes. This application calls those endpoints and visualises every route returned.

---

## Project Structure

```
src/
  app/
    layout.tsx          # Root layout, global metadata, body styles
    page.tsx            # Main page: form, results, skeleton, footer
    globals.css         # Tailwind base imports

  components/
    asset-selector.tsx  # Dropdown with custom asset form
    network-toggle.tsx  # Mainnet / Testnet pill toggle
    path-card.tsx       # Single route summary tile
    path-comparison.tsx # Top-3 routes side-by-side strip
    path-form.tsx       # Main search form
    path-graph.tsx      # React Flow route diagram
    path-list.tsx       # Sortable table with expandable rows
    results-skeleton.tsx# Animated loading placeholder

  hooks/
    use-network.ts      # Module-level singleton for network state
    use-paths.ts        # Path search with race-condition protection

  lib/
    asset-registry.ts   # Curated asset lists per network
    custom-assets.ts    # localStorage persistence for user-added assets
    horizon-client.ts   # Network-aware Horizon server with instance cache
    path-finder.ts      # Core path-finding service

  types/
    path.ts             # Domain types and helper functions
```

---

## Domain Types

Defined in `src/types/path.ts`.

```ts
type Network = "testnet" | "mainnet"

type Direction = "strict-send" | "strict-receive"

type AssetType = "native" | "credit_alphanum4" | "credit_alphanum12"

interface AssetRef {
  type: AssetType
  code: string
  issuer?: string   // absent for native XLM
}

interface Path {
  source: AssetRef
  destination: AssetRef
  sourceAmount: string
  destinationAmount: string
  rate: string       // destinationAmount / sourceAmount
  hops: AssetRef[]   // intermediate assets, may be empty
}

interface FindPathsInput {
  network: Network
  direction: Direction
  source: AssetRef
  destination: AssetRef
  amount: string
}
```

Helper functions:

- `assetKey(asset)` returns a stable string identity: `"native"` or `"CODE:issuer"`.
- `assetLabel(asset)` returns the display code (e.g. `"XLM"`, `"USDC"`).

---

## Core Libraries

### `horizon-client.ts`

Returns a cached `Horizon.Server` instance for a given network. Reuses the same instance across calls to avoid redundant SDK initialization.

```ts
getHorizonServer(network: Network): Horizon.Server
horizonUrl(network: Network): string
```

Networks map to:
- `mainnet` -> `https://horizon.stellar.org`
- `testnet` -> `https://horizon-testnet.stellar.org`

### `asset-registry.ts`

Holds curated `AssetRef` lists for each network. Mainnet includes XLM, USDC, yXLM, AQUA, and EURC. Testnet includes XLM, USDC, and SRT.

```ts
knownAssets(network: Network): AssetRef[]
findAsset(network: Network, code: string, issuer?: string): AssetRef | undefined
```

### `path-finder.ts`

The main service layer. Converts `AssetRef` values to SDK `Asset` objects, calls the appropriate Horizon endpoint, and normalizes each result into a `Path` with a computed `rate`.

```ts
findPaths(input: FindPathsInput): Promise<Path[]>
```

### `custom-assets.ts`

Persists user-added assets in `localStorage`, keyed by network. Includes shape validation (`isAssetRef`) to safely discard corrupted entries.

```ts
type CustomAssetMap = Record<Network, AssetRef[]>

loadCustomAssets(): CustomAssetMap
saveCustomAssets(value: CustomAssetMap): void
```

---

## Hooks

### `use-network.ts`

Uses `useSyncExternalStore` with module-level mutable state so every component that calls `useNetwork()` shares the same value. This prevents the NetworkToggle and PathForm from going out of sync.

The module-level state is hydrated from `localStorage` on the first call and persisted on every change. A `hydrated` flag prevents repeated reads.

Returns `{ network, setNetwork, ready }`. The `ready` flag is `false` during SSR and the initial client render, preventing hydration mismatches in the network toggle.

### `use-paths.ts`

Manages path search state with race-condition protection. Each search increments a `requestId` ref. When the async response arrives, it checks whether the current `requestId` still matches before updating state. Stale responses from superseded searches are silently dropped.

`reset()` bumps the `requestId` to cancel any in-flight request.

Returns `{ paths, loading, error, hasSearched, lastInput, search, reset }`.

---

## Components

### `AssetSelector`

A styled `<select>` element populated from the curated asset list plus any user-added custom assets. Exposes a collapsible form for adding a custom `(code, issuer)` pair.

Validation:
- Code: `/^[A-Za-z0-9]{1,12}$/`, auto-uppercased on submit.
- Issuer: validated with `StrKey.isValidEd25519PublicKey()` from the Stellar SDK.
- Asset type is derived from code length: up to 4 characters -> `credit_alphanum4`, otherwise `credit_alphanum12`.

### `NetworkToggle`

A pill-style toggle with `role="radiogroup"` and `aria-checked` attributes. Reads and writes via `useNetwork()`. The active state is only applied after `ready` to avoid hydration flicker.

### `PathForm`

The main search form. Maintains `source`, `destination`, `amount`, `direction`, and `customByNetwork` state. Resets asset selection on network change via a `useEffect` dependency on `network`. Submission is disabled if source equals destination, the amount is not a positive number, or a search is in progress.

### `PathCard`

A single route tile showing the asset pair, exchange rate, send/receive amounts, and hop count. Renders as a `<button>` when an `onClick` prop is provided and as a `<div>` otherwise. Accepts a `rank` prop for the numbered badge in the comparison strip.

### `PathComparison`

Sorts paths by rate descending and renders the top three as `PathCard` tiles in a responsive grid. Returns `null` if fewer than two paths are available.

### `PathList`

A sortable table where each row represents one path. Clicking a row expands it to show a `PathGraph`. Sort state (key + direction) is local to this component. The Send and Receive columns are hidden on mobile with `hidden sm:table-cell`.

Row identity uses a content hash (`pathId`) derived from the full asset chain and amounts, ensuring stable React keys across sort-order changes.

### `PathGraph`

A React Flow diagram for a single path. Builds a linear node chain from source through hops to destination, spaced 220px apart. Source and destination nodes use an emerald accent; hop nodes use a slate style. Edges are animated. Scroll-zoom is disabled; pan and pinch-zoom are enabled.

### `ResultsSkeleton`

An `animate-pulse` placeholder that mirrors the real results layout: three comparison cards followed by a table with a header row and five body rows. Mobile-hidden columns match the real table behaviour with `hidden sm:block`.

---

## State Flow

```
useNetwork()  ->  network (shared singleton)
                    |
PathForm  ->  FindPathsInput
                    |
usePaths.search()
                    |
path-finder.findPaths()  ->  Horizon API
                    |
Path[]  ->  PathComparison + PathList
                                |
                          (row click)
                                |
                          PathGraph
```

---

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. No environment variables are needed.

To run a production build locally:

```bash
npm run build
npm start
```

---

## Deployment

The app is deployed on Vercel. Because Next.js is Vercel-native, the `vercel.json` at the project root only specifies the framework, build command, dev command, and install command. No additional configuration is required.

Live URL: https://stellar-path-finder.vercel.app
