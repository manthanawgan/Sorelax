import { Search, Send } from 'lucide-react';
import { forwardRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import { extractKeyword } from '@/lib/extract-keyword';
import type { AskRequest, AskResponse } from '@/lib/types/ask';
import { cn } from '@/lib/utils';

interface AskQueryBarProps {
  className?: string;
  ask: UseMutationResult<AskResponse, Error, AskRequest>;
  onSuccess?: () => void;
}

export const AskQueryBar = forwardRef<HTMLInputElement, AskQueryBarProps>(
  function AskQueryBar({ className, ask, onSuccess }, ref) {
    const [question, setQuestion] = useState('');
    const keywordPreview = question.trim() ? extractKeyword(question) : null;

    const submit = () => {
      const trimmed = question.trim();
      if (!trimmed || ask.isPending) return;
      ask.mutate(
        { question: trimmed },
        {
          onSuccess: () => {
            setQuestion('');
            onSuccess?.();
          },
        },
      );
    };

    const handleSubmit = (event: FormEvent) => {
      event.preventDefault();
      submit();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        submit();
      }
    };

    return (
      <form onSubmit={handleSubmit} className={cn('relative', className)}>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
        <input
          ref={ref}
          id="ask-query-input"
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={ask.isPending}
          placeholder="What changed in auth this week?"
          className="w-full rounded-md border border-zinc-800 bg-zinc-950/80 py-3.5 pl-11 pr-24 font-mono text-sm text-zinc-300 placeholder:text-zinc-700 focus:border-coral-500/40 focus:outline-none focus:ring-1 focus:ring-coral-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={ask.isPending || !question.trim()}
          className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1.5 rounded-md border border-coral-500/30 bg-coral-500/10 px-3 py-1.5 font-mono text-[11px] text-coral-300 transition-colors hover:bg-coral-500/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" strokeWidth={2} />
          Ask
        </button>
        <p className="mt-2 font-mono text-[11px] text-zinc-600">
          Press Enter to run on_demand.sql
          {keywordPreview ? (
            <>
              {' '}
              · keyword: <span className="text-coral-400/80">{keywordPreview}</span>
            </>
          ) : null}
          {ask.isPending ? ' · querying Coral…' : null}
        </p>
      </form>
    );
  },
);
