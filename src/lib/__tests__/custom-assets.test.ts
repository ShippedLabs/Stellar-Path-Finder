import {
  EMPTY_CUSTOM_ASSETS,
  loadCustomAssets,
  saveCustomAssets,
} from "@/lib/custom-assets";
import type { CustomAssetMap } from "@/lib/custom-assets";

type StorageMap = Record<string, string>;

function installLocalStorage(initial: StorageMap = {}) {
  const store: StorageMap = { ...initial };
  const localStorage = {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      for (const key of Object.keys(store)) delete store[key];
    }),
  };

  Object.defineProperty(global, "window", {
    configurable: true,
    value: { localStorage },
  });

  return { localStorage, store };
}

describe("custom-assets", () => {
  afterEach(() => {
    Reflect.deleteProperty(global, "window");
    jest.restoreAllMocks();
  });

  it("returns the default structure when localStorage is unavailable", () => {
    expect(loadCustomAssets()).toBe(EMPTY_CUSTOM_ASSETS);
  });

  it("returns the default structure when localStorage is empty", () => {
    installLocalStorage();

    expect(loadCustomAssets()).toEqual({ mainnet: [], testnet: [] });
  });

  it("discards entries that do not match the AssetRef shape", () => {
    installLocalStorage({
      "spf:customAssets": JSON.stringify({
        mainnet: [
          { type: "credit_alphanum4", code: "USD", issuer: "GISSUER" },
          { type: "credit_alphanum4", code: "BAD" },
          { type: "native", code: "XLM" },
          { type: "other", code: "NOPE", issuer: "GISSUER" },
        ],
        testnet: "not-an-array",
      }),
    });

    expect(loadCustomAssets()).toEqual({
      mainnet: [
        { type: "credit_alphanum4", code: "USD", issuer: "GISSUER" },
        { type: "native", code: "XLM" },
      ],
      testnet: [],
    });
  });

  it("falls back to the default structure when stored JSON is corrupted", () => {
    installLocalStorage({ "spf:customAssets": "{bad json" });

    expect(loadCustomAssets()).toBe(EMPTY_CUSTOM_ASSETS);
  });

  it("writes the provided custom asset map", () => {
    const { localStorage, store } = installLocalStorage();
    const value: CustomAssetMap = {
      mainnet: [{ type: "credit_alphanum4", code: "USD", issuer: "GISSUER" }],
      testnet: [{ type: "native", code: "XLM" }],
    };

    saveCustomAssets(value);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      "spf:customAssets",
      JSON.stringify(value),
    );
    expect(JSON.parse(store["spf:customAssets"])).toEqual(value);
  });
});
