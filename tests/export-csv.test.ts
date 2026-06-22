import {
  buildCsvFilename,
  buildPathsCsv,
  exportPathsAsCsv,
} from "@/lib/export-csv";
import type { Path } from "@/types/path";

const ISSUER = "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA";

const samplePaths: Path[] = [
  {
    source: { type: "native", code: "XLM" },
    destination: { type: "credit_alphanum4", code: "USDC", issuer: ISSUER },
    sourceAmount: "100.0000000",
    destinationAmount: "25.1234567",
    hops: [
      { type: "credit_alphanum4", code: "AQUA", issuer: ISSUER },
      { type: "credit_alphanum4", code: 'USD"C', issuer: ISSUER },
    ],
    rate: "0.2512346",
  },
  {
    source: { type: "native", code: "XLM" },
    destination: { type: "credit_alphanum4", code: "USDC", issuer: ISSUER },
    sourceAmount: "150.0000000",
    destinationAmount: "37.5000000",
    hops: [],
    rate: "0.2500000",
  },
];

describe("buildPathsCsv", () => {
  it("builds one row per path with the requested columns", () => {
    const csv = buildPathsCsv(samplePaths);
    const lines = csv.split("\r\n");

    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe(
      "Pair,Source Asset,Destination Asset,Send Amount,Receive Amount,Rate,Hops,Hop Assets",
    );
    expect(lines[1]).toContain("XLM -> USDC");
    expect(lines[1]).toContain("100.0000000,25.1234567,0.2512346,2");
    expect(lines[2]).toContain("150.0000000,37.5000000,0.2500000,0,");
  });

  it("keeps comma-separated hop assets inside one quoted CSV cell", () => {
    const csv = buildPathsCsv(samplePaths);

    expect(csv).toContain(
      '"AQUA:GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA, USD""C:GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA"',
    );
  });
});

describe("buildCsvFilename", () => {
  it("uses the first path pair and timestamp", () => {
    expect(buildCsvFilename(samplePaths, 1234567890)).toBe(
      "xlm-usdc-1234567890.csv",
    );
  });
});

describe("exportPathsAsCsv", () => {
  const originalDocument = global.document;
  const originalDateNow = Date.now;

  afterEach(() => {
    global.document = originalDocument;
    Date.now = originalDateNow;
  });

  it("creates a temporary CSV download link and clicks it", () => {
    const click = jest.fn();
    const remove = jest.fn();
    const link = {
      click,
      download: "",
      href: "",
      remove,
      style: { display: "" },
    } as HTMLAnchorElement;
    const appendChild = jest.fn();

    global.document = {
      body: { appendChild },
      createElement: jest.fn(() => link),
    } as unknown as Document;
    Date.now = jest.fn(() => 1234567890);

    exportPathsAsCsv(samplePaths);

    expect(global.document.createElement).toHaveBeenCalledWith("a");
    expect(link.download).toBe("xlm-usdc-1234567890.csv");
    expect(link.href).toContain("data:text/csv;charset=utf-8,");
    expect(decodeURIComponent(link.href)).toContain("\uFEFFPair,Source Asset");
    expect(appendChild).toHaveBeenCalledWith(link);
    expect(click).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
