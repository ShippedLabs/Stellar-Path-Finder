import { checkHorizonHealth } from "@/lib/network-health";

describe("checkHorizonHealth", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it("returns ok when Horizon responds successfully", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true } as Response);

    await expect(checkHorizonHealth("testnet")).resolves.toBe("ok");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://horizon-testnet.stellar.org",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("returns degraded when Horizon responds with an error status", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false } as Response);

    await expect(checkHorizonHealth("mainnet")).resolves.toBe("degraded");
  });

  it("returns degraded when the health request fails", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("network down"));

    await expect(checkHorizonHealth("mainnet")).resolves.toBe("degraded");
  });

  it("aborts slow health requests after the timeout", async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn((_url, init) => {
      const signal = init?.signal as AbortSignal;
      return new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => {
          reject(new DOMException("aborted", "AbortError"));
        });
      });
    }) as jest.MockedFunction<typeof fetch>;

    const result = checkHorizonHealth("mainnet");
    jest.advanceTimersByTime(3_000);

    await expect(result).resolves.toBe("degraded");
  });
});
