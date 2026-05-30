import { Search } from 'lucide-react';
import { PanelShell, PlaceholderBlock } from '../components/PanelShell';

export function AskPanel() {
  return (
    <div className="space-y-4">
      <PanelShell
        title="sorelax ask"
        subtitle="Natural-language query → Coral SQL keyword search across all sources"
        badge="coral"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
          <input
            type="text"
            readOnly
            placeholder="What changed in auth this week?"
            className="w-full rounded-md border border-zinc-800 bg-zinc-950/80 py-3.5 pl-11 pr-4 font-mono text-sm text-zinc-300 placeholder:text-zinc-700 focus:border-coral-500/40 focus:outline-none focus:ring-1 focus:ring-coral-500/20"
          />
          <p className="mt-2 font-mono text-[11px] text-zinc-600">
            Press Enter to run on_demand.sql · keyword extracted automatically
          </p>
        </div>
      </PanelShell>

      <PanelShell title="Results" subtitle="Unified rows from github · linear · slack · notion">
        <div className="overflow-hidden rounded-md border border-zinc-800/50">
          <div className="grid grid-cols-[100px_1fr_1fr_80px] gap-4 border-b border-zinc-800/50 bg-zinc-900/30 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-zinc-600">
            <span>Source</span>
            <span>Title</span>
            <span>Detail</span>
            <span>Extra</span>
          </div>
          {[1, 2, 3].map((row) => (
            <div
              key={row}
              className="grid grid-cols-[100px_1fr_1fr_80px] gap-4 border-b border-zinc-800/30 px-4 py-3 last:border-0"
            >
              <PlaceholderBlock lines={1} />
              <PlaceholderBlock lines={1} />
              <PlaceholderBlock lines={1} />
              <PlaceholderBlock lines={1} />
            </div>
          ))}
        </div>
      </PanelShell>
    </div>
  );
}
