<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository

- This is a single Next.js app; use pnpm `11.21.0` from the repository root. There is no workspace, test runner, or typecheck script.
- Use JavaScript/JSX. The `@/*` import alias maps to `src/*`.

## Commands

```bash
pnpm dev
pnpm lint
pnpm build
pnpm start # after pnpm build
```

- The app expects `NEXT_PUBLIC_API` and `NEXT_PUBLIC_HOST` in the local environment; `.env` is ignored by git. The API backend must be reachable for login and admin data flows.

## Structure

- Routes use the App Router under `src/app`; `src/app/(admin)` is a route group and does not appear in URLs. Its `_entities` folder is private entity configuration, not a route.
- `src/packages/admin` is the shared client-side admin UI, API, auth, and entity-schema package. Keep app-specific entity definitions in `src/app/(admin)/_entities`.
- `src/admin.config.js` reads the public API/host environment variables, assembles the entities, and initializes module-level runtime config as an import side effect. Keep its imports in the login page and `(admin)/layout.jsx` before admin components render.
- Admin API requests include credentials; authenticated local testing therefore also depends on backend CORS/cookie configuration.
