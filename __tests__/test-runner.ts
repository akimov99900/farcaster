// Simple test runner for wish selection logic
import { wishes } from '../src/wishes';
import { getWishIndex, fnv1a } from '../src/utils';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function test(description: string, testFn: () => void) {
  try {
    testFn();
    console.log(`✅ ${description}`);
  } catch (error) {
    console.error(`❌ ${description}: ${error.message}`);
    process.exit(1);
  }
}

// Test 1: Consistent wish selection for same fid and date
test('should consistently select the same wish for same fid and date', () => {
  const fid = 12345;
  const date = '2024-01-15';
  const index1 = getWishIndex(fid, date, wishes.length);
  const index2 = getWishIndex(fid, date, wishes.length);
  
  assert(index1 === index2, 'Indices should be the same');
  assert(index1 >= 0, 'Index should be non-negative');
  assert(index1 < wishes.length, 'Index should be within bounds');
});

// Test 2: Different fids on same date
test('should select valid wishes for different fids on same date', () => {
  const date = '2024-01-15';
  const fid1 = 12345;
  const fid2 = 67890;
  
  const index1 = getWishIndex(fid1, date, wishes.length);
  const index2 = getWishIndex(fid2, date, wishes.length);
  
  assert(index1 >= 0, 'Index1 should be non-negative');
  assert(index1 < wishes.length, 'Index1 should be within bounds');
  assert(index2 >= 0, 'Index2 should be non-negative');
  assert(index2 < wishes.length, 'Index2 should be within bounds');
});

// Test 3: Same fid on different dates
test('should select valid wishes for same fid on different dates', () => {
  const fid = 12345;
  const date1 = '2024-01-15';
  const date2 = '2024-01-16';
  
  const index1 = getWishIndex(fid, date1, wishes.length);
  const index2 = getWishIndex(fid, date2, wishes.length);
  
  assert(index1 >= 0, 'Index1 should be non-negative');
  assert(index1 < wishes.length, 'Index1 should be within bounds');
  assert(index2 >= 0, 'Index2 should be non-negative');
  assert(index2 < wishes.length, 'Index2 should be within bounds');
});

// Test 4: Null fid fallback
test('should work with null fid (fallback to date-only)', () => {
  const date = '2024-01-15';
  const index1 = getWishIndex(null, date, wishes.length);
  const index2 = getWishIndex(null, date, wishes.length);
  
  assert(index1 === index2, 'Indices should be the same');
  assert(index1 >= 0, 'Index should be non-negative');
  assert(index1 < wishes.length, 'Index should be within bounds');
});

// Test 5: Hash function consistency
test('should produce consistent hash for same input', () => {
  const input = 'test-string';
  const hash1 = fnv1a(input);
  const hash2 = fnv1a(input);
  
  assert(hash1 === hash2, 'Hashes should be the same');
  assert(hash1 >= 0, 'Hash should be non-negative');
  assert(hash1 < Math.pow(2, 32), 'Hash should be within 32-bit range');
});

// Test 6: Different hash for different inputs
test('should produce different hashes for different inputs', () => {
  const input1 = 'test-string-1';
  const input2 = 'test-string-2';
  
  const hash1 = fnv1a(input1);
  const hash2 = fnv1a(input2);
  
  assert(hash1 !== hash2, 'Hashes should be different');
});

console.log('All tests passed! 🎉');