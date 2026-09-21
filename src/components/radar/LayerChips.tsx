import { RADAR_LAYERS } from '@/lib/radar';

interface Props {
  active: string[];
  counts: Record<string, number>;
  isEn: boolean;
  onToggle: (id: string) => void;
}

export function LayerChips({ active, counts, isEn, onToggle }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-2">
      {RADAR_LAYERS.map(layer => {
        const on = active.includes(layer.id);
        const count = counts[layer.id];
        return (
          <button
            key={layer.id}
            onClick={() => onToggle(layer.id)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              on
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-background/80 backdrop-blur text-muted-foreground border-border'
            }`}
          >
            <span>{layer.icon}</span>
            <span>{isEn ? layer.label.en : layer.label.hr}</span>
            {on && count != null && (
              <span className="opacity-80 tabular-nums">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
