import { Progress } from '@/components/ui/progress';

interface TrustScoreProps {
  score: number;
  size?: 'sm' | 'md';
}

export function TrustScore({ score, size = 'sm' }: TrustScoreProps) {
  const color =
    score >= 70 ? 'bg-status-open' :
    score >= 40 ? 'bg-status-warning' :
    'bg-status-closed';

  const height = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${height} rounded-full bg-muted overflow-hidden`}>
        <div
          className={`${height} rounded-full transition-all ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-[10px] font-semibold text-muted-foreground tabular-nums w-7 text-right">{score}%</span>
    </div>
  );
}
