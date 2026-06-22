import { fetchRateHistory } from "@/lib/trade-aggregations";

const ISSUER = "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA";

describe("fetchRateHistory", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("queries Horizon trade aggregations for the selected pair", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        _embedded: {
          records: [{ timestamp: "1699999900000", close: "0.1234567" }],
        },
      }),
    } as Response);

    const history = await fetchRateHistory(
      "mainnet",
      { type: "native", code: "XLM" },
      { type: "credit_alphanum4", code: "USDC", issuer: ISSUER },
      86_400_000,
    );

    expect(history).toEqual([{ timestamp: 1_699_999_900_000, close: "0.1234567" }]);

    const calledUrl = new URL((global.fetch as jest.Mock).mock.calls[0][0]);
    expect(calledUrl.origin).toBe("https://horizon.stellar.org");
    expect(calledUrl.pathname).toBe("/trade_aggregations");
    expect(calledUrl.searchParams.get("base_asset_type")).toBe("native");
    expect(calledUrl.searchParams.get("counter_asset_type")).toBe(
      "credit_alphanum4",
    );
    expect(calledUrl.searchParams.get("counter_asset_code")).toBe("USDC");
    expect(calledUrl.searchParams.get("counter_asset_issuer")).toBe(ISSUER);
    expect(calledUrl.searchParams.get("resolution")).toBe("86400000");
    expect(calledUrl.searchParams.get("order")).toBe("asc");
  });

  it("returns an empty array when Horizon has no aggregation records", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ _embedded: { records: [] } }),
    } as Response);

    await expect(
      fetchRateHistory(
        "testnet",
        { type: "native", code: "XLM" },
        { type: "native", code: "XLM" },
        86_400_000,
      ),
    ).resolves.toEqual([]);
  });

  it("throws a readable error when Horizon returns a failure", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
    } as Response);

    await expect(
      fetchRateHistory(
        "mainnet",
        { type: "native", code: "XLM" },
        { type: "credit_alphanum4", code: "USDC", issuer: ISSUER },
        86_400_000,
      ),
    ).rejects.toThrow("Unable to fetch historical rates");
  });
});
