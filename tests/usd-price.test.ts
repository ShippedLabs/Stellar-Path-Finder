import { fetchUsdPrice, fetchUsdPricesForPaths } from "@/lib/usd-price";
import type { AssetRef, Path } from "@/types/path";

const XLM: AssetRef = { type: "native", code: "XLM" };
const USDC: AssetRef = {
  type: "credit_alphanum4",
  code: "USDC",
  issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
};
const AQUA: AssetRef = {
  type: "credit_alphanum4",
  code: "AQUA",
  issuer: "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA",
};

const samplePath: Path = {
  source: XLM,
  destination: AQUA,
  sourceAmount: "100",
  destinationAmount: "250",
  hops: [USDC],
  rate: "2.5",
};

function mockFetch(close: string, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: jest.fn().mockResolvedValue({
      _embedded: {
        records: [{ close }],
      },
    }),
  }) as jest.Mock;
}

describe("fetchUsdPrice", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 1 for mainnet USDC without a Horizon request", async () => {
    global.fetch = jest.fn() as jest.Mock;

    await expect(fetchUsdPrice("mainnet", USDC)).resolves.toBe(1);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("queries trade aggregations with the asset as base and USDC as counter", async () => {
    mockFetch("0.0123");

    await expect(fetchUsdPrice("mainnet", AQUA)).resolves.toBe(0.0123);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const url = new URL((global.fetch as jest.Mock).mock.calls[0][0]);
    expect(url.origin).toBe("https://horizon.stellar.org");
    expect(url.pathname).toBe("/trade_aggregations");
    expect(url.searchParams.get("base_asset_type")).toBe("credit_alphanum4");
    expect(url.searchParams.get("base_asset_code")).toBe("AQUA");
    expect(url.searchParams.get("base_asset_issuer")).toBe(AQUA.issuer);
    expect(url.searchParams.get("counter_asset_code")).toBe("USDC");
    expect(url.searchParams.get("order")).toBe("desc");
    expect(url.searchParams.get("limit")).toBe("1");
  });

  it("rejects testnet requests", async () => {
    global.fetch = jest.fn() as jest.Mock;

    await expect(fetchUsdPrice("testnet", XLM)).rejects.toThrow(
      "USD prices are only available on mainnet",
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("fetchUsdPricesForPaths", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns no prices on testnet", async () => {
    global.fetch = jest.fn() as jest.Mock;

    await expect(
      fetchUsdPricesForPaths("testnet", [samplePath], new Map()),
    ).resolves.toEqual({});
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("caches successful and failed fetches by asset key", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          _embedded: { records: [{ close: "0.12" }] },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: jest.fn(),
      }) as jest.Mock;
    const cache = new Map<string, number | null>();

    await expect(fetchUsdPricesForPaths("mainnet", [samplePath], cache)).resolves
      .toEqual({
        native: 0.12,
        "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN": 1,
      });
    expect(
      cache.get("AQUA:GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA"),
    ).toBeNull();
    expect(global.fetch).toHaveBeenCalledTimes(2);

    await expect(fetchUsdPricesForPaths("mainnet", [samplePath], cache)).resolves
      .toEqual({
        native: 0.12,
        "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN": 1,
      });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
