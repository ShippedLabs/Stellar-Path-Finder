import { findPaths, toSdkAsset } from "@/lib/path-finder";
import { getHorizonServer } from "@/lib/horizon-client";

jest.mock("@/lib/horizon-client", () => ({
  getHorizonServer: jest.fn(),
}));

const mockedGetHorizonServer = jest.mocked(getHorizonServer);

function mockPathBuilder(records: unknown[]) {
  return {
    call: jest.fn().mockResolvedValue({ records }),
  };
}

describe("path-finder", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("normalizes Horizon path records returned by strict-send", async () => {
    const builder = mockPathBuilder([
      {
        source_asset_type: "native",
        source_amount: "10.0000000",
        destination_asset_type: "credit_alphanum4",
        destination_asset_code: "USDC",
        destination_asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        destination_amount: "2.5000000",
        path: [
          {
            asset_type: "credit_alphanum4",
            asset_code: "AQUA",
            asset_issuer: "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA",
          },
        ],
      },
    ]);
    const strictSendPaths = jest.fn().mockReturnValue(builder);
    mockedGetHorizonServer.mockReturnValue({
      strictSendPaths,
    } as unknown as ReturnType<typeof getHorizonServer>);

    const paths = await findPaths({
      network: "mainnet",
      direction: "strict-send",
      source: { type: "native", code: "XLM" },
      destination: { type: "credit_alphanum4", code: "USDC", issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN" },
      amount: "10",
    });

    expect(mockedGetHorizonServer).toHaveBeenCalledWith("mainnet");
    expect(strictSendPaths).toHaveBeenCalledWith(
      expect.objectContaining({ code: "XLM" }),
      "10",
      [expect.objectContaining({ code: "USDC", issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN" })],
    );
    expect(paths).toEqual([
      {
        source: { type: "native", code: "XLM" },
        destination: {
          type: "credit_alphanum4",
          code: "USDC",
          issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        },
        sourceAmount: "10.0000000",
        destinationAmount: "2.5000000",
        hops: [{ type: "credit_alphanum4", code: "AQUA", issuer: "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA" }],
        rate: "0.2500000",
      },
    ]);
  });

  it("normalizes strict-receive records and handles empty path hops", async () => {
    const builder = mockPathBuilder([
      {
        source_asset_type: "credit_alphanum4",
        source_asset_code: "USDC",
        source_asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        source_amount: "5.0000000",
        destination_asset_type: "native",
        destination_amount: "20.0000000",
        path: [],
      },
    ]);
    const strictReceivePaths = jest.fn().mockReturnValue(builder);
    mockedGetHorizonServer.mockReturnValue({
      strictReceivePaths,
    } as unknown as ReturnType<typeof getHorizonServer>);

    const paths = await findPaths({
      network: "testnet",
      direction: "strict-receive",
      source: { type: "credit_alphanum4", code: "USDC", issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN" },
      destination: { type: "native", code: "XLM" },
      amount: "20",
    });

    expect(strictReceivePaths).toHaveBeenCalledWith(
      [expect.objectContaining({ code: "USDC", issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN" })],
      expect.objectContaining({ code: "XLM" }),
      "20",
    );
    expect(paths[0]).toMatchObject({
      source: { type: "credit_alphanum4", code: "USDC", issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN" },
      destination: { type: "native", code: "XLM" },
      hops: [],
      rate: "4.0000000",
    });
  });

  it("returns rate 0 for zero and non-numeric source or destination amounts", async () => {
    const builder = mockPathBuilder([
      {
        source_asset_type: "native",
        source_amount: "0",
        destination_asset_type: "credit_alphanum4",
        destination_asset_code: "USDC",
        destination_asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        destination_amount: "10",
        path: [],
      },
      {
        source_asset_type: "native",
        source_amount: "not-a-number",
        destination_asset_type: "credit_alphanum4",
        destination_asset_code: "USDC",
        destination_asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        destination_amount: "10",
        path: [],
      },
      {
        source_asset_type: "native",
        source_amount: "10",
        destination_asset_type: "credit_alphanum4",
        destination_asset_code: "USDC",
        destination_asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        destination_amount: "NaN",
        path: [],
      },
    ]);
    mockedGetHorizonServer.mockReturnValue({
      strictSendPaths: jest.fn().mockReturnValue(builder),
    } as unknown as ReturnType<typeof getHorizonServer>);

    const paths = await findPaths({
      network: "mainnet",
      direction: "strict-send",
      source: { type: "native", code: "XLM" },
      destination: { type: "credit_alphanum4", code: "USDC", issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN" },
      amount: "10",
    });

    expect(paths.map((path) => path.rate)).toEqual(["0", "0", "0"]);
  });

  it("throws for non-native assets missing an issuer", () => {
    expect(() =>
      toSdkAsset({ type: "credit_alphanum4", code: "USDC" }),
    ).toThrow("Asset USDC requires an issuer");
  });
});
