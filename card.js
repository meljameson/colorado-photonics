import { SITE, loadEvents, isUpcoming, formatDateRange, whereLine } from "./events.js";

const W = 1080;
const PAD = 96;
const FONT = "Inter, system-ui, sans-serif";
const SPECTRUM = ["#7b2ff7", "#2f6bff", "#00c2d1", "#2fd16b", "#ffd400", "#ff8a00", "#ff2d55"];
const C = { bg1: "#0b1026", bg2: "#1d1450", text: "#ffffff", muted: "#b9bedb", accent: "#a99bff" };

const canvas = document.getElementById("card");
const ctx = canvas.getContext("2d");
const select = document.getElementById("event");
const pastBox = document.getElementById("past");
let events = [];

function wrap(text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function setFont(weight, size) {
  ctx.font = `${weight} ${size}px ${FONT}`;
}

function spacedText(text, x, y, spacing) {
  if ("letterSpacing" in ctx) {
    ctx.letterSpacing = `${spacing}px`;
    ctx.fillText(text, x, y);
    ctx.letterSpacing = "0px";
  } else {
    ctx.fillText(text, x, y);
  }
}

function spectrumBar(x, y, w, h) {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  SPECTRUM.forEach((c, i) => g.addColorStop(i / (SPECTRUM.length - 1), c));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
}

function draw(e, H) {
  canvas.width = W;
  canvas.height = H;
  const inner = W - PAD * 2;
  ctx.textBaseline = "top";

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, C.bg1);
  bg.addColorStop(1, C.bg2);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.85, H * 0.15, 0, W * 0.85, H * 0.15, W * 0.8);
  glow.addColorStop(0, "rgba(143,123,255,0.35)");
  glow.addColorStop(1, "rgba(143,123,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Header
  ctx.fillStyle = C.accent;
  setFont(700, 30);
  spacedText(SITE.name.toUpperCase(), PAD, PAD, 6);
  spectrumBar(PAD, PAD + 56, 160, 8);

  // Footer
  const footerY = H - PAD - 44;
  spectrumBar(0, H - 14, W, 14);
  ctx.fillStyle = C.text;
  setFont(700, 38);
  ctx.fillText("Details & registration → link in bio", PAD, footerY);
  if (SITE.instagram) {
    ctx.fillStyle = C.muted;
    setFont(500, 30);
    ctx.fillText(`@${SITE.instagram}`, PAD, footerY - 48);
  }

  // Title: shrink until it fits in 4 lines
  let size = 112;
  let titleLines;
  for (; size >= 60; size -= 4) {
    setFont(800, size);
    titleLines = wrap(e.title, inner);
    if (titleLines.length <= 4 && titleLines.every((l) => ctx.measureText(l).width <= inner)) break;
  }
  const titleLH = Math.round(size * 1.08);

  // Detail rows
  setFont(600, 46);
  const rows = [
    ["When", [formatDateRange(e), e.time].filter(Boolean)],
    ["Where", wrap(whereLine(e), inner).slice(0, 3)],
    ["Who", e.audience ? wrap(e.audience, inner).slice(0, 2) : []],
  ].filter(([, lines]) => lines.length);
  const labelH = 44;
  const valueLH = 58;
  const rowGap = 44;
  const rowsH = rows.reduce((h, [, lines]) => h + labelH + lines.length * valueLH, 0) + rowGap * (rows.length - 1);

  // Center the content block between header and footer
  const top = PAD + 120;
  const bottom = footerY - (SITE.instagram ? 90 : 50);
  const gap = 72;
  const blockH = titleLines.length * titleLH + gap + rowsH;
  let y = top + Math.max(0, (bottom - top - blockH) / 2);

  ctx.fillStyle = C.text;
  setFont(800, size);
  for (const l of titleLines) {
    ctx.fillText(l, PAD - size * 0.04, y);
    y += titleLH;
  }
  y += gap;

  for (const [label, lines] of rows) {
    ctx.fillStyle = C.accent;
    setFont(700, 28);
    spacedText(label.toUpperCase(), PAD, y, 5);
    y += labelH;
    ctx.fillStyle = C.text;
    setFont(600, 46);
    for (const l of lines) {
      ctx.fillText(l, PAD, y);
      y += valueLH;
    }
    y += rowGap;
  }
}

function currentEvent() {
  return events[Number(select.value)];
}

function height() {
  return Number(document.querySelector('input[name="size"]:checked').value);
}

function redraw() {
  const e = currentEvent();
  if (e) draw(e, height());
}

function fillSelect() {
  const prev = currentEvent();
  select.replaceChildren();
  events.forEach((e, i) => {
    if (!pastBox.checked && !isUpcoming(e)) return;
    const opt = new Option(`${e.start} · ${e.title}`, String(i));
    if (e === prev) opt.selected = true;
    select.append(opt);
  });
  if (!select.options.length) select.append(new Option("No upcoming events", ""));
  redraw();
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

document.getElementById("download").addEventListener("click", () => {
  const e = currentEvent();
  if (!e) return;
  canvas.toBlob((blob) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${e.start}-${slug(e.title)}-${W}x${height()}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, "image/png");
});

select.addEventListener("change", redraw);
pastBox.addEventListener("change", fillSelect);
document.querySelectorAll('input[name="size"]').forEach((r) => r.addEventListener("change", redraw));

// Make sure Inter is loaded before drawing, or the canvas falls back to a system font.
await Promise.all(
  ["500 30px Inter", "600 46px Inter", "700 30px Inter", "800 100px Inter"].map((f) => document.fonts.load(f)),
).catch(() => {});
events = await loadEvents();
fillSelect();
