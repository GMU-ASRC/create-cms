# CREATE Lab CMS

![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?logo=svelte&logoColor=white)
![Svelte 5](https://img.shields.io/badge/Svelte_5-FF3E00?logo=svelte&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?logo=tailwindcss&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)

Content management app and read API for the [CREATE Lab website](../website). SvelteKit on
Vercel, backed by MongoDB. The website fetches content from the public read API at runtime.

## Tech Stack

- SvelteKit (Svelte 5 runes) with `@sveltejs/adapter-vercel`
- MongoDB (`mongodb` driver) for content, users, sessions, and GridFS file/snapshot storage
- TipTap rich-text editor, `svelte-easy-crop` image cropper
- Auth: email/password users (scrypt hashing), DB-backed session cookies

## Getting Started

```bash
bun install
bun run dev      # first visit prompts to create the first admin account
bun run build
bun run check    # svelte-check
```

## Environment (`.env`)

- `MONGODB_URI` — MongoDB connection string
- `MONGODB_DB` — database name (default `cms`)
- `CORS_ORIGIN` — allowed origin for the read API (default `*`; set to the website origin to lock down)
- `BROWSER_RENDER_URL` — optional Browserless base URL for the snapshot archiver (renders JS-heavy pages); falls back to plain fetch when unset
- `BROWSERLESS_TOKEN` — token for the Browserless instance, if it requires one

Set the same vars in the Vercel project for production.

## Admin

- `/login` — sign in, or bootstrap the first account (registration closes after the first user)
- `/` — dashboard with content counts
- `/admin/<collection>` — field-based editor for each collection (search, pagination, drag-reorder where applicable)
- `/admin/gallery` — dedicated page to add many images at once (from media or upload) and order them
- `/admin/media` — files, short links, and page snapshots (see below)
- `/admin/manage` — users and an activity log
- `/admin/profile` — change your own email/password

### Editing

Documents are edited through generated forms (no raw JSON). Field types include text, textarea,
rich text, select, boolean, number, date, image (upload with cropper, or pick from the media
library), file, string lists, object lists (drag-reorderable), media lists, publication/team
references, and conditional fields (`showWhen`). Slugs auto-generate from titles.

### Media page

- **Files** — upload images/PDFs; usage indicators show whether a file is referenced anywhere, with a warning before deleting in-use files
- **Links** — short codes that 302-redirect to a target URL (`/l/<slug>`)
- **Snapshots** — archive a self-contained copy of a web page (inlined CSS, base64 images); served from `/admin/media/snapshot/<id>`. Uses Browserless when configured, otherwise a server fetch
- **QR Codes** — generate a QR code from text or a URL, download it as a PNG, or save it straight to the media library

### Management

- **Users** — add/remove editors; one **owner** account (`gmanjuna@gmu.edu` by default) cannot be removed, and ownership can be transferred
- **Activity** — log of everything that happens in the CMS (logins, content edits, media, etc.)

## Content collections

`siteInfo` (singleton), `news`, `events`, `projects`, `researchArticles`, `publications`, `team`,
`sponsors`, `gallery`. Shapes mirror the website's data files in `../website/src/lib/ts`.

Events can be duplicated from their edit page, can repeat on a daily/weekly/monthly/yearly
schedule (`recurrence` field), and have a dedicated calendar view at `/admin/events/calendar`
showing every event and occurrence for the month.

For `team`, set `role` to `professor` for the lead and `member` for everyone else; `group` sets
the heading (e.g. `Ph.D. Students`, `Alumni`). Social links support custom "Other" types with an
Iconify icon.

## Public read API (CORS enabled, read-only)

- `GET /api/content/<collection>` — array of documents (or a single object for `siteInfo`)
- `GET /api/files/<id>` — an uploaded file

Rich-text content is stored as HTML; embedded images use `/api/files/<id>` paths that the website
rewrites to absolute URLs. Writes happen only through the authenticated admin UI.

## Deploy on Vercel

- Import the `cms` directory as a Vercel project
- Set the environment variables above
- Point the website's `PUBLIC_CMS_URL` at the deployed CMS URL
