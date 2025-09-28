'use client';

import type { ReferenceLink } from './ChatWindow/types';

interface QAReferenceListProps {
  references: ReferenceLink[];
}

export function QAReferenceList({ references }: QAReferenceListProps) {
  if (!references.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border-light bg-bg-tertiary px-4 py-3 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">来源 References</h3>
      <ul className="mt-2 space-y-1 text-sm text-text-secondary">
        {references.map((reference) => (
          <li key={reference.index} className="flex items-start gap-2">
            <span className="font-medium text-text-primary">[{reference.index}]</span>
            {reference.url ? (
              <a
                href={reference.url}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline break-words"
              >
                {reference.title}
              </a>
            ) : (
              <span className="break-words">{reference.title}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
