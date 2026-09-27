import { describe, expect, it } from 'vitest';
import { addDays, upcomingSunday, validSunday, zagrebDate } from './calendar';

describe('Zagreb Sunday calendar', () => {
  it('uses Sunday in Zagreb even while UTC is still Saturday', () => {
    const now = new Date('2026-09-26T22:30:00Z');
    expect(zagrebDate(now)).toBe('2026-09-27');
    expect(upcomingSunday(now)).toBe('2026-09-27');
  });
  it('keeps the current Sunday after 22:00 and advances on Monday', () => {
    expect(upcomingSunday(new Date('2026-09-27T21:30:00Z'))).toBe('2026-09-27');
    expect(upcomingSunday(new Date('2026-09-27T22:30:00Z'))).toBe('2026-10-04');
  });
  it('handles DST and year boundaries without local-time arithmetic', () => {
    expect(addDays('2026-10-25', 7)).toBe('2026-11-01');
    expect(upcomingSunday(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-03');
  });
  it('rejects invalid dates and non-Sundays', () => {
    expect(validSunday('2026-09-27')).toBe(true);
    expect(validSunday('2026-09-28')).toBe(false);
    expect(validSunday('2026-02-30')).toBe(false);
    expect(validSunday(null)).toBe(false);
  });
});
