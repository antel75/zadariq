import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ eq: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ eq: mocks.eq }) }) },
}));
vi.mock('@/data/mockData', () => ({ businesses: [{ id: 'shop1', name: 'Test shop', address: 'Test address', lat: 44, lng: 15 }] }));
import { sundayLayer } from './sunday';

describe('Sunday schedule integrity', () => {
  beforeEach(() => vi.clearAllMocks());
  it('does not invent opening times when the schedule is incomplete', async () => {
    mocks.eq.mockResolvedValue({ data: [{ business_id: 'shop1', open_time: null, close_time: null }], error: null });
    const pins = await sundayLayer.load({ sundayDate: '2026-09-27', isLiveSunday: true });
    expect(pins).toHaveLength(1);
    expect(pins[0].status).toBe('unknown');
    expect(pins[0].subtitle).toBeUndefined();
  });
  it('keeps source metadata without claiming a future shop is currently open', async () => {
    mocks.eq.mockResolvedValue({ data: [{ business_id: 'shop1', open_time: '08:00', close_time: '21:00', source: 'Example', source_url: 'https://example.com', fetched_at: '2026-09-26T06:00:00Z' }], error: null });
    const [pin] = await sundayLayer.load({ sundayDate: '2026-09-27', isLiveSunday: false });
    expect(pin).toMatchObject({ status: 'unknown', subtitle: '08:00–21:00', source: 'Example', sourceUrl: 'https://example.com', fetchedAt: '2026-09-26T06:00:00Z' });
  });
  it('reports a failed request instead of pretending no shops exist', async () => {
    mocks.eq.mockResolvedValue({ data: null, error: new Error('unavailable') });
    await expect(sundayLayer.load({ sundayDate: '2026-09-27', isLiveSunday: true })).rejects.toThrow('unavailable');
  });
});
