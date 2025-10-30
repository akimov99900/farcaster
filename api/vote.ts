import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { wishes } from '../src/wishes';
import { getTodayDateString, getWishIndex } from '../src/utils';

// Helper function to extract data from Farcaster Frame request
async function getFrameData(body: any): Promise<{ fid: number | null; buttonIndex: number | null }> {
  try {
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    const fid = body?.untrustedData?.fid || null;
    const buttonIndex = body?.untrustedData?.buttonIndex || null;
    return { fid, buttonIndex };
  } catch (error) {
    console.error('Error parsing frame data:', error);
    return { fid: null, buttonIndex: null };
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

// Helper function to calculate percentages
function calculateVotePercentages(likes: number, dislikes: number): { likesPct: number; dislikesPct: number } {
  const total = likes + dislikes;
  if (total === 0) {
    return { likesPct: 0, dislikesPct: 0 };
  }
  
  const likesPct = Math.round((likes / total) * 100);
  const dislikesPct = 100 - likesPct;
  
  return { likesPct, dislikesPct };
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fid, buttonIndex } = await getFrameData(req.body);
    const baseUrl = getBaseUrl(req);
    
    if (!fid || buttonIndex === null) {
      return res.status(400).json({ error: 'Invalid request: Missing FID or button index' });
    }
    
    const date = getTodayDateString();
    const wishIndex = getWishIndex(fid, date, wishes.length);
    const wish = wishes[wishIndex];
    
    // Check if user has already voted today
    const votersKey = `dw:vote:${date}:${wishIndex}:voters`;
    const isMember = await kv.sismember(votersKey, fid.toString());
    const hasVoted = isMember === 1;
    
    if (hasVoted) {
      // User already voted, return current stats
      const stats = await getVoteStats(date, wishIndex);
      const html = generateFrameHtml(wish, stats, true, fid, false, baseUrl);
      
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    }
    
    // Process the vote
    const choice = buttonIndex === 1 ? 'like' : 'dislike'; // Button 1 = Like, Button 2 = Dislike
    const likesKey = `dw:vote:${date}:${wishIndex}:likes`;
    const dislikesKey = `dw:vote:${date}:${wishIndex}:dislikes`;
    
    // Add user to voters set and increment counter atomically
    const wasAdded = await kv.sadd(votersKey, fid.toString());
    
    if (wasAdded > 0) {
      // User hasn't voted before, increment the appropriate counter
      if (choice === 'like') {
        await kv.incr(likesKey);
      } else {
        await kv.incr(dislikesKey);
      }
    }
    
    // Get updated stats
    const stats = await getVoteStats(date, wishIndex);
    
    // Generate response with thank you message
    const html = generateFrameHtml(wish, stats, true, fid, true, baseUrl);
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error in vote handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
