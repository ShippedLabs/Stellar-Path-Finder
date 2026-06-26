/**
 * Generates the PWA app icons for Stellar Path Finder.
 *
 * Uses only Node.js built-ins (zlib + Buffer) so it adds NO runtime or
 * dev dependency to the project — run it once with `node scripts/generate-icons.js`.
 * It renders a "path finder" route glyph (connected nodes) in sky blue on the
 * app's #020617 background and writes valid RGBA PNGs into public/.
 *
 * Outputs:
 *   public/icon-192.png          192x192, purpose "any"
 *   public/icon-512.png          512x512, purpose "any"
 *   public/icon-maskable-512.png 512x512, purpose "maskable" (glyph kept
 *                                inside the center safe zone so Android's
 *                                circle mask never clips it)
 */

const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

// --- PNG encoding (zlib-only, no dependencies) ---------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(size, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); // width
  ihdr.writeUInt32BE(size, 4); // height
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter type 0 (none) per scanline
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// --- Glyph rendering -----------------------------------------------------

const BG = [2, 6, 23]; // #020617 — matches the layout's bg-slate-950
const LINE = [56, 189, 248]; // #38bdf8 — sky-400
const NODE = [226, 232, 240]; // #e2e8f0 — slate-200

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function blend(rgba, idx, color, alpha) {
  rgba[idx] = Math.round(color[0] * alpha + rgba[idx] * (1 - alpha));
  rgba[idx + 1] = Math.round(color[1] * alpha + rgba[idx + 1] * (1 - alpha));
  rgba[idx + 2] = Math.round(color[2] * alpha + rgba[idx + 2] * (1 - alpha));
  rgba[idx + 3] = 255;
}

function renderIcon(size, maskable) {
  const rgba = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    rgba[i * 4] = BG[0];
    rgba[i * 4 + 1] = BG[1];
    rgba[i * 4 + 2] = BG[2];
    rgba[i * 4 + 3] = 255;
  }

  const center = size / 2;
  // Smaller extent for maskable so the glyph stays inside the safe zone.
  const half = center * (maskable ? 0.5 : 0.66);

  // A winding route: four waypoints connected in order.
  const norm = [
    [-0.8, 0.5],
    [-0.15, -0.6],
    [0.45, 0.2],
    [0.85, -0.7],
  ];
  const nodes = norm.map(([nx, ny]) => [center + nx * half, center + ny * half]);

  const lineHalf = size * 0.024;
  const nodeR = size * 0.072;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const px = x + 0.5;
      const py = y + 0.5;

      // Connecting lines.
      let lineCov = 0;
      for (let i = 0; i < nodes.length - 1; i++) {
        const d = distToSegment(px, py, nodes[i][0], nodes[i][1], nodes[i + 1][0], nodes[i + 1][1]);
        lineCov = Math.max(lineCov, clamp01(lineHalf - d + 0.5));
      }
      if (lineCov > 0) blend(rgba, idx, LINE, lineCov);

      // Waypoint nodes drawn on top.
      let nodeCov = 0;
      for (const [nx, ny] of nodes) {
        const d = Math.hypot(px - nx, py - ny);
        nodeCov = Math.max(nodeCov, clamp01(nodeR - d + 0.5));
      }
      if (nodeCov > 0) blend(rgba, idx, NODE, nodeCov);
    }
  }

  return encodePNG(size, rgba);
}

// --- Write files ---------------------------------------------------------

const publicDir = path.join(__dirname, "..", "public");
fs.mkdirSync(publicDir, { recursive: true });

const targets = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "icon-maskable-512.png", size: 512, maskable: true },
];

for (const { file, size, maskable } of targets) {
  const png = renderIcon(size, maskable);
  fs.writeFileSync(path.join(publicDir, file), png);
  console.log(`wrote public/${file} (${size}x${size}, ${png.length} bytes)`);
}
