import type { VercelRequest, VercelResponse } from '@vercel/node';

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const text = req.query.text as string || 'Daily Wishes';
    const parts = decodeURIComponent(text).split('|||');
    
    const wishText = parts[0] || 'Daily Wishes - Personalized Daily Inspiration';
    const thankYouText = parts[1] || '';
    const statsText = parts[2] || '';
    
    const wishLines = wrapText(wishText, 50);
    
    const svg = `<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)" />
  
  <text x="400" y="80" font-family="Arial, sans-serif" font-size="32" fill="white" text-anchor="middle" font-weight="bold">
    ✨ Daily Wish ✨
  </text>
  
  ${wishLines.map((line, i) => `
  <text x="400" y="${180 + i * 36}" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" font-style="italic">
    ${escapeXml(line)}
  </text>`).join('')}
  
  ${thankYouText ? `
  <text x="400" y="${220 + wishLines.length * 36 + 40}" font-family="Arial, sans-serif" font-size="28" fill="#FFD700" text-anchor="middle" font-weight="bold">
    ${escapeXml(thankYouText)}
  </text>` : ''}
  
  <rect x="150" y="${thankYouText ? 270 + wishLines.length * 36 + 60 : 240 + wishLines.length * 36 + 40}" width="500" height="2" fill="white" opacity="0.5" />
  
  <text x="400" y="${thankYouText ? 300 + wishLines.length * 36 + 80 : 270 + wishLines.length * 36 + 60}" font-family="Arial, sans-serif" font-size="22" fill="white" text-anchor="middle">
    ${escapeXml(statsText)}
  </text>
</svg>`;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.status(200).send(svg);
  } catch (error) {
    console.error('Error generating OG image:', error);
    
    const fallbackSvg = `<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)" />
  <text x="400" y="400" font-family="Arial, sans-serif" font-size="32" fill="white" text-anchor="middle" font-weight="bold">
    Daily Wishes
  </text>
</svg>`;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.status(200).send(fallbackSvg);
  }
}
