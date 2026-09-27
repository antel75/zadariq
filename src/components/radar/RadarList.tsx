import { Navigation, Phone, MapPin, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RadarPin, statusLabel } from '@/lib/radar/types';
import { getLayer } from '@/lib/radar';

export function RadarList({ pins, isEn, loading, planned }: {
  pins: RadarPin[]; isEn: boolean; loading: boolean; planned: boolean;
}) {
  if (loading) return <div role="status" className="py-16 text-center text-muted-foreground">{isEn ? 'Finding places…' : 'Učitavam mjesta…'}</div>;
  if (!pins.length) return <div className="rounded-2xl border border-dashed border-border p-10 text-center">
    <h2 className="font-semibold">{isEn ? 'No results for these filters' : 'Nema rezultata za odabrane filtre'}</h2>
    <p className="mt-2 text-sm text-muted-foreground">{isEn ? 'Try another category or search. Missing Sunday data does not mean every shop is closed.' : 'Pokušaj s drugom kategorijom ili pretragom. Nedostatak nedjeljnog rasporeda ne znači da su sve trgovine zatvorene.'}</p>
  </div>;
  return <div className="grid gap-3 sm:grid-cols-2">
    {pins.map(pin => {
      const hasCoords = pin.lat != null && pin.lng != null;
      const destination = hasCoords ? `${pin.lat},${pin.lng}` : pin.address ? `${pin.name}, ${pin.address}` : null;
      const isOpen = ['open', 'closing-soon', 'duty'].includes(pin.status);
      const scheduled = planned && pin.layerId === 'sunday';
      const sourceUrl = pin.sourceUrl && /^https?:\/\//.test(pin.sourceUrl) ? pin.sourceUrl : null;
      return <article key={pin.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <span className="text-xs text-muted-foreground">{getLayer(pin.layerId)?.icon} {isEn ? getLayer(pin.layerId)?.label.en : getLayer(pin.layerId)?.label.hr}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${scheduled ? 'bg-secondary text-secondary-foreground' : isOpen ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
            {scheduled ? (isEn ? 'Scheduled' : 'Prema rasporedu') : statusLabel(pin.status, isEn)}
          </span>
        </div>
        <h2 className="mt-3 text-lg font-semibold leading-snug">{pin.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{pin.address || (isEn ? 'Address unavailable' : 'Adresa nije dostupna')}</p>
        <p className="mt-4 font-medium">{pin.subtitle && pin.subtitle !== '—' ? pin.subtitle : (isEn ? 'Hours not confirmed' : 'Radno vrijeme nije potvrđeno')}</p>
        {pin.distance != null && <p className="mt-1 text-xs text-muted-foreground">{(pin.distance / 1000).toLocaleString(isEn ? 'en' : 'hr', { maximumFractionDigits: 1 })} km · {isEn ? 'straight-line distance' : 'zračna udaljenost'}</p>}
        <div className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {pin.source ? <>{isEn ? 'Source' : 'Izvor'}: {sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{pin.source}</a> : pin.source}</> : (isEn ? 'From the published schedule; not a live confirmation.' : 'Prema objavljenim podacima; nije potvrda uživo.')}
          {pin.fetchedAt && !Number.isNaN(Date.parse(pin.fetchedAt)) && <p>{isEn ? 'Imported' : 'Preuzeto'} {new Date(pin.fetchedAt).toLocaleString(isEn ? 'en-GB' : 'hr-HR', { timeZone: 'Europe/Zagreb', dateStyle: 'short', timeStyle: 'short' })}</p>}
        </div>
        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          {destination && <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"><Navigation className="h-4 w-4" />{isEn ? 'Directions' : 'Odvedi me'}</a>}
          {pin.phone && /\d{5}/.test(pin.phone.replace(/\D/g, '')) && <a href={`tel:${pin.phone.replace(/[^+\d]/g, '')}`} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm"><Phone className="h-4 w-4" />{isEn ? 'Call' : 'Nazovi'}</a>}
          {pin.detailPath && <Link to={pin.detailPath} className="inline-flex items-center gap-1 px-2 py-2 text-sm text-muted-foreground">{isEn ? 'Details' : 'Detalji'}<ArrowUpRight className="h-4 w-4" /></Link>}
        </div>
        {!hasCoords && <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{isEn ? 'Exact map location unavailable' : 'Točna lokacija na karti nije dostupna'}</p>}
      </article>;
    })}
  </div>;
}
