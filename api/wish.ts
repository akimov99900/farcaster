import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { wishes } from '../src/wishes';
import { getTodayDateString, getWishIndex, calculateVotePercentages } from '../src/utils';

// Helper function to extract FID from request
async function getFidFromRequest(req: VercelRequest): Promise<number | null> {
  try {
    // Farcaster frames send POST data as JSON with untrustedData
    if (req.method === 'POST' && req.body) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      return body?.untrustedData?.fid || null;
    }
  } catch (error) {
    console.error('Error extracting FID:', error);
  }
  return null;
}

// Helper function to get vote stats from KV
async function getVoteStats(date: string, wishIndex: number) {
  const likesKey = `dw:vote:${date}:${wishIndex}:likes`;
  const dislikesKey = `dw:vote:${date}:${wishIndex}:dislikes`;
  
  const [likes, dislikes] = await Promise.all([
    kv.get<number>(likesKey) || 0,
    kv.get<number>(dislikesKey) || 0
  ]);
  
  return { likes: likes as number, dislikes: dislikes as number };
}

// Helper function to check if user has voted today
async function hasUserVotedToday(date: string, wishIndex: number, fid: number): Promise<boolean> {
  const votersKey = `dw:vote:${date}:${wishIndex}:voters`;
  const isMember = await kv.sismember(votersKey, fid.toString());
  return Boolean(isMember);
}

// Helper function to get base URL from request
function getBaseUrl(req: VercelRequest): string {
  const host = req.headers.host || 'daily-wishes-fixed.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

// Helper function to generate frame HTML
function generateFrameHtml(
  req: VercelRequest,
  wishText: string,
  stats: { likes: number; dislikes: number },
  hasVoted: boolean,
  fid: number | null,
  showThankYou: boolean = false
): string {
  const { likesPct, dislikesPct } = calculateVotePercentages(stats.likes, stats.dislikes);
  const totalVotes = stats.likes + stats.dislikes;
  const date = getTodayDateString();
  const baseUrl = getBaseUrl(req);
  
  const statsText = totalVotes > 0 
    ? `Likes ${likesPct}% • Dislikes ${dislikesPct}% • ${totalVotes} votes`
    : 'Be the first to vote!';
  
  const thankYouText = showThankYou ? 'Thank you!' : '';
  
  // Create image text - keep it simple for better display
  const imageText = encodeURIComponent(wishText);
  const imageStats = encodeURIComponent(statsText);
  const imageThanks = encodeURIComponent(thankYouText);
  
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Wish</title>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${baseUrl}/api/og?wish=${imageText}&stats=${imageStats}&thanks=${imageThanks}" />
  `;
  
  if (!hasVoted) {
    html += `
    <meta property="fc:frame:button:1" content="👍 Like" />
    <meta property="fc:frame:button:1:action" content="post" />
    <meta property="fc:frame:button:2" content="👎 Dislike" />
    <meta property="fc:frame:button:2:action" content="post" />
    <meta property="fc:frame:post_url" content="${baseUrl}/api/vote" />`;
  } else {
    html += `
    <meta property="fc:frame:button:1" content="✓ Voted Today" />`;
  }
  
  html += `
</head>
<body>
    <h1>Daily Wish</h1>
    <p>${wishText}</p>
    <p>${statsText}</p>
    ${showThankYou ? '<p>Thank you for voting! 🎉</p>' : ''}
</body>
</html>`;
  
  return html;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const fid = await getFidFromRequest(req);
    const date = getTodayDateString();
    const wishIndex = getWishIndex(fid, date, wishes.length);
    const wish = wishes[wishIndex];
    
    const stats = await getVoteStats(date, wishIndex);
    const hasVoted = fid ? await hasUserVotedToday(date, wishIndex, fid) : false;
    
    const html = generateFrameHtml(req, wish, stats, hasVoted, fid);
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error in wish handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}