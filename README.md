# EOTC Timirt — Mekane Selam St. Michael (EOTC)

Mobile-first **Ethiopian Orthodox Tewahedo** parish site for weekly **Timirit**: lesson recap, mezmurs, follow-up, and organizer tools. Tone, wording, and structure stay within the Holy Orthodox Church of Ethiopia — this hub is not a substitute for the Mysteries, spiritual fatherhood, or the Divine Liturgy.

## Related Orthodox site

[Tewahedo Daily](https://tewahedodaily.pages.dev/) is linked as a **supporting** resource (prayers, calendar, hymns). This project focuses on **Tuesday Timirit** at Mekane Selam St. Michael.

## Tech stack

- React 19 + Vite 8 + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`)
- React Router 7
- Recharts 3 (lazy-loaded with `/organizer`)

## Getting started

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

## Routes

| Path | Purpose |
|------|---------|
| `/` | Home — hero, weekly cards, Tewahedo Daily links, contact |
| `/this-week` | Current Tuesday Timirit (stable URL for Telegram) |
| `/missed` | Gentle catch-up for absent members |
| `/classes` | Past sessions + search |
| `/class/:id` | Any week’s full page |
| `/mezmurs` | Weekly hymn archive |
| `/contact` | Organizer support (discreet) |
| `/organizer` | Dashboard (mock data; add auth later) |

## Project structure

- `src/site` — parish constants (`constants.ts`), Telegram invite hook (`telegram.ts`), Tewahedo Daily URLs (`tewahedoDaily.ts`).
- `src/data` — `types.ts`, `mockWeeks.ts`, `mockUpcoming.ts`, `mockOrganizer.ts`, `weeksRepo.ts`.
- `src/components/timirt` — shared Timirit lesson layout (`TimirtWeekPageContent.tsx`).
- `src/lib` — `feedbackClient.ts` (localStorage placeholder for future Supabase/Firebase).

## Backend later

1. Fetch weeks in `weeksRepo.ts` instead of `MOCK_WEEKS`.
2. Replace `saveClassSubmission` with your database writer + RLS.
3. Guard `/organizer` with auth + `organizer` role.

## Content

Edit `src/data/mockWeeks.ts`, `src/data/mockUpcoming.ts`, and `src/site/constants.ts` for real addresses, links, and hymn text.
