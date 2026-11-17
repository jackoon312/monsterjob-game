// Tiny pixel-art toolkit: sprites are authored as ASCII grids ("parts"),
// stamped onto a frame at integer offsets, and outlined automatically.
// No rotation, no sub-pixel positions, no alpha other than 0 or 255.
const { MASTER, hexToRGBA } = require('./palette');

const FRAME = 32; // creature frame size in pixels
const BASELINE = 29; // lowest row a creature may touch (2px clear below)

// rows: array of equal-length strings. '.' is transparent; any other
// character must be a key of `legend` (char -> master palette name).
function part(rows, legend) {
  const w = rows[0].length;
  rows.forEach((row, i) => {
    if (row.length !== w) throw new Error(`part row ${i} is ${row.length} wide, expected ${w}: "${row}"`);
    for (const ch of row) {
      if (ch !== '.' && !legend[ch]) throw new Error(`part uses unknown character "${ch}"`);
    }
  });
  return { w, h: rows.length, rows, legend };
}

function flipX(p) {
  return { ...p, rows: p.rows.map((r) => [...r].reverse().join('')) };
}

class Frame {
  constructor(size = FRAME) {
    this.size = size;
    this.px = new Array(size * size).fill(null); // master palette names
    this.clipped = false;
  }

  set(x, y, name) {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) {
      this.clipped = true;
      return;
    }
    this.px[y * this.size + x] = name;
  }

  // Stamps a part with its top-left at (x, y). The part gets a 1px outline
  // (4-neighbour) drawn first, so it reads clearly against parts beneath it.
  stamp(p, x, y, { outline = true } = {}) {
    const filled = [];
    for (let py = 0; py < p.h; py++) {
      for (let px = 0; px < p.w; px++) {
        const ch = p.rows[py][px];
        if (ch !== '.') filled.push([x + px, y + py, p.legend[ch]]);
      }
    }
    if (outline) {
      for (const [fx, fy] of filled) {
        this.set(fx + 1, fy, 'outline');
        this.set(fx - 1, fy, 'outline');
        this.set(fx, fy + 1, 'outline');
        this.set(fx, fy - 1, 'outline');
      }
    }
    for (const [fx, fy, name] of filled) this.set(fx, fy, name);
    return this;
  }

  // Same shape filled with one flat colour - used for the silhouette test.
  silhouette(name = 'cream') {
    const f = new Frame(this.size);
    f.px = this.px.map((p) => (p ? name : null));
    return f;
  }

  colours() {
    return new Set(this.px.filter(Boolean));
  }

  lowestRow() {
    for (let y = this.size - 1; y >= 0; y--) {
      for (let x = 0; x < this.size; x++) if (this.px[y * this.size + x]) return y;
    }
    return -1;
  }
}

// Lays frames out on a grid and returns { width, height, rgba }.
// background: optional hex colour (contact sheets); default transparent.
function compose(frames, columns, { scale = 1, background = null, gap = 0 } = {}) {
  const size = frames[0].size;
  const rows = Math.ceil(frames.length / columns);
  const cell = size * scale + gap;
  const width = columns * cell + gap;
  const height = rows * cell + gap;
  const rgba = new Uint8Array(width * height * 4);
  if (background) {
    const bg = hexToRGBA(background);
    for (let i = 0; i < width * height; i++) rgba.set(bg, i * 4);
  }
  frames.forEach((frame, index) => {
    const ox = gap + (index % columns) * cell;
    const oy = gap + Math.floor(index / columns) * cell;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const name = frame.px[y * size + x];
        if (!name) continue;
        const colour = hexToRGBA(MASTER[name]);
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            rgba.set(colour, ((oy + y * scale + sy) * width + ox + x * scale + sx) * 4);
          }
        }
      }
    }
  });
  return { width, height, rgba };
}

module.exports = { FRAME, BASELINE, part, flipX, Frame, compose };
