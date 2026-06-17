# Issue #1 — XDR Export: Codebase Analysis

Analysis notes captured before implementation, to establish where the XDR
export feature fits and how route data already flows through the app.

## Path data shape

Defined in `src/types/path.ts`:

```ts
interface Path {
  source: AssetRef;        // asset being sent
  destination: AssetRef;   // asset being received
  sourceAmount: string;    // Horizon-formatted, <= 7 decimals
  destinationAmount: string;
  hops: AssetRef[];        // intermediate assets only (excludes source & destination)
  rate: string;
}

interface AssetRef {
  type: "native" | "credit_alphanum4" | "credit_alphanum12";
  code: string;
  issuer?: string;         // absent for native XLM
}
```

Implications for the builder:

- `hops` already excludes source and destination, so it maps directly to the
  `path` parameter of the SDK path-payment operations.
- `sourceAmount` / `destinationAmount` are strings within Stellar's 7-decimal
  precision, so they can be passed to the SDK without re-formatting.

## Direction

```ts
type Direction = "strict-send" | "strict-receive";
```

Maps one-to-one to the two operations:

- `strict-send`    -> `Operation.pathPaymentStrictSend`
- `strict-receive` -> `Operation.pathPaymentStrictReceive`

## Where route selection lives

- Expanded-row state is owned by `src/components/path-list.tsx` via the
  `selectedId` state. Clicking a row toggles it open.
- The open row renders `<PathGraph path={path} />` (`path-list.tsx`), passing
  the full `Path` for the selected route.
- `PathGraph` (`src/components/path-graph.tsx`) is therefore the single place
  where exactly one route is selected and already has the `Path` in scope.

**Conclusion:** the XDR export UI (address input + Copy button) belongs at the
bottom of `PathGraph`, directly under the diagram — matching the issue.

## Reuse opportunity

`src/lib/path-finder.ts` already contains a private `toSdkAsset(ref: AssetRef)`
helper that converts an `AssetRef` into an SDK `Asset`. The XDR builder needs
the same conversion, so this helper should be exported and reused rather than
duplicated.

## Two requirements the SDK imposes beyond the issue text

1. **Destination account.** Both path-payment operations require a `destination`
   account ID, but the feature only collects a *source* address. This is modelled
   as a self path-payment (a swap), so `destination = sourceAccount`.

2. **Network passphrase.** `TransactionBuilder` requires the network passphrase
   (`Networks.PUBLIC` / `Networks.TESTNET`), but `Path` carries no network. The
   builder therefore takes the active `network` as an argument, and `PathGraph`
   receives the current network (from `useNetwork()`) as a prop.

Additionally, `TransactionBuilder.build()` requires a timebound, so the builder
sets a finite timeout on the transaction.
