import { checkHorizonHealth } from "@/lib/network-health";

describe("network-health", () => {
  it("returns 'ok' when Horizon root responds with 200 within timeout", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    const status = await checkHorizonHealth("mainnet", {
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(status).toBe("ok");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://horizon.stellar.org",
      expect.objectContaining({
        method: "GET",
        headers: { Accept: "application/json" },
      }),
    );
  });

  it("checks the correct URL for testnet", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    const status = await checkHorizonHealth("testnet", {
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(status).toBe("ok");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://horizon-testnet.stellar.org",
      expect.anything(),
    );
  });

  it("returns 'degraded' when Horizon returns a non-ok HTTP status", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
    } as Response);

    const status = await checkHorizonHealth("mainnet", {
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(status).toBe("degraded");
  });

  it("returns 'degraded' when the fetch request throws a network error", async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error("Network offline"));

    const status = await checkHorizonHealth("mainnet", {
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(status).toBe("degraded");
  });

  it("returns 'degraded' when the response takes longer than the timeout", async () => {
    const mockFetch = jest.fn().mockImplementation((_url, options?: RequestInit) => {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          resolve({ ok: true, status: 200 } as Response);
        }, 100);

        options?.signal?.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new DOMException("The operation was aborted", "AbortError"));
        });
      });
    });

    const status = await checkHorizonHealth("mainnet", {
      timeoutMs: 20,
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(status).toBe("degraded");
  });
});
