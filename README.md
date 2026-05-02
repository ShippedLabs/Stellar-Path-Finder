# Stellar Path Finder

A web app for comparing path payment routes between any two Stellar assets.

Stellar lets you send one asset and have the recipient receive a different asset, automatically routed through the network's built-in exchange. Multiple routes usually exist for the same pair, and they pay out different amounts. This tool fetches all available routes for the assets you pick and lays them out side by side so you can see which is best.

Live demo: coming soon

## Motivation

If you want to know the best way to convert one Stellar asset to another today, you have to query Horizon directly and read raw JSON. Every wallet hides its own routing logic, so you cannot compare across them. Path payments are one of the most useful primitives in Stellar but there is no decent UI for exploring them.

This is the Skyscanner equivalent for Stellar path payments.

## What works today

Nothing yet. This is the initial scaffold.

## Planned for the MVP

- Pick a source asset, destination asset, and amount
- Fetch all available paths from Horizon (strict-send and strict-receive modes)
- Display each path as a visual flow diagram with hops, prices, and the final amount
- Sort routes by best rate
- Switch between testnet and mainnet

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- @stellar/stellar-sdk
- React Flow (for the path diagrams)

## Running it locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:3000.

## License

MIT
