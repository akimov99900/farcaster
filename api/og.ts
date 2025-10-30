import type { VercelRequest, VercelResponse } from '@vercel/node';

function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) lines.push(currentLine);
  return lines;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const wish = (req.query.wish as string) || 'Daily Wishes - Personalized Daily Inspiration';
  const stats = (req.query.stats as string) || '';
  const thankYou = req.query.thankYou === 'true';
  
  // Wrap wish text to fit in frame
  const wishLines = wrapText(wish, 50);
  const maxLines = 4;
  const displayLines = wishLines.slice(0, maxLines);
  if (wishLines.length > maxLines) {
    displayLines[maxLines - 1] += '...';
  }
  
  // Generate SVG with proper text wrapping
  const centerX = 600; // Center of 1200px wide image
  let yPos = 180;
  const lineHeight = 36;
  const textElements = displayLines.map((line, index) => {
    const y = yPos + (index * lineHeight);
    return `<text x="${centerX}" y="${y}" font-family="Arial, sans-serif" font-size="28" fill="white" text-anchor="middle" font-weight="600">${escapeXml(line)}</text>`;
  }).join('\n      ');
  
  const statsYPos = yPos + (displayLines.length * lineHeight) + 60;
  
  const svg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)" />
      
      <!-- Title -->
      <text x="${centerX}" y="100" font-family="Arial, sans-serif" font-size="42" fill="white" text-anchor="middle" font-weight="bold">✨ Daily Wish</text>
      
      <!-- Wish text (wrapped) -->
      ${textElements}
      
      ${thankYou ? `<text x="${centerX}" y="${statsYPos - 40}" font-family="Arial, sans-serif" font-size="32" fill="#ffd700" text-anchor="middle" font-weight="bold">Thank you for voting! 🎉</text>` : ''}
      
      <!-- Stats -->
      ${stats ? `<text x="${centerX}" y="${statsYPos}" font-family="Arial, sans-serif" font-size="26" fill="rgba(255,255,255,0.9)" text-anchor="middle">${escapeXml(stats)}</text>` : ''}
    </svg>
  `;
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(svg);
}
