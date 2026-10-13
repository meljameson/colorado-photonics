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

function eventCard(e) {
  const d = parseDate(e.start);
  const badge = el(
    "div",
    { class: "badge", "aria-hidden": "true" },
    el("span", { class: "badge-dow" }, d.toLocaleDateString("en-US", { weekday: "short" })),
    el("span", { class: "badge-day" }, String(d.getDate())),
  );

  const when = e.time ? `${formatDateRange(e)} · ${e.time}` : formatDateRange(e);
  const body = el(
    "div",
    { class: "event-body" },
    el("h3", {}, e.title),
    e.summary && el("p", { class: "summary" }, e.summary),
    el("p", { class: "meta" }, when),
    whereLine(e) && el("p", { class: "meta" }, whereLine(e)),
    e.host && el("p", { class: "meta" }, `Hosted by ${e.host}`),
    e.audience && el("p", { class: "tag" }, e.audience),
    e.url &&
      el("a", { class: "button", href: e.url, target: "_blank", rel: "noopener" }, "Event details"),
  );

  return el("li", {}, el("article", { class: "event" }, badge, body));
}

function render(events) {
  main.replaceChildren();
  if (!events.length) {
    main.append(el("p", { class: "status" }, "No upcoming events right now. Check back soon!"));
    return;
  }

  const groups = new Map();
  for (const e of events) {
    const key = monthKey(e);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }

  for (const [key, list] of groups) {
    main.append(
      el(
        "section",
        { class: "month" },
        el("h2", {}, monthLabel(key)),
        el("ol", { class: "events" }, ...list.map(eventCard)),
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
  .then((events) => render(events.filter((e) => isUpcoming(e))))
  .catch((err) => {
    console.error(err);
    main.replaceChildren(el("p", { class: "status" }, "Couldn't load events. Please try again later."));
  });
