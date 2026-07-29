# TMDB proxy

Cloudflare Worker that forwards TMDB requests with the API token attached
server-side, so the token never reaches the browser.

## Why this exists

GitHub Pages serves static files. Anything the Angular bundle needs at runtime is
downloadable by anyone who opens devtools — build-time secret injection doesn't
change that, it just moves where the string comes from. The only way to keep a
credential private in a client-only app is to not send it to the client.

## Setup

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put TMDB_ACCESS_TOKEN   # paste the v4 read token
npx wrangler deploy
```

Deploy prints the Worker URL, something like
`https://noviflix-tmdb.<your-subdomain>.workers.dev`. Put that plus `/3` into
`src/environments/environment.ts` in the Angular app.

## Local development

```bash
npx wrangler dev        # serves on http://localhost:8787
```

`http://localhost:4200` is already on the origin allowlist, so point the app's
`baseUrl` at `http://localhost:8787/3` while developing against it.

## Guard rails

It's narrow on purpose — a wide-open proxy holding a credential is worse than no
proxy, since anyone could spend the token's quota.

| Restriction                     | Reason                                     |
| ------------------------------- | ------------------------------------------ |
| GET only                        | The app never writes to TMDB               |
| Paths must start with `/3/`     | Can't be aimed at other hosts or APIs      |
| Origin allowlist                | Only your sites may call it                |
| Client auth headers dropped     | Callers can't smuggle their own credentials |
| 30-minute edge cache            | Stays inside TMDB's rate limits            |

Requests with no `Origin` header — curl, another server — are refused, since
those aren't the browser this proxy exists to serve.

Update `ALLOWED_ORIGINS` in `wrangler.toml` if the site moves to a custom domain,
then redeploy.
