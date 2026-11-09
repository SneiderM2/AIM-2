const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 calculation for PNG chunks
function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function createPng(width, height, getPixel) {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(rowLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = getPixel(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  return Buffer.concat([
    header,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

// Distance to line segment
function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// Check point in shield shape (normalized 0-1)
function isInsideShield(nx, ny) {
  // Center is x=0.5. Top peak at (0.5, 0.15)
  // Left top at (0.22, 0.26), Right top at (0.78, 0.26)
  // Left mid at (0.22, 0.55), Right mid at (0.78, 0.55)
  // Bottom point at (0.5, 0.88)
  if (ny < 0.15 || ny > 0.88) return false;
  if (nx < 0.22 || nx > 0.78) return false;

  const dx = Math.abs(nx - 0.5);
  // Top slant
  if (ny < 0.26) {
    const maxDx = (ny - 0.15) / (0.26 - 0.15) * 0.28;
    if (dx > maxDx) return false;
  }
  // Bottom curve
  if (ny > 0.55) {
    const t = (ny - 0.55) / (0.88 - 0.55);
    const maxDx = 0.28 * Math.sqrt(Math.max(0, 1 - t * t));
    if (dx > maxDx) return false;
  }
  return true;
}

function renderSgiPixel(x, y, width, height, isMaskable = false) {
  const nx = x / width;
  const ny = y / height;

  // Background: Rich Navy Gradient (#005088 -> #1B365D)
  const bgR = Math.round(0 + (27 - 0) * ny);
  const bgG = Math.round(80 + (54 - 80) * ny);
  const bgB = Math.round(136 + (93 - 136) * ny);

  // Rounded corners for non-maskable icons
  if (!isMaskable) {
    const cornerRadius = 0.22;
    const cx = nx < 0.5 ? cornerRadius : 1 - cornerRadius;
    const cy = ny < 0.5 ? cornerRadius : 1 - cornerRadius;
    if (
      (nx < cornerRadius || nx > 1 - cornerRadius) &&
      (ny < cornerRadius || ny > 1 - cornerRadius)
    ) {
      const d = Math.hypot(nx - cx, ny - cy);
      if (d > cornerRadius) {
        return [0, 0, 0, 0]; // Transparent
      }
    }
  }

  // Emerald Shield Contour & Fill
  const insideShield = isInsideShield(nx, ny);
  let r = bgR, g = bgG, b = bgB, a = 255;

  if (insideShield) {
    // Shield fill: Emerald overlay
    r = Math.round(r * 0.75 + 0 * 0.25);
    g = Math.round(g * 0.75 + 128 * 0.25);
    b = Math.round(b * 0.75 + 90 * 0.25);
  }

  // Draw Shield Border (#11CAA0)
  const shieldStrokeWidth = 0.024;
  const shieldBorderDist = Math.min(
    distToSegment(nx, ny, 0.5, 0.15, 0.22, 0.26),
    distToSegment(nx, ny, 0.5, 0.15, 0.78, 0.26),
    distToSegment(nx, ny, 0.22, 0.26, 0.22, 0.55),
    distToSegment(nx, ny, 0.78, 0.26, 0.78, 0.55),
    distToSegment(nx, ny, 0.22, 0.55, 0.35, 0.75),
    distToSegment(nx, ny, 0.78, 0.55, 0.65, 0.75),
    distToSegment(nx, ny, 0.35, 0.75, 0.5, 0.88),
    distToSegment(nx, ny, 0.65, 0.75, 0.5, 0.88)
  );

  if (shieldBorderDist < shieldStrokeWidth) {
    // Emerald green (#11CAA0)
    return [17, 202, 160, 255];
  }

  // White House / Building Structure
  const roofDist = Math.min(
    distToSegment(nx, ny, 0.33, 0.48, 0.50, 0.34),
    distToSegment(nx, ny, 0.50, 0.34, 0.67, 0.48)
  );
  if (roofDist < 0.026) {
    return [255, 255, 255, 255]; // White Roof
  }

  const wallsDist = Math.min(
    distToSegment(nx, ny, 0.38, 0.47, 0.38, 0.66),
    distToSegment(nx, ny, 0.62, 0.47, 0.62, 0.66),
    distToSegment(nx, ny, 0.38, 0.66, 0.62, 0.66)
  );
  if (wallsDist < 0.022) {
    return [255, 255, 255, 255]; // White Walls
  }

  // Key Head (Circle in center: cx=0.5, cy=0.51, r=0.045)
  const keyDist = Math.hypot(nx - 0.5, ny - 0.51);
  if (keyDist < 0.045) {
    return [17, 202, 160, 255]; // Emerald Key Head
  }

  // Key Shaft and Teeth
  const keyShaftDist = distToSegment(nx, ny, 0.5, 0.55, 0.5, 0.68);
  const keyTooth1 = distToSegment(nx, ny, 0.5, 0.62, 0.55, 0.62);
  const keyTooth2 = distToSegment(nx, ny, 0.5, 0.66, 0.54, 0.66);
  if (Math.min(keyShaftDist, keyTooth1, keyTooth2) < 0.02) {
    return [17, 202, 160, 255]; // Emerald Key Teeth
  }

  return [r, g, b, a];
}

const publicDir = path.resolve(__dirname, '../public');
const iconsDir = path.join(publicDir, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

// 1. Generate SVG Icon
const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sgiBg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#005088" />
      <stop offset="100%" stop-color="#1B365D" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.35" />
    </filter>
  </defs>
  <!-- Background Canvas -->
  <rect width="512" height="512" rx="112" fill="url(#sgiBg)"/>
  <g filter="url(#shadow)">
    <!-- 1. Escudo Protector Exterior -->
    <path
      d="M256 70 L110 135 V245 C110 350 180 432 256 455 C332 432 402 350 402 245 V135 L256 70 Z"
      stroke="#11CAA0"
      stroke-width="26"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="rgba(0, 128, 90, 0.22)"
    />
    <!-- 2. Estructura Inmobiliaria (Techo y Fachada) -->
    <path
      d="M170 250 L256 180 L342 250"
      stroke="#FFFFFF"
      stroke-width="24"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M195 240 V345 H317 V240"
      stroke="#FFFFFF"
      stroke-width="22"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <!-- 3. Llave Digital Maestra -->
    <circle cx="256" cy="265" r="28" fill="#11CAA0" />
    <path
      d="M256 293 V358 M256 325 H286 M256 350 H280"
      stroke="#11CAA0"
      stroke-width="22"
      stroke-linecap="round"
    />
  </g>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
console.log('✓ Created SVG icons');

// 2. Generate PNG Icons
const targets = [
  { name: 'icon-192.png', size: 192, maskable: false, dest: iconsDir },
  { name: 'icon-512.png', size: 512, maskable: false, dest: iconsDir },
  { name: 'icon-maskable-192.png', size: 192, maskable: true, dest: iconsDir },
  { name: 'icon-maskable-512.png', size: 512, maskable: true, dest: iconsDir },
  { name: 'apple-touch-icon.png', size: 180, maskable: false, dest: publicDir },
  { name: 'favicon-32x32.png', size: 32, maskable: false, dest: iconsDir },
  { name: 'favicon.ico', size: 32, maskable: false, dest: publicDir },
];

targets.forEach(({ name, size, maskable, dest }) => {
  const buf = createPng(size, size, (x, y, w, h) => renderSgiPixel(x, y, w, h, maskable));
  fs.writeFileSync(path.join(dest, name), buf);
  console.log(`✓ Generated ${name} (${size}x${size})`);
});
