# Colorado Photonics Events

A mobile-friendly "link in bio" page for Instagram, plus a generator for Instagram event cards. Both use the same `events.json`.

| File | What it is |
| --- | --- |
| `events.json` | **The only file you edit.** One entry per event. |
| `index.html` | The public page. Shows upcoming events grouped by month, sorted by date. Past events are hidden automatically. |
| `card.html` | A tool for generation Instagram cards. Pick an event and download 4:5 PNG. |
| `events.js`, `app.js`, `card.js`, `style.css` | Code. `events.js` also has `SITE` settings (name, Instagram handle). |

## Adding an event

Add an entry to `events.json`:

```json
{
  "title": "IEEE Photonics Conference",
  "start": "2026-11-08",
  "end": "2026-11-12",
  "time": "9:00 AM – 5:00 PM",
  "venue": "Denver Marriott Tech Center",
  "city": "Denver",
  "host": "IEEE Photonics Society",
  "summary": "One line on what the event is about",
  "audience": "Students & professionals",
  "url": "https://organizer-site.example/register"
}
```

- `title` and `start` (`YYYY-MM-DD`) are required.
- `end` is optional. Leave it out for one-day events.
- `time`, `venue`, `city`, `host`, `summary`, `audience`, `url` are optional.
- `dateText` (optional) replaces the displayed date when it isn't final, e.g. `"November 16 or 18, 2026 (date TBC)"`. Set `start`/`end` to the earliest and latest possible days so the event sorts and expires correctly.
- `summary` is a single line that says what the event is about. It appears under the title.
- Keep to facts that rarely change. Leave registration status, cost and deadlines to the organizer's page, which `url` links to as Event details.
- Separate entries with commas, and put no comma after the last one. If the page shows "Couldn't load events", check for a missing or extra comma.
- Order doesn't matter, because the site sorts entries by date. An event disappears the day after its `end` date.

## Local Development

Browsers block `fetch` of `events.json` when you open files directly from disk, so preview with a local server:

```sh
python3 -m http.server 8000
```

View from <http://localhost:8000> and <http://localhost:8000/card.html>.
