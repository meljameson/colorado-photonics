import { SITE, loadEvents, isUpcoming, formatDateRange, whereLine } from "./events.js";

const W = 1080;
const PAD = 96;
const FONT = "Inter, system-ui, sans-serif";
const SPECTRUM = ["#7b2ff7", "#2f6bff", "#00c2d1", "#2fd16b", "#ffd400", "#ff8a00", "#ff2d55"];
const C = { bg1: "#0c1a2e", bg2: "#16304f", text: "#ffffff", muted: "#c8d1e0", accent: "#f2b632" };

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
  glow.addColorStop(0, "rgba(96,156,230,0.22)");
  glow.addColorStop(1, "rgba(96,156,230,0)");
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
  ctx.fillText("Event details → link in bio", PAD, footerY);

  // Lay out the content block, scaling it down until it fits between header and footer.
  const top = PAD + 110;
  const bottom = footerY - 50;
  let L;
  for (let k = 1; k >= 0.6; k -= 0.05) {
    L = layout(e, inner, k);
    if (L.height <= bottom - top) break;
  }
  if (L.height > bottom - top) console.warn(`Card content overflows by ${Math.round(L.height - (bottom - top))}px`);
  let y = top + Math.max(0, (bottom - top - L.height) / 2);

  ctx.fillStyle = C.text;
  setFont(800, L.title.size);
  for (const l of L.title.lines) {
    ctx.fillText(l, PAD - L.title.size * 0.04, y);
    y += L.title.lh;
  }
  if (L.summary.lines.length) {
    y += L.summary.gap;
    ctx.fillStyle = C.muted;
    setFont(500, L.summary.size);
    for (const l of L.summary.lines) {
      ctx.fillText(l, PAD, y);
      y += L.summary.lh;
    }
  }
  y += L.gap;

  for (const [label, lines] of L.rows.items) {
    ctx.fillStyle = C.accent;
    setFont(700, L.rows.labelSize);
    spacedText(label.toUpperCase(), PAD, y, 5);
    y += L.rows.labelH;
    ctx.fillStyle = C.text;
    setFont(600, L.rows.size);
    for (const l of lines) {
      ctx.fillText(l, PAD, y);
      y += L.rows.lh;
    }
    y += L.rows.gap;
  }
}

// Measure everything at scale k without drawing.
function layout(e, inner, k) {
  const px = (n) => Math.round(n * k);

  // Title: largest size that fits in 4 lines
  let size = px(104);
  let lines;
  for (; size >= 48; size -= 4) {
    setFont(800, size);
    lines = wrap(e.title, inner);
    if (lines.length <= 4 && lines.every((l) => ctx.measureText(l).width <= inner)) break;
  }
  const title = { size, lines, lh: Math.round(size * 1.08) };

  // One-line "about" under the title
  const summary = { size: px(40), lh: px(54), gap: px(28), lines: [] };
  setFont(500, summary.size);
  if (e.summary) summary.lines = wrap(e.summary, inner).slice(0, 3);

  // Detail rows
  const rows = { size: px(42), lh: px(54), labelSize: px(26), labelH: px(40), gap: px(36) };
  setFont(600, rows.size);
  rows.items = [
    ["When", [formatDateRange(e), e.time].filter(Boolean)],
    ["Where", wrap(whereLine(e), inner).slice(0, 2)],
    ["Hosted by", e.host ? wrap(e.host, inner).slice(0, 3) : []],
    ["Who", e.audience ? wrap(e.audience, inner).slice(0, 2) : []],
  ].filter(([, l]) => l.length);

  const gap = px(64);
  const titleH = title.lines.length * title.lh;
  const summaryH = summary.lines.length ? summary.gap + summary.lines.length * summary.lh : 0;
  const rowsH =
    rows.items.reduce((h, [, l]) => h + rows.labelH + l.length * rows.lh, 0) + rows.gap * (rows.items.length - 1);
  return { title, summary, rows, gap, height: titleH + summaryH + gap + rowsH };
}

function currentEvent() {
  return events[Number(select.value)];
}

function height() {
  return Number(document.querySelector('input[name="size"]:checked').value);
}

// Screen readers can't read text baked into an image, so spell the card out for Instagram's alt text field.
function altText(e) {
  const parts = [`Event announcement from ${SITE.name}: ${e.title}.`];
  if (e.summary) parts.push(`${e.summary}.`);
  parts.push(`When: ${[formatDateRange(e), e.time].filter(Boolean).join(", ")}.`);
  if (whereLine(e)) parts.push(`Where: ${whereLine(e)}.`);
  if (e.host) parts.push(`Hosted by ${e.host}.`);
  if (e.audience) parts.push(`Who: ${e.audience}.`);
  parts.push("Event details at the link in bio.");
  return parts.join(" ");
}

const altBox = document.getElementById("alt");

function redraw() {
  const e = currentEvent();
  if (!e) return;
  draw(e, height());
  altBox.value = altText(e);
  canvas.setAttribute("aria-label", altBox.value);
}

document.getElementById("copy-alt").addEventListener("click", async (ev) => {
  try {
    await navigator.clipboard.writeText(altBox.value);
    ev.target.textContent = "Copied!";
  } catch {
    altBox.select();
    ev.target.textContent = "Press Ctrl+C / ⌘C to copy";
  }
  setTimeout(() => (ev.target.textContent = "Copy alt text"), 2000);
});

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
