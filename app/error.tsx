'use client';

import { useEffect } from 'react';

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error('Unexpected task board error', error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16">
      <h1 className="font-serif text-3xl text-linen">Could not load the task board</h1>
      <p role="alert" className="mt-3 text-mute">
        Something went wrong. Please try again.
      </p>
      <button
        type="button"
        onClick={retry}
        className="mt-6 rounded-full bg-linen px-5 py-3 text-sm font-medium text-ink hover:bg-white"
      >
        Try again
      </button>
    </main>
  );
}
