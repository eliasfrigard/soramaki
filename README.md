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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# soramaki
