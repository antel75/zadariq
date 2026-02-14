export function ZadarIQLogo({ size = 'default' }: { size?: 'default' | 'large' }) {
  const textClass = size === 'large' ? 'text-3xl' : 'text-xl';
  
  return (
    <span className={`${textClass} font-extrabold tracking-tight`}>
      <span className="text-foreground">Zadar</span>
      <span className="relative">
        <span className="bg-gradient-to-r from-accent via-[hsl(200,80%,55%)] to-primary bg-clip-text text-transparent">
          IQ
        </span>
        <span className="absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full bg-accent animate-pulse" />
      </span>
    </span>
  );
}
