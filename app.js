import { SITE, loadEvents, isUpcoming, formatDateRange, monthKey, monthLabel, parseDate, whereLine } from "./events.js";

const main = document.getElementById("events");

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) if (c != null && c !== "") node.append(c);
  return node;
}

function eventCard(e, past = false) {
  const d = parseDate(e.start);
  const badge = el(
    "div",
    { class: "badge", "aria-hidden": "true" },
    el("span", { class: "badge-dow" }, d.toLocaleDateString("en-US", { weekday: "short" })),
    el("span", { class: "badge-day" }, String(d.getDate())),
  );

  // The middle dot is decorative; screen readers hear a comma instead of "dot".
  const when = e.time
    ? [formatDateRange(e), el("span", { "aria-hidden": "true" }, " · "), el("span", { class: "sr-only" }, ", "), e.time]
    : [formatDateRange(e)];
  const body = el(
    "div",
    { class: "event-body" },
    el("h3", {}, e.title),
    e.summary && el("p", { class: "summary" }, e.summary),
    el("p", { class: "meta" }, ...when),
    whereLine(e) && el("p", { class: "meta" }, whereLine(e)),
    e.host && el("p", { class: "meta" }, `Hosted by ${e.host}`),
    e.audience && el("p", { class: "tag" }, e.audience),
    e.url &&
      el(
        "a",
        { class: past ? "link" : "button", href: e.url, target: "_blank", rel: "noopener" },
        past ? "Event page" : "Event details",
        // Every button says the same thing, so give screen readers which event and where it opens.
        el("span", { class: "sr-only" }, `: ${e.title} (opens in a new tab)`),
      ),
  );

  return el("li", {}, el("article", { class: past ? "event past" : "event" }, badge, body));
}

function byMonth(events, past = false) {
  const groups = new Map();
  for (const e of events) {
    const key = monthKey(e);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }
  return [...groups].map(([key, list]) =>
    el(
      "section",
      { class: "month" },
      el("h2", {}, monthLabel(key)),
      // role="list" keeps list semantics in Safari/VoiceOver, which drops them when list-style is none.
      el("ol", { class: "events", role: "list" }, ...list.map((e) => eventCard(e, past))),
    ),
  );
}

function render(events) {
  const upcoming = events.filter((e) => isUpcoming(e));
  const past = events.filter((e) => !isUpcoming(e)).reverse(); // most recent first

  main.replaceChildren();
  if (upcoming.length) main.append(...byMonth(upcoming));
  else main.append(el("p", { class: "status" }, "No upcoming events right now. Check back soon!"));

  if (past.length) {
    main.append(
      el(
        "details",
        { class: "past-events" },
        el("summary", {}, `Past events (${past.length})`),
        ...byMonth(past, true),
      ),
    );
  }
}

document.title = `${SITE.name} · Events`;
if (SITE.instagram) {
  const a = document.getElementById("ig");
  a.href = `https://instagram.com/${SITE.instagram}`;
  a.textContent = `@${SITE.instagram}`;
  a.hidden = false;
}

loadEvents()
  .then(render)
  .catch((err) => {
    console.error(err);
    main.replaceChildren(el("p", { class: "status", role: "alert" }, "Couldn't load events. Please try again later."));
  })
  .finally(() => main.removeAttribute("aria-busy"));
