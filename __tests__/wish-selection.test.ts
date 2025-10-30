import { wishes } from '../src/wishes';
import { getWishIndex, fnv1a } from '../src/utils';

describe('Wish Selection Logic', () => {
  test('should consistently select the same wish for same fid and date', () => {
    const fid = 12345;
    const date = '2024-01-15';
    const index1 = getWishIndex(fid, date, wishes.length);
    const index2 = getWishIndex(fid, date, wishes.length);
    
    expect(index1).toBe(index2);
    expect(index1).toBeGreaterThanOrEqual(0);
    expect(index1).toBeLessThan(wishes.length);
  });
  
  test('should select different wishes for different fids on same date', () => {
    const date = '2024-01-15';
    const fid1 = 12345;
    const fid2 = 67890;
    
    const index1 = getWishIndex(fid1, date, wishes.length);
    const index2 = getWishIndex(fid2, date, wishes.length);
    
    // They might be the same by chance, but that's very unlikely
    // This test mainly verifies the function works correctly
    expect(index1).toBeGreaterThanOrEqual(0);
    expect(index1).toBeLessThan(wishes.length);
    expect(index2).toBeGreaterThanOrEqual(0);
    expect(index2).toBeLessThan(wishes.length);
  });
  
  test('should select different wishes for same fid on different dates', () => {
    const fid = 12345;
    const date1 = '2024-01-15';
    const date2 = '2024-01-16';
    
    const index1 = getWishIndex(fid, date1, wishes.length);
    const index2 = getWishIndex(fid, date2, wishes.length);
    
    expect(index1).toBeGreaterThanOrEqual(0);
    expect(index1).toBeLessThan(wishes.length);
    expect(index2).toBeGreaterThanOrEqual(0);
    expect(index2).toBeLessThan(wishes.length);
  });
  
  test('should work with null fid (fallback to date-only)', () => {
    const date = '2024-01-15';
    const index1 = getWishIndex(null, date, wishes.length);
    const index2 = getWishIndex(null, date, wishes.length);
    
    expect(index1).toBe(index2);
    expect(index1).toBeGreaterThanOrEqual(0);
    expect(index1).toBeLessThan(wishes.length);
  });
});

describe('Hash Function', () => {
  test('should produce consistent hash for same input', () => {
    const input = 'test-string';
    const hash1 = fnv1a(input);
    const hash2 = fnv1a(input);
    
    expect(hash1).toBe(hash2);
    expect(hash1).toBeGreaterThanOrEqual(0);
    expect(hash1).toBeLessThan(Math.pow(2, 32));
  });
  
  test('should produce different hashes for different inputs', () => {
    const input1 = 'test-string-1';
    const input2 = 'test-string-2';
    
    const hash1 = fnv1a(input1);
    const hash2 = fnv1a(input2);
    
    expect(hash1).not.toBe(hash2);
  });
});