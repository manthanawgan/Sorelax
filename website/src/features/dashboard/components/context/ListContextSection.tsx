import { EmptyState } from '../StateViews';
import { CollapsibleSection } from './CollapsibleSection';

interface ListContextSectionProps {
  title: string;
  items: string[];
  storageKey: string;
}

export function ListContextSection({ title, items, storageKey }: ListContextSectionProps) {
  return (
    <CollapsibleSection title={title} count={items.length} storageKey={storageKey}>
      {items.length === 0 ? (
        <EmptyState
          title="No entries"
          description="This section is empty in the current context snapshot."
          className="py-6"
        />
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="font-mono text-[13px] leading-relaxed text-zinc-300 before:mr-2 before:text-coral-500/70 before:content-['·']"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </CollapsibleSection>
  );
}
