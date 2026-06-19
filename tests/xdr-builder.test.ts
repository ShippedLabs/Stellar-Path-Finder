import { BASE_FEE, Networks, TransactionBuilder } from "@stellar/stellar-sdk";
import { buildXdr } from "@/lib/xdr-builder";
import type { Path } from "@/types/path";

const SOURCE = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";
const ISSUER = "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA";

const samplePath: Path = {
  source: { type: "native", code: "XLM" },
  destination: { type: "credit_alphanum4", code: "USDC", issuer: ISSUER },
  sourceAmount: "100.0000000",
  destinationAmount: "25.1234567",
  hops: [{ type: "credit_alphanum4", code: "AQUA", issuer: ISSUER }],
  rate: "0.2512346",
};

describe("buildXdr", () => {
  it("builds a parseable strict-send envelope", () => {
    const xdr = buildXdr(samplePath, "strict-send", SOURCE, "mainnet");
    expect(typeof xdr).toBe("string");
    const tx = TransactionBuilder.fromXDR(xdr, Networks.PUBLIC);
    expect(tx.operations).toHaveLength(1);
    expect(tx.operations[0].type).toBe("pathPaymentStrictSend");
  });

  it("builds a parseable strict-receive envelope", () => {
    const xdr = buildXdr(samplePath, "strict-receive", SOURCE, "testnet");
    const tx = TransactionBuilder.fromXDR(xdr, Networks.TESTNET);
    expect(tx.operations).toHaveLength(1);
    expect(tx.operations[0].type).toBe("pathPaymentStrictReceive");
  });

  it("uses the passphrase of the selected network", () => {
    const xdr = buildXdr(samplePath, "strict-send", SOURCE, "testnet");
    const tx = TransactionBuilder.fromXDR(xdr, Networks.TESTNET);
    expect(tx.networkPassphrase).toBe(Networks.TESTNET);
  });

  it("targets the source account as destination (self path payment)", () => {
    const xdr = buildXdr(samplePath, "strict-send", SOURCE, "mainnet");
    const tx = TransactionBuilder.fromXDR(xdr, Networks.PUBLIC);
    const op = tx.operations[0] as { destination?: string };
    expect(op.destination).toBe(SOURCE);
  });

  it("carries the intermediate hops in the operation path", () => {
    const xdr = buildXdr(samplePath, "strict-send", SOURCE, "mainnet");
    const tx = TransactionBuilder.fromXDR(xdr, Networks.PUBLIC);
    const op = tx.operations[0] as { path?: { getCode(): string }[] };
    expect(op.path).toHaveLength(1);
    expect(op.path?.[0].getCode()).toBe("AQUA");
  });

  it("maps strict-send amounts, assets, source and fee", () => {
    const xdr = buildXdr(samplePath, "strict-send", SOURCE, "mainnet");
    const tx = TransactionBuilder.fromXDR(xdr, Networks.PUBLIC);
    expect(tx.source).toBe(SOURCE);
    expect(tx.fee).toBe(BASE_FEE);
    const op = tx.operations[0] as {
      sendAmount: string;
      destMin: string;
      sendAsset: { isNative(): boolean };
      destAsset: { getCode(): string };
    };
    expect(op.sendAmount).toBe("100.0000000");
    expect(op.destMin).toBe("25.1234567");
    expect(op.sendAsset.isNative()).toBe(true);
    expect(op.destAsset.getCode()).toBe("USDC");
  });

  it("maps strict-receive amounts", () => {
    const xdr = buildXdr(samplePath, "strict-receive", SOURCE, "testnet");
    const tx = TransactionBuilder.fromXDR(xdr, Networks.TESTNET);
    const op = tx.operations[0] as { sendMax: string; destAmount: string };
    expect(op.sendMax).toBe("100.0000000");
    expect(op.destAmount).toBe("25.1234567");
  });
});
