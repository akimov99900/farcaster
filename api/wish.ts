import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { wishes } from '../src/wishes';
import { getTodayDateString, getWishIndex, calculateVotePercentages } from '../src/utils';

// Helper function to extract FID from request body
async function getFidFromRequestBody(body: any): Promise<number | null> {
  try {
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    return body?.untrustedData?.fid || null;
  } catch (error) {
    console.error('Error parsing FID from request:', error);
    return null;
  }
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
  return isMember === 1;
}

// Helper function to get base URL from request
function getBaseUrl(req: VercelRequest): string {
  const host = req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  return host ? `${protocol}://${host}` : 'https://daily-wishes-fixed.vercel.app';
}

// Helper function to generate frame HTML
function generateFrameHtml(
  wishText: string,
  stats: { likes: number; dislikes: number },
  hasVoted: boolean,
  fid: number | null,
  showThankYou: boolean = false,
  baseUrl: string
): string {
  const { likesPct, dislikesPct } = calculateVotePercentages(stats.likes, stats.dislikes);
  const totalVotes = stats.likes + stats.dislikes;
  const date = getTodayDateString();
  
  const statsText = totalVotes > 0 
    ? `Likes ${likesPct}% • Dislikes ${dislikesPct}% • ${totalVotes} votes`
    : 'Be the first to vote!';
  
  // Create image text
  const imageText = encodeURIComponent(wishText);
  const statsParam = encodeURIComponent(statsText);
  const thankYouParam = showThankYou ? 'true' : 'false';
  
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Wish</title>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${baseUrl}/api/og?wish=${imageText}&stats=${statsParam}&thankYou=${thankYouParam}" />
  `;
  
  if (!hasVoted) {
    html += `
    <meta property="fc:frame:button:1" content="👍 Like" />
    <meta property="fc:frame:button:1:action" content="post" />
    <meta property="fc:frame:button:1:target" content="${baseUrl}/api/vote" />
    <meta property="fc:frame:button:2" content="👎 Dislike" />
    <meta property="fc:frame:button:2:action" content="post" />
    <meta property="fc:frame:button:2:target" content="${baseUrl}/api/vote" />
    `;
  } else {
    html += `
    <meta property="fc:frame:button:1" content="✓ Voted Today" />
    <meta property="fc:frame:button:2" content="📊 View Stats" />
    `;
  }
  
  html += `
</head>
<body>
    <h1>Daily Wish</h1>
    <p>${wishText}</p>
    ${showThankYou ? '<p><strong>Thank you for voting! 🎉</strong></p>' : ''}
    <p>${statsText}</p>
</body>
</html>`;
  
  return html;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const fid = req.method === 'POST' ? await getFidFromRequestBody(req.body) : null;
    const date = getTodayDateString();
    const wishIndex = getWishIndex(fid, date, wishes.length);
    const wish = wishes[wishIndex];
    const baseUrl = getBaseUrl(req);
    
    const stats = await getVoteStats(date, wishIndex);
    const hasVoted = fid ? await hasUserVotedToday(date, wishIndex, fid) : false;
    
    const html = generateFrameHtml(wish, stats, hasVoted, fid, false, baseUrl);
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error in wish handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
