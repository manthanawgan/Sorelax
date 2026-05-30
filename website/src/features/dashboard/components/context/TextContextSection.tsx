import { EmptyState } from '../StateViews';
import { CollapsibleSection } from './CollapsibleSection';

interface TextContextSectionProps {
  title: string;
  value: string;
  storageKey: string;
}

export function TextContextSection({ title, value, storageKey }: TextContextSectionProps) {
  const hasValue = value.trim().length > 0;

  return (
    <CollapsibleSection title={title} count={hasValue ? 1 : 0} storageKey={storageKey}>
      {hasValue ? (
        <p className="font-mono text-[13px] leading-relaxed text-zinc-300">{value}</p>
      ) : (
        <EmptyState
          title="No sprint goal"
          description="Run a refresh after Linear data is connected to populate the sprint goal."
          className="py-6"
        />
      )}
    </CollapsibleSection>
  );
}
