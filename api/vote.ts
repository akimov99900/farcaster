import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { wishes } from '../src/wishes';
import { getTodayDateString, getWishIndex, calculateVotePercentages } from '../src/utils';

interface FramePostData {
  untrustedData?: {
    fid?: number;
    buttonIndex?: number;
    castId?: {
      fid: number;
      hash: string;
    };
  };
  trustedData?: {
    messageBytes: string;
  };
}

async function getFidFromRequest(req: VercelRequest): Promise<number | null> {
  if (req.method === 'POST' && req.body) {
    try {
      const data: FramePostData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      return data.untrustedData?.fid || null;
    } catch (error) {
      console.error('Error parsing FID from request:', error);
      return null;
    }
  }
  return null;
}

async function getButtonIndex(req: VercelRequest): Promise<number | null> {
  if (req.method === 'POST' && req.body) {
    try {
      const data: FramePostData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      return data.untrustedData?.buttonIndex || null;
    } catch (error) {
      console.error('Error parsing button index from request:', error);
      return null;
    }
  }
  return null;
}

async function getVoteStats(date: string, wishIndex: number) {
  const likesKey = `dw:vote:${date}:${wishIndex}:likes`;
  const dislikesKey = `dw:vote:${date}:${wishIndex}:dislikes`;
  
  const [likes, dislikes] = await Promise.all([
    kv.get<number>(likesKey),
    kv.get<number>(dislikesKey)
  ]);
  
  return { 
    likes: likes || 0, 
    dislikes: dislikes || 0 
  };
}

function generateFrameHtml(
  wishText: string,
  stats: { likes: number; dislikes: number },
  hasVoted: boolean,
  showThankYou: boolean = false
): string {
  const { likesPct, dislikesPct } = calculateVotePercentages(stats.likes, stats.dislikes);
  const totalVotes = stats.likes + stats.dislikes;
  const date = getTodayDateString();
  
  const statsText = totalVotes > 0 
    ? `Likes ${likesPct}% • Dislikes ${dislikesPct}% • ${totalVotes} votes`
    : 'Be the first to vote!';
  
  const thankYouText = showThankYou ? 'Thank you for voting! 🎉' : '';
  
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : 'https://daily-wishes-fixed.vercel.app';
  
  const imageText = encodeURIComponent([
    wishText,
    thankYouText,
    statsText
  ].filter(Boolean).join('|||'));
  
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Wish</title>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${baseUrl}/api/og?text=${imageText}" />
    <meta property="fc:frame:image:aspect_ratio" content="1:1" />
`;
  
  if (!hasVoted) {
    html += `    <meta property="fc:frame:button:1" content="👍 Like" />
    <meta property="fc:frame:button:1:action" content="post" />
    <meta property="fc:frame:button:2" content="👎 Dislike" />
    <meta property="fc:frame:button:2:action" content="post" />
    <meta property="fc:frame:post_url" content="${baseUrl}/api/vote" />
`;
  } else {
    html += `    <meta property="fc:frame:button:1" content="✓ Already Voted" />
`;
  }
  
  html += `</head>
<body>
    <h1>Daily Wish</h1>
    <p>${wishText}</p>
    ${thankYouText ? `<p><strong>${thankYouText}</strong></p>` : ''}
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
    const fid = await getFidFromRequest(req);
    const buttonIndex = await getButtonIndex(req);
    
    if (!fid) {
      return res.status(400).json({ error: 'FID is required to vote' });
    }

    if (buttonIndex === null) {
      return res.status(400).json({ error: 'Button index is required' });
    }
    
    const date = getTodayDateString();
    const wishIndex = getWishIndex(fid, date, wishes.length);
    const wish = wishes[wishIndex];
    
    const votersKey = `dw:vote:${date}:${wishIndex}:voters`;
    const hasVoted = await kv.sismember(votersKey, fid.toString());
    
    if (hasVoted) {
      const stats = await getVoteStats(date, wishIndex);
      const html = generateFrameHtml(wish, stats, true);
      
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    }
    
    const choice = buttonIndex === 1 ? 'like' : 'dislike';
    const likesKey = `dw:vote:${date}:${wishIndex}:likes`;
    const dislikesKey = `dw:vote:${date}:${wishIndex}:dislikes`;
    
    const wasAdded = await kv.sadd(votersKey, fid.toString());
    
    if (wasAdded) {
      if (choice === 'like') {
        await kv.incr(likesKey);
      } else {
        await kv.incr(dislikesKey);
      }
    }
    
    const stats = await getVoteStats(date, wishIndex);
    const html = generateFrameHtml(wish, stats, true, true);
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error in vote handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
