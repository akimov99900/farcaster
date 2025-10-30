import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { wishes } from '../../src/wishes';
import { getTodayDateString, getWishIndex, calculateVotePercentages } from '../../src/utils';

// Helper function to extract FID from request
function getFidFromRequest(request: NextRequest): number | null {
  // Try to get FID from frame post data
  if (request.method === 'POST') {
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return request.json().then(data => data.untrustedData?.fid || null).catch(() => null);
    } else if (contentType?.includes('application/x-www-form-urlencoded')) {
      return request.text().then(text => {
        const params = new URLSearchParams(text);
        const untrustedData = params.get('untrustedData');
        if (untrustedData) {
          try {
            return JSON.parse(untrustedData).fid || null;
          } catch {
            return null;
          }
        }
        return null;
      }).catch(() => null);
    }
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
  return isMember;
}

// Helper function to generate frame HTML
function generateFrameHtml(
  wishText: string,
  stats: { likes: number; dislikes: number },
  hasVoted: boolean,
  fid: number | null,
  showThankYou: boolean = false
): string {
  const { likesPct, dislikesPct } = calculateVotePercentages(stats.likes, stats.dislikes);
  const totalVotes = stats.likes + stats.dislikes;
  const date = getTodayDateString();
  
  const statsText = totalVotes > 0 
    ? `Likes ${likesPct}% • Dislikes ${dislikesPct}% • ${totalVotes} votes`
    : 'Be the first to vote!';
  
  const thankYouText = showThankYou ? '\n\nThank you for voting! 🎉' : '';
  
  // Create image text
  const imageText = encodeURIComponent(`Daily Wish ${date}\n\n"${wishText}"${thankYouText}\n\n${statsText}`);
  
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Wish</title>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="https://daily-wishes-fixed.vercel.app/api/og?text=${imageText}" />
  `;
  
  if (!hasVoted) {
    html += `
    <meta property="fc:frame:button:1" content="👍 Like" />
    <meta property="fc:frame:button:1:action" content="post" />
    <meta property="fc:frame:button:1:target" content="https://daily-wishes-fixed.vercel.app/api/vote" />
    <meta property="fc:frame:button:2" content="👎 Dislike" />
    <meta property="fc:frame:button:2:action" content="post" />
    <meta property="fc:frame:button:2:target" content="https://daily-wishes-fixed.vercel.app/api/vote" />
    `;
  } else {
    html += `
    <meta property="fc:frame:button:1" content="✓ Voted Today" />
    <meta property="fc:frame:button:2" content="📊 View Stats" />
    `;
  }
  
  // Add hidden data for vote requests
  if (!hasVoted && fid) {
    html += `
    <meta property="fc:frame:state" content="${JSON.stringify({ fid, date, wishIndex: wishes.indexOf(wishText) })}" />
    `;
  }
  
  html += `
</head>
<body>
    <script>
        // Redirect to main page if not in frame context
        if (!window.location.search.includes('frame=true')) {
            window.location.href = '/';
        }
    </script>
</body>
</html>`;
  
  return html;
}

export async function GET(request: NextRequest) {
  const fid = getFidFromRequest(request);
  const date = getTodayDateString();
  const wishIndex = getWishIndex(fid, date, wishes.length);
  const wish = wishes[wishIndex];
  
  const stats = await getVoteStats(date, wishIndex);
  const hasVoted = fid ? await hasUserVotedToday(date, wishIndex, fid) : false;
  
  const html = generateFrameHtml(wish, stats, hasVoted, fid);
  
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

export async function POST(request: NextRequest) {
  const fid = getFidFromRequest(request);
  const date = getTodayDateString();
  const wishIndex = getWishIndex(fid, date, wishes.length);
  const wish = wishes[wishIndex];
  
  const stats = await getVoteStats(date, wishIndex);
  const hasVoted = fid ? await hasUserVotedToday(date, wishIndex, fid) : false;
  
  const html = generateFrameHtml(wish, stats, hasVoted, fid);
  
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}