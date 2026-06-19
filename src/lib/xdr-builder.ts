import {
  Account,
  BASE_FEE,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { toSdkAsset } from "@/lib/path-finder";
import type { Direction, Network, Path } from "@/types/path";

const NETWORK_PASSPHRASE: Record<Network, string> = {
  mainnet: Networks.PUBLIC,
  testnet: Networks.TESTNET,
};

const PLACEHOLDER_SEQUENCE = "0";
const TIMEOUT_SECONDS = 180;

export function buildXdr(
  path: Path,
  direction: Direction,
  sourceAccount: string,
  network: Network,
): string {
  const account = new Account(sourceAccount, PLACEHOLDER_SEQUENCE);
  const sendAsset = toSdkAsset(path.source);
  const destAsset = toSdkAsset(path.destination);
  const hops = path.hops.map(toSdkAsset);

  const operation =
    direction === "strict-send"
      ? Operation.pathPaymentStrictSend({
          sendAsset,
          sendAmount: path.sourceAmount,
          destination: sourceAccount,
          destAsset,
          destMin: path.destinationAmount,
          path: hops,
        })
      : Operation.pathPaymentStrictReceive({
          sendAsset,
          sendMax: path.sourceAmount,
          destination: sourceAccount,
          destAsset,
          destAmount: path.destinationAmount,
          path: hops,
        });

  return new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE[network],
  })
    .addOperation(operation)
    .setTimeout(TIMEOUT_SECONDS)
    .build()
    .toXDR();
}
