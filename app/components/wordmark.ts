/**
 * Canvas-rendered "ORSI" wordmark made of a fixed grid of pixel tiles.
 * The crisp text is rendered once to an offscreen "master" canvas and cut into square
 * tiles. At rest the tiles sit edge to edge, so it reads as solid type. A "swipe" is a
 * band that travels left to right across the word: tiles inside the band shrink in
 * place (opening gaps between them) and nudge in the swipe direction, then heal back
 * to solid once the band has passed. The word itself never changes size.
 */

const TEXT = "ORSI";
const TRACKING = 0.04; // letter-spacing, in em

export type Swipe = {
  pos: number; // band centre: 0 = left edge of the word, 1 = right edge
  amp: number; // 0..1 strength
};

export type WordmarkFrame = {
  swipes: Swipe[];
  /** Intro: tiles to the right of this (0..1 across the word) are not drawn yet. */
  reveal: number;
  alpha: number;
};

const LEAD = 0.025; // sharpness of the band's leading edge (fraction of word width)
const TRAIL = 0.06; // length of the healing tail behind it
const MAX_GAP = 0.42; // gap at full strength, as a fraction of tile size
// Rightward nudge. Half the gap keeps every tile inside its own cell (no overlap).
const PUSH = MAX_GAP / 2;

/** Strength of a swipe at horizontal position x (both in word-relative units). */
function band(x: number, s: Swipe) {
  const d = x - s.pos;
  const w = d > 0 ? LEAD : TRAIL;
  return s.amp * Math.exp(-(d * d) / (2 * w * w));
}

export function createWordmark(canvas: HTMLCanvasElement, family: string) {
  const ctx = canvas.getContext("2d")!;
  const master = document.createElement("canvas");
  let tiles: { x: number; y: number }[] = []; // top-left of each non-empty tile, device px
  let tile = 1; // tile size, device px
  let left = 0; // word extent, device px
  let right = 1;

  let dpr = 1;
  let W = 0; // device px
  let H = 0;
  let fontSize = 0; // CSS px

  const layout = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    W = Math.round(cssW * dpr);
    H = Math.round(cssH * dpr);
    canvas.width = master.width = W;
    canvas.height = master.height = H;
    fontSize = Math.min(320, Math.max(80, window.innerWidth * 0.24));
    renderMaster();
  };

  const renderMaster = () => {
    const m = master.getContext("2d")!;
    m.setTransform(dpr, 0, 0, dpr, 0, 0);
    m.clearRect(0, 0, W, H);
    m.font = `900 ${fontSize}px ${family}`;
    m.textBaseline = "alphabetic";

    const tracking = fontSize * TRACKING;
    const widths = [...TEXT].map((ch) => m.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0) + tracking * (TEXT.length - 1);
    const metrics = m.measureText(TEXT);
    const ascent = metrics.actualBoundingBoxAscent;
    const descent = metrics.actualBoundingBoxDescent;
    const cssW = W / dpr;
    const cssH = H / dpr;
    const top = (cssH - (ascent + descent)) / 2;
    const baseline = top + ascent;

    m.fillStyle = "#ffffff";

    left = ((cssW - total) / 2) * dpr;
    right = ((cssW + total) / 2) * dpr;
    let x = (cssW - total) / 2;
    [...TEXT].forEach((ch, i) => {
      m.fillText(ch, x, baseline);
      x += widths[i] + tracking;
    });

    // Cut into tiles on a grid centred on the canvas, keeping only tiles with ink.
    tile = Math.max(6, Math.round(fontSize * 0.04)) * dpr;
    const ox = Math.round(W / 2 - Math.ceil(W / 2 / tile) * tile);
    const oy = Math.round(H / 2 - Math.ceil(H / 2 / tile) * tile);
    const data = m.getImageData(0, 0, W, H).data;
    const step = Math.max(1, Math.floor(tile / 4));
    tiles = [];
    for (let ty = oy; ty < H; ty += tile) {
      for (let tx = ox; tx < W; tx += tile) {
        let ink = false;
        for (let y = Math.max(0, ty); y < Math.min(H, ty + tile) && !ink; y += step) {
          for (let x = Math.max(0, tx); x < Math.min(W, tx + tile); x += step) {
            if (data[(y * W + x) * 4 + 3] > 8) {
              ink = true;
              break;
            }
          }
        }
        if (ink) tiles.push({ x: tx, y: ty });
      }
    }
  };

  const draw = ({ swipes, reveal, alpha }: WordmarkFrame) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (alpha <= 0) return;
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = true;

    const active = swipes.filter((s) => s.amp > 0.001);
    if (active.length === 0 && reveal >= 1.5) {
      ctx.drawImage(master, 0, 0); // fully at rest: solid wordmark
      ctx.globalAlpha = 1;
      return;
    }

    const span = right - left;
    const half = tile / 2;
    for (const t of tiles) {
      const xn = (t.x + half - left) / span;
      if (xn > reveal) continue;
      let k = 0;
      for (const s of active) k = Math.max(k, band(xn, s));
      if (k < 0.004) {
        ctx.drawImage(master, t.x, t.y, tile, tile, t.x, t.y, tile, tile);
        continue;
      }
      // Shrink the tile about its own centre (opens gaps; nothing moves vertically)
      // and nudge it along the swipe direction.
      const size = tile * (1 - MAX_GAP * k);
      const dx = t.x + half - size / 2 + tile * PUSH * k;
      const dy = t.y + half - size / 2;
      ctx.drawImage(master, t.x, t.y, tile, tile, dx, dy, size, size);
    }
    ctx.globalAlpha = 1;
  };

  return {
    layout,
    draw,
    get fontSize() {
      return fontSize;
    },
  };
}
