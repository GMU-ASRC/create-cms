# CREATE Lab CMS

An API-driven content management app for the CREATE Lab website. Built with SvelteKit,
deployed on Vercel, backed by MongoDB. The static website (design2) pulls content from the
public read API at runtime.

## Stack
- SvelteKit with `@sveltejs/adapter-vercel`
- MongoDB (official `mongodb` driver) for content, users, sessions, and uploaded files
- Auth: email and password users stored in MongoDB, scrypt password hashing, database-backed
  session cookies
- File storage: MongoDB GridFS, served through the API

## Environment
Copy `.env.example` to `.env` and set:
- `MONGODB_URI` connection string for your MongoDB cluster
- `MONGODB_DB` database name (defaults to `cms`)
- `CORS_ORIGIN` allowed origin for the public read API (defaults to `*`; set to the website
  origin to lock it down)

## Local development
- `bun install`
- `bun run dev`
- Open the app. The first visit shows a one-time form to create the first admin account.
  After that, registration is closed and new editors are added from the Users page.

## Admin
- `/login` sign in (or bootstrap the first account)
- `/` dashboard with content counts
- `/admin/<collection>` list and edit entries; each document is edited as JSON using the
  template for that collection as a starting point
- `/admin/media` upload images and files; reference them in content with the shown
  `/api/files/<id>` path
- `/admin/users` add or remove editors

## Content collections
`siteInfo` (singleton), `news`, `projects`, `researchArticles`, `publications`, `team`,
`sponsors`. Shapes mirror the website's data files in `website/src/lib/ts`.

For `team`, set `role` to `professor` for the lead and `member` for everyone else; `group`
sets the heading (for example `Ph.D. Students` or `Alumni`).

## Public read API
Consumed by the website. CORS enabled.
- `GET /api/content/<collection>` returns an array (or a single object for `siteInfo`)
- `GET /api/files/<id>` returns an uploaded file

Research Articles and News bodies are written in a rich text editor; the content is stored as
HTML and rendered by the website. Embedded images reference uploaded files by their
`/api/files/<id>` path, which the website rewrites to absolute URLs.

`siteInfo` is a singleton and is edited directly on its own page. Each News entry's "Read more"
link can point nowhere, to an external URL, or to an internal research article by slug.

Writes happen only through the authenticated admin UI; the public API is read-only.

## Deploy on Vercel
- Import the `cms` directory as a Vercel project
- Set `MONGODB_URI`, `MONGODB_DB`, and `CORS_ORIGIN` in the project's environment variables
- Deploy. Point the website's `PUBLIC_CMS_URL` at the deployed CMS URL.
