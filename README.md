# Colorado Photonics Events

A mobile-friendly "link in bio" page for Instagram, plus a generator for Instagram event cards. Both use the same `events.json`.

| File | What it is |
| --- | --- |
| `events.json` | **The only file you edit.** One entry per event. |
| `index.html` | The public page. Shows upcoming events grouped by month, sorted by date. Past events are hidden automatically. |
| `card.html` | Your private tool for Instagram cards. Pick an event and download a 1080×1440 or 1080×1350 PNG. |
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
  "audience": "Students & professionals",
  "url": "https://organizer-site.example/register"
}
```

- `title` and `start` (`YYYY-MM-DD`) are required.
- `end` is optional. Leave it out for one-day events.
- `time`, `venue`, `city`, `audience`, `url` are optional.
- Separate entries with commas, and put no comma after the last one. If the page shows "Couldn't load events", check for a missing or extra comma.
- Order doesn't matter, because the site sorts entries by date. An event disappears the day after its `end` date.

Then commit and push. GitHub Pages updates within a minute or two.

## Making an Instagram card

Open `https://<your-username>.github.io/<repo>/card.html`, choose the event and size, then click **Download PNG**. This page isn't linked from the public site and asks search engines not to index it.

## One-time setup

1. **GitHub Pages:** create a repo (for example `colorado-photonics`) and push these files to `main`. Then go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, and select `main` / `/ (root)`. The site will be at `https://<your-username>.github.io/colorado-photonics/`.
2. **Instagram:** put that URL in your bio. In `events.js`, set `SITE.instagram` to your handle (without the `@`). The handle then appears on the page footer and on the cards.
3. **Cloudflare Web Analytics:** in Cloudflare, go to **Analytics & Logs → Web Analytics → Add a site**. Enter your github.io hostname and copy the token from the JS snippet. Paste it into the commented-out block at the bottom of `index.html` and uncomment the block. Don't add analytics to `card.html`.

## Previewing locally

Browsers block `fetch` of `events.json` when you open files directly from disk, so preview with a local server:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000> and <http://localhost:8000/card.html>.
