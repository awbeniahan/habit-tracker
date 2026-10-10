# Habit Tracker

A dark, minimalist habit tracker that works fully offline on your phone. Every habit gets a GitHub-style heat map, and you can attach a photo as proof when you complete it. No account, no server, no tracking: everything stays on your device.

> **Screenshots:** open the app with `?demo=1` on the end of the address to load made-up sample habits (kept separate from real data), then take your screenshots and save them in a `screenshots/` folder.

## Features

- **Heat map cards** for every habit, one color each, with today outlined. Choose the range for all habits: 4 weeks, 12 weeks, 6 months, 1 year, or a custom number of weeks.
- **Three views:** heat map cards, checklist, compact list.
- **Custom categories** with a line icon, an emoji or an uploaded photo as the icon. Filter by category with chips.
- **Streak badges** that level up at 1, 3, 7, 30, 100 and 365 days.
- **Photo proof:** take a photo when you check a habit off. A habit can *require* a photo to count. Photos can be taken or picked from the library, and get the date and time they were added burned in.
- **Day view:** tap any heat map cell to see or edit that day: check-in, photo, note, or mark a rest day. Only the last 7 days can be edited.
- **Rest days** keep a streak alive without counting as a check-in.
- **Photo gallery** per habit, and a **stats screen** (streak, best streak, 30-day rate, most missed weekday).
- **Backup and restore** to a single file, because phones can clear web-app storage, plus a gentle reminder when your last backup is over a month old.
- **Archive and restore** habits, and **undo** after un-checking or archiving.
- **Feels native:** sheets rise from the bottom, buttons spring, checks animate, and iPhone haptics are used where Safari allows (iOS 17.4+).

## How it works

| File | What it does |
|---|---|
| `index.html` | The page shell: a single `#app` element, loads the CSS and JS. |
| `style.css` | The theme. Each habit sets two CSS variables (`--c`, `--c-rgb`) so one set of rules colors everything per habit. |
| `icons.js` | The line icons for the picker, taken from [Lucide](https://lucide.dev) (ISC license). |
| `app.js` | All the logic, plain JavaScript with no libraries. State changes, then `render()` rebuilds the screen. |
| `service-worker.js` | Caches the app files so it opens offline. Bump `CACHE_NAME` on every release. |
| `manifest.json` | Lets the app be installed to the home screen. |

**Data.** Habits, check-ins, notes, categories and settings are one JSON object in `localStorage`. Check-ins are a map of `habitId -> { 'YYYY-MM-DD': true }`, which makes streaks and heat maps simple date lookups. Photos are larger, so each one is a separate record in `IndexedDB`, resized to 1280px and compressed before saving.

**Offline.** The service worker answers from its cache first and refreshes the cache in the background, so a new release shows up on the second launch.

**Privacy.** There is no backend. Backups are files you save yourself.

## Run locally

Service workers need a server, not a `file://` address:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy (GitHub Pages)

Put the files in the repo root, then in the repo settings choose *Pages > Deploy from a branch > main / root*. On every release, change `CACHE_NAME` in `service-worker.js`.

## Test checklist (after every change)

1. Check a habit off, reload, and confirm it is still checked.
2. Take a photo, view it in the day view, delete it.
3. Switch all three views and the heat map range.
4. Turn on airplane mode, fully close the app, reopen it: it should still work.
5. Export a backup, then restore it.

## Known limitations

- Photos are stored as base64 text (about 33% larger than raw files). A migration to binary blobs is planned.
- iPhone can clear web-app storage under pressure, so export backups regularly.
- There are no reminders: web apps on iPhone cannot send reliable notifications without a server.
