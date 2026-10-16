This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Task board

Tasks appear in a centered, single-column board: In progress, Up next, Someday,
then Completed. All tasks are shown together, without global stats or filters;
legacy filter query parameters no longer restrict the board.

The full-width new-task form expands its optional priority, location, category,
and estimated-hours fields while focus is inside the form. It collapses when
focus leaves, preserves field values, and respects reduced-motion preferences.

Each active section shows its own Budget (all estimated item costs) and Time
(estimated task time). Above the completed list, Total Invested shows purchased
item costs (actual cost when recorded, otherwise the estimate) and logged actual
time for completed tasks only. Unpurchased items and unlogged time are not counted
as spent. Completed tasks are listed most recently finished first.

## Mutations and database schema

Forms submit raw hours to the server, which validates and converts them to integer
minutes. Blank estimates clear the estimate; blank completion time preserves any
previously logged actual time. Completion updates status, timestamp, and optional
actual time atomically. Rejected submissions display a local error and preserve
the draft; only successful submissions reset their form.

Apply all SQL files in `supabase/migrations/` in filename order before deploying.
In particular, `20261016000000_allocate_tag_order.sql` gives new places and types
database-allocated append positions while preserving existing positions. Updates
require an existing record; deletion is idempotent.

`lib/supabase/database.types.ts` is generated from the migrated PostgreSQL schema
using Supabase's type generator. Regenerate it after schema changes against a
local migrated database with the Supabase CLI:

```bash
npx supabase gen types typescript --db-url "$LOCAL_DATABASE_URL" --schema public > lib/supabase/database.types.ts
```

Use a local database URL, not application credentials. The joined task projection
is inferred in `lib/supabase/queries.ts`; costs are required on loaded board tasks.

## Validation

Use Node.js 24 or newer for the native TypeScript test runner and module mocks:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Tests exercise server actions with a real Supabase query builder and an isolated
mock transport, plus all migrations against in-memory PostgreSQL via PGlite.
They never connect to the application's Supabase database. Native module mocking
currently emits an experimental-feature warning.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# soramaki
