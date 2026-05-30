import type { RefObject } from 'react';
import { useAskQuery } from '@/lib/hooks/useAskQuery';
import { PanelShell } from '../components/PanelShell';
import { AskQueryBar } from '../components/AskQueryBar';
import { AskResults } from '../components/AskResults';

interface AskPanelProps {
  inputRef?: RefObject<HTMLInputElement | null>;
}

export function AskPanel({ inputRef }: AskPanelProps) {
  const ask = useAskQuery();

  return (
    <div className="space-y-4">
      <PanelShell
        title="sorelax ask"
        subtitle="Natural-language query → Coral SQL keyword search across all sources"
        badge="coral"
      >
        <AskQueryBar ref={inputRef} ask={ask} />
      </PanelShell>

      <PanelShell title="Results" subtitle="Unified rows from github · linear · slack · notion">
        <AskResults ask={ask} />
      </PanelShell>
    </div>
  );
}
