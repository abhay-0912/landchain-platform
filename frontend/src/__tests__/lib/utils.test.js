import {
  formatAddress,
  shortenHash,
  formatDate,
  formatArea,
  formatCurrency,
  cn,
  getRoleLabel,
} from '@/lib/utils';

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });
});

describe('formatAddress', () => {
  it('returns empty string for null', () => {
    expect(formatAddress(null)).toBe('');
  });

  it('shortens long addresses', () => {
    const addr = '0x1234567890abcdef1234567890abcdef12345678';
    const result = formatAddress(addr);
    expect(result).toContain('...');
    expect(result.startsWith('0x1234')).toBe(true);
  });

  it('returns short addresses unchanged', () => {
    expect(formatAddress('0x1234')).toBe('0x1234');
  });
});

describe('shortenHash', () => {
  it('returns empty string for null', () => {
    expect(shortenHash(null)).toBe('');
  });

  it('shortens a long hash', () => {
    const hash = '0xabc123def456ghi789';
    const result = shortenHash(hash);
    expect(result).toContain('...');
  });
});

describe('formatDate', () => {
  it('returns N/A for null', () => {
    expect(formatDate(null)).toBe('N/A');
  });

  it('formats a date string', () => {
    const result = formatDate('2023-10-01T00:00:00.000Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatArea', () => {
  it('returns N/A for null', () => {
    expect(formatArea(null)).toBe('N/A');
  });

  it('formats small areas in sq ft', () => {
    expect(formatArea(2400)).toContain('sq ft');
  });

  it('formats large areas in acres', () => {
    expect(formatArea(87120)).toContain('acres');
  });
});

describe('formatCurrency', () => {
  it('returns N/A for null', () => {
    expect(formatCurrency(null)).toBe('N/A');
  });

  it('formats amount as INR', () => {
    const result = formatCurrency(5000000);
    expect(result).toContain('₹');
  });
});

describe('getRoleLabel', () => {
  it('returns correct label for citizen', () => {
    expect(getRoleLabel('citizen')).toBe('Citizen');
  });

  it('returns correct label for officer', () => {
    expect(getRoleLabel('officer')).toBe('Government Officer');
  });

  it('returns role itself for unknown roles', () => {
    expect(getRoleLabel('unknown')).toBe('unknown');
  });
});
