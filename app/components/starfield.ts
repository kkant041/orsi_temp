type Star = { x: number; y: number; z: number; pz: number; hue: number; sat: number };

const STAR_COUNT = 700;
const SPEED = 0.0016; // constant drift; the stars ignore the heartbeat

export function createStarfield(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  let w = 0;
  let h = 0;

  const layout = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const spawn = (s?: Star): Star => {
    const z = s ? 1 : Math.random();
    const star = s ?? ({} as Star);
    star.x = (Math.random() - 0.5) * 2;
    star.y = (Math.random() - 0.5) * 2;
    star.z = z;
    star.pz = z;
    // Mostly white stars, with a few warm orange embers.
    const ember = Math.random() < 0.18;
    star.hue = 18 + Math.random() * 18;
    star.sat = ember ? 100 : 0;
    return star;
  };
  const stars = Array.from({ length: STAR_COUNT }, () => spawn());

  const draw = (reduced: boolean) => {
    const speed = reduced ? 0.0003 : SPEED;
    ctx.fillStyle = "rgba(5, 4, 4, 0.35)";
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.max(w, h) * 0.5;

    for (const s of stars) {
      s.pz = s.z;
      s.z -= speed;
      if (s.z <= 0.02) {
        spawn(s);
        continue;
      }
      const sx = cx + (s.x / s.z) * scale;
      const sy = cy + (s.y / s.z) * scale;
      if (sx < -50 || sx > w + 50 || sy < -50 || sy > h + 50) {
        spawn(s);
        continue;
      }
      const px = cx + (s.x / s.pz) * scale;
      const py = cy + (s.y / s.pz) * scale;
      const depth = 1 - s.z;
      ctx.strokeStyle = `hsla(${s.hue}, ${s.sat}%, ${s.sat ? 55 + depth * 20 : 75 + depth * 25}%, ${Math.min(1, depth * 1.4)})`;
      ctx.lineWidth = Math.max(0.4, depth * 2.2);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(sx, sy);
      ctx.stroke();
    }
  };

  return { layout, draw };
}
