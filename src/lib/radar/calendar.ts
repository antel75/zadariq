/** Calendar arithmetic stays in Zagreb, independently of the visitor's timezone. */
export function zagrebDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Zagreb', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function upcomingSunday(now = new Date()): string {
  const today = zagrebDate(now);
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
  return addDays(today, (7 - weekday) % 7);
}

export function validSunday(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === value && d.getUTCDay() === 0;
}
