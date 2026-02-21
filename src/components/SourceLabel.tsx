interface SourceLabelProps {
  source: string;
  className?: string;
}

export function SourceLabel({ source, className = '' }: SourceLabelProps) {
  return (
    <span className={`text-[9px] text-muted-foreground/60 ${className}`}>
      Izvor: {source}
    </span>
  );
}
