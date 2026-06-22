import { findAsset, knownAssets, XLM } from "@/lib/asset-registry";

describe("asset-registry", () => {
  it("returns the mainnet asset list", () => {
    const assets = knownAssets("mainnet");

    expect(assets).toContain(XLM);
    expect(assets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "credit_alphanum4",
          code: "USDC",
          issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        }),
        expect.objectContaining({
          type: "credit_alphanum4",
          code: "AQUA",
          issuer: "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA",
        }),
      ]),
    );
  });

  it("returns the testnet asset list", () => {
    expect(knownAssets("testnet")).toEqual(
      expect.arrayContaining([
        XLM,
        expect.objectContaining({
          type: "credit_alphanum4",
          code: "USDC",
          issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
        }),
        expect.objectContaining({
          type: "credit_alphanum4",
          code: "SRT",
          issuer: "GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B",
        }),
      ]),
    );
  });

  it("finds the native asset by code without an issuer", () => {
    expect(findAsset("mainnet", "XLM")).toBe(XLM);
    expect(findAsset("testnet", "XLM")).toBe(XLM);
  });

  it("finds credit assets by code and issuer", () => {
    expect(
      findAsset(
        "mainnet",
        "USDC",
        "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      ),
    ).toEqual({
      type: "credit_alphanum4",
      code: "USDC",
      issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    });
  });

  it("does not match a credit asset when the issuer is omitted or different", () => {
    expect(findAsset("mainnet", "USDC")).toBeUndefined();
    expect(
      findAsset(
        "mainnet",
        "USDC",
        "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
      ),
    ).toBeUndefined();
  });
});
