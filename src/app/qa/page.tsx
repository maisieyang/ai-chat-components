'use client';

import { useState } from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import type { AnswerResponse } from '@/lib/pipeline/qa';

interface ReferenceLink {
  index: number;
  title: string;
  url?: string;
}

export default function QAPage() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<AnswerResponse | null>(null);
  const [references, setReferences] = useState<ReferenceLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmed = question.trim();
    if (!trimmed) {
      setError('Please enter a question.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnswer(null);
    setReferences([]);

    try {
      const response = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to retrieve answer.');
      }

      const payload = (await response.json()) as AnswerResponse;
      setAnswer(payload);
      setReferences(payload.references ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Confluence QA (MVP)</h1>
          <p className="text-text-secondary">
            Ask a question about Apache Confluence documentation. Answers cite their sources inline and below.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-text-secondary mb-2">
              Question
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-border-light bg-bg-tertiary px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="How do I configure SSO for Apache Confluence?"
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="inline-flex items-center rounded-lg bg-interactive-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-interactive-primary-hover disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? 'Thinking…' : 'Ask' }
            </button>
            {error && <p className="text-sm text-error">{error}</p>}
          </div>
        </form>

        {answer && (
          <section className="space-y-4">
            <div className="rounded-xl border border-border-light bg-bg-secondary p-6 shadow-sm">
              <MarkdownRenderer content={answer.answer} />
            </div>

            {references.length > 0 && (
              <div className="rounded-xl border border-border-light bg-bg-tertiary p-4">
                <h2 className="text-sm font-semibold text-text-secondary">Sources</h2>
                <ul className="mt-2 space-y-1 text-sm text-text-secondary">
                  {references.map((reference) => (
                    <li key={reference.index}>
                      <span className="font-medium">[{reference.index}]</span>{' '}
                      {reference.url ? (
                        <a href={reference.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                          {reference.title}
                        </a>
                      ) : (
                        reference.title
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

