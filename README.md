# sf-frontend

A contacts app styled like a printed phone book: an A to Z directory, halftone avatars and a print view, in Next.js 16.

Built at the **Roast My PR** event at GitHub HQ: a two-hour build judged on Qodo-reviewed pull requests, where it placed top 10. The API is [sf-backend](https://github.com/karimbabasf/sf-backend). The write-up is [roast-my-pr](https://github.com/karimbabasf/roast-my-pr).

![The contacts list](docs/UI.png)

## What it does

- **Directory.** Contacts filed under the first letter of their last name, with an A to Z rail to jump between letters. Search, sort and page size live in the URL (`?q=&sort=&order=&page=&perPage=`), so a view survives a reload and can be shared.
- **Photos.** Picked files are resized in the browser until they fit under the API's 512 KB cap. EXIF orientation is applied, so phone photos are not sideways.
- **Phone avatars.** No photo? The phone number is hashed into a seed that draws a 4x4 Bayer-dithered pattern. Same number, same picture, on every machine, because it is saved as the contact's photo.
- **Print view.** One toggle halftones every avatar, like a phone book printed in 1-bit. It still works in a private window where storage throws.
- **Save to phone.** Exports a vCard 4.0 (RFC 6350) `.vcf`, built in the browser from data already on the page. The serializer is hand written, no package.
- **Addresses.** Many per contact, grouped by Home, Work and Other. When the API rejects one, the form points at that exact row.

## How it works

- **Server side only.** Reads happen in server components, writes in server actions (`src/app/contacts/actions.ts`). `API_BASE_URL` never reaches the browser, so there is no CORS surface. It needs a Node runtime; `output: "export"` is not supported.
- **One module knows the API.** `src/lib/contacts/api.ts` mirrors the backend's `/openapi.json`. Errors are typed: `404` becomes the 404 page, `409` becomes an email field error, `422` is unpacked into per-field messages, and a down backend shows a panel naming the URL it tried.
- **One source for forms.** `CONTACT_FIELD_GROUPS` in `src/lib/contacts/schema.ts` drives both the rendered fields and the Zod rules, which match the API's limits. Forms are real `action` forms, so they submit before hydration.
- **Live status.** The header badge reads `GET /health` and names the backend's database (`api ok · sqlite`), or shows `api unreachable`.
- **Build stamp.** `next.config.ts` injects version, build number and git sha; every page footer shows them.

## Run

Start [sf-backend](https://github.com/karimbabasf/sf-backend) first (default `http://127.0.0.1:8000`), then:

```bash
npm install
cp .env.local.example .env.local    # set API_BASE_URL if the API is elsewhere
npm run dev                         # http://localhost:3000, redirects to /contacts
```

Production: `npm run build && npm start` with `API_BASE_URL` set in the server environment.

## Test

```bash
npm test               # Jest + Testing Library, HTTP stubbed with MSW
npm run test:coverage  # thresholds in jest.config.ts
npm run typecheck
npm run lint
npx playwright install # once
npm run test:e2e       # Playwright against a real backend
```

Unit tests stub HTTP with MSW, never by mocking `fetch`. The e2e specs create and delete their own contacts with unique emails. Playwright defaults to three browsers and up to 8 workers, which can wedge a single-worker uvicorn; use `npm run test:e2e -- --workers=2` or `--project=chromium` there.

Smoke test: the list should show the seeded contacts and the badge should read `api ok`. A made-up id like `/contacts/99999` should give the styled 404 page, not a stack trace.

## Routes

| Route | What it does |
| --- | --- |
| `/` | 308 to `/contacts` |
| `/contacts` | Directory: search, sort, paginate |
| `/contacts/new` | Create form |
| `/contacts/[id]` | Detail, with edit, delete and save to phone |
| `/contacts/[id]/edit` | Edit form (`PUT`, a full replace) |

## Gotchas

- **Suspense changes HTTP status.** The list skeleton sits in the `(list)` route group on purpose. A `loading.tsx` directly under `contacts/` would also wrap `[id]`, flush the shell early, and turn its `notFound()` 404 into a 200.
- **Four Jest settings hold the stack together:** the `jest-fixed-jsdom` environment (keeps Node's `fetch` globals), the `transformIgnorePatterns` override (MSW is ESM only), the `server-only` mapping, and the `FormData` shim (undici's `FormData` cannot be built from a `<form>`, which React 19 does on submit). Do not remove them casually.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS on semantic CSS variables (dark by default, light under `[data-theme="light"]`), Zod, lucide-react, Manrope self-hosted with `next/font/local`, Jest, Testing Library, MSW, Playwright.
