// Shared by the public page (app.js) and the card generator (card.js).

export const SITE = {
  name: "Colorado Photonics",
  tagline: "Optics & photonics events across Colorado",
  instagram: "coloradophotonics",
};

export async function loadEvents() {
  const res = await fetch("events.json", { cache: "no-cache" });
  if (!res.ok) throw new Error(`Could not load events.json (${res.status})`);
  const raw = await res.json();
  return raw
    .filter((e) => {
      const ok = e && e.title && /^\d{4}-\d{2}-\d{2}$/.test(e.start || "");
      if (!ok) console.warn("Skipping event with missing title or bad start date:", e);
      return ok;
    })
    .map((e) => ({ ...e, end: e.end || e.start }))
    .sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
}

// "YYYY-MM-DD" -> local Date (avoids the UTC off-by-one from new Date("YYYY-MM-DD")).
export function parseDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// An event stays visible through its last day.
export const isUpcoming = (e, today = todayISO()) => e.end >= today;

const monthName = (d) => d.toLocaleDateString("en-US", { month: "long" });

// November 8, 2026 · November 8–12, 2026 · October 30 – November 2, 2026
export function formatDateRange(e) {
  if (e.dateText) return e.dateText; // for unconfirmed dates, e.g. "November 16 or 18, 2026 (date TBC)"
  const s = parseDate(e.start);
  const t = parseDate(e.end);
  const sy = s.getFullYear();
  const ty = t.getFullYear();
  if (e.start === e.end) return `${monthName(s)} ${s.getDate()}, ${sy}`;
  if (sy === ty && s.getMonth() === t.getMonth()) {
    return `${monthName(s)} ${s.getDate()}–${t.getDate()}, ${sy}`;
  }
  if (sy === ty) return `${monthName(s)} ${s.getDate()} – ${monthName(t)} ${t.getDate()}, ${sy}`;
  return `${monthName(s)} ${s.getDate()}, ${sy} – ${monthName(t)} ${t.getDate()}, ${ty}`;
}

export const monthKey = (e) => e.start.slice(0, 7);

export function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function whereLine(e) {
  return [e.venue, e.city].filter(Boolean).join(", ");
}
