/**
 * A generated avatar, derived from a contact's phone number.
 *
 * Same number in, same picture out, every time and on every machine: the number
 * is hashed into a seed and the seed drives everything, so nothing here is
 * random at run time. That matters because the result is saved as the contact's
 * photo, and a contact whose face changed on each render would be a bug.
 *
 * The output is dithered for the same reason the directory has a print view: a
 * phone book printed faces as 1-bit halftones.
 */

/** 4x4 Bayer matrix, the classic newsprint halftone pattern. */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const BAYER_SIZE = 4;

const GRID = 8;
const SIZE = 256;

/** Digits only, so formatting differences do not produce different faces. */
export function phoneSeedSource(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** FNV-1a. Small, stable, and good enough to spread short digit strings. */
function hash(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: a tiny seeded generator, so the drawing is reproducible. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build the tone grid. Only the left half is generated and then mirrored, which
 * is what makes an identicon read as a face rather than as noise.
 */
function toneGrid(seed: number): number[][] {
  const random = seeded(seed);
  const half = Math.ceil(GRID / 2);

  return Array.from({ length: GRID }, () => {
    const left = Array.from({ length: half }, () => random());
    const right = [...left].reverse().slice(GRID % 2 === 0 ? 0 : 1);
    return [...left, ...right];
  });
}

/**
 * Draw the grid at full size, then threshold each pixel against its place in
 * the Bayer matrix. Returns a PNG data URL, or null if canvas is unavailable.
 */
export function phoneAvatarDataUrl(phone: string): string | null {
  const digits = phoneSeedSource(phone);
  if (!digits) return null;

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;

  const context = canvas.getContext("2d");
  if (!context) return null;

  const grid = toneGrid(hash(digits));
  const cell = SIZE / GRID;

  for (let row = 0; row < GRID; row += 1) {
    for (let column = 0; column < GRID; column += 1) {
      for (let y = 0; y < cell; y += 1) {
        for (let x = 0; x < cell; x += 1) {
          const pixelX = column * cell + x;
          const pixelY = row * cell + y;
          const bias =
            ((BAYER[pixelY % BAYER_SIZE][pixelX % BAYER_SIZE] + 0.5) / 16 - 0.5);
          const on = grid[row][column] + bias >= 0.5;

          context.fillStyle = on ? "#000000" : "#ffffff";
          context.fillRect(pixelX, pixelY, 1, 1);
        }
      }
    }
  }

  return canvas.toDataURL("image/png");
}
