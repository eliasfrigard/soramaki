'use client';

import { addComment } from '@/app/actions/comments';
import { CONTEXT_TEXT_MAX_LENGTH, type TaskComment } from '@/lib/types';
import { formatDateTime } from '@/lib/format';
import { ActionForm } from '@/components/ActionForm';
import { SubmitButton } from '@/components/SubmitButton';

interface CommentsProps {
  taskId: string;
  comments: TaskComment[];
}

export function Comments({ taskId, comments }: CommentsProps) {
  const headingId = `task-${taskId}-comments`;
  const inputId = `task-${taskId}-comment`;

  return (
    <section aria-labelledby={headingId} className="min-w-0 rounded-2xl bg-ink-sunken/60 p-3">
      <h3 id={headingId} className="text-sm text-mute">Kommentit</h3>
      {comments.length > 0 ? (
        <ol className="mt-3 divide-y divide-hairline">
          {comments.map((comment) => (
            <li key={comment.id} className="min-w-0 py-3">
              <time dateTime={comment.createdAt.toISOString()} className="text-xs text-faint">
                {formatDateTime(comment.createdAt)}
              </time>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-linen [overflow-wrap:anywhere]">
                {comment.content}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-faint">Ei vielä kommentteja.</p>
      )}
      <ActionForm
        action={addComment.bind(null, taskId)}
        ariaLabel="Uusi kommentti"
        successMessage="Kommentti lisätty."
        focusTargetId={inputId}
        className="mt-3 grid min-w-0 gap-3"
      >
        <label htmlFor={inputId} className="grid min-w-0 gap-1.5 text-sm text-mute">
          Uusi kommentti
          <textarea
            id={inputId}
            name="content"
            required
            rows={3}
            maxLength={CONTEXT_TEXT_MAX_LENGTH}
            className="field h-auto min-h-24 resize-y py-3"
          />
        </label>
        <SubmitButton className="min-h-11 justify-self-end rounded-full bg-linen px-5 text-sm font-medium text-ink hover:bg-white">
          Lisää kommentti
        </SubmitButton>
      </ActionForm>
    </section>
  );
}
