/**
 * Simple FNV-1a hash function for strings
 * Returns a 32-bit unsigned integer
 */
export function fnv1a(str: string): number {
  let hash = 0x811c9dc5; // FNV offset basis
  
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0; // FNV prime, force to 32-bit unsigned
  }
  
  return hash;
}

/**
 * Gets today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Determines the wish index for a user on a specific day
 */
export function getWishIndex(fid: number | null, date: string, totalWishes: number): number {
  const input = fid !== null ? `${fid}-${date}` : date;
  const hash = fnv1a(input);
  return hash % totalWishes;
}

/**
 * Calculates percentages for vote statistics
 */
export function calculateVotePercentages(likes: number, dislikes: number): { likesPct: number; dislikesPct: number } {
  const total = likes + dislikes;
  if (total === 0) {
    return { likesPct: 0, dislikesPct: 0 };
  }
  
  const likesPct = Math.round((likes / total) * 100);
  const dislikesPct = 100 - likesPct;
  
  return { likesPct, dislikesPct };
}