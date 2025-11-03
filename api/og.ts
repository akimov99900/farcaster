import type { VercelRequest, VercelResponse } from '@vercel/node';

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + word).length > maxCharsPerLine) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  }
  
  if (currentLine) lines.push(currentLine.trim());
  return lines;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const wish = req.query.wish as string || 'Daily Wishes - Personalized Daily Inspiration';
    const stats = req.query.stats as string || '';
    const thanks = req.query.thanks as string || '';
    
    // Wrap the wish text
    const wishLines = wrapText(wish, 40);
    const maxLines = 6;
    const displayLines = wishLines.slice(0, maxLines);
    if (wishLines.length > maxLines) {
      displayLines[maxLines - 1] = displayLines[maxLines - 1] + '...';
    }
    
    // Create SVG with multi-line text
    let yOffset = 140;
    const lineHeight = 32;
    
    const wishTextElements = displayLines.map((line, i) => {
      const y = yOffset + (i * lineHeight);
      return `<text x="300" y="${y}" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle">${line}</text>`;
    }).join('\n      ');
    
    const statsY = yOffset + (displayLines.length * lineHeight) + 40;
    const thanksY = thanks ? statsY - 30 : statsY;
    
    const svg = `
    <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="600" height="400" fill="url(#bg)" />
      <text x="300" y="60" font-family="Arial, sans-serif" font-size="28" fill="white" text-anchor="middle" font-weight="bold">✨ Daily Wish ✨</text>
      ${wishTextElements}
      ${thanks ? `<text x="300" y="${thanksY}" font-family="Arial, sans-serif" font-size="24" fill="#FFD700" text-anchor="middle" font-weight="bold">${thanks}</text>` : ''}
      ${stats ? `<text x="300" y="${statsY}" font-family="Arial, sans-serif" font-size="18" fill="white" text-anchor="middle" opacity="0.9">${stats}</text>` : ''}
    </svg>
  `;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(svg);
  } catch (error) {
    console.error('Error generating OG image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
}