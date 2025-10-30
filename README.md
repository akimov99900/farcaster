# Daily Wishes - Farcaster Frame

A Farcaster Frame that serves personalized daily wishes with Like/Dislike voting functionality using Vercel KV for persistence.

## Features

- **Personalized Daily Wishes**: Each user gets a unique wish every day based on their FID
- **Voting System**: Like/Dislike votes with live statistics
- **One Vote Per Day**: Enforced server-side using Vercel KV
- **Live Statistics**: Shows vote percentages and total counts
- **Graceful Fallback**: Works even when FID is not available

## Architecture

### File Structure

```
├── src/
│   ├── wishes.ts          # Static list of wishes
│   └── utils.ts           # Utility functions (hash, date helpers)
├── api/
│   ├── wish.ts            # Main wish endpoint
│   ├── vote.ts            # Vote processing endpoint
│   └── og.ts              # Open Graph image generation
├── __tests__/
│   └── wish-selection.test.ts  # Unit tests
├── index.html             # Landing page with frame metadata
├── package.json
├── tsconfig.json
└── vercel.json            # Vercel configuration
```

### API Endpoints

- `GET/POST /api/wish` - Returns the user's daily wish frame
- `POST /api/vote` - Processes Like/Dislike votes
- `GET /api/og` - Generates dynamic OG images for frames

### KV Storage Schema

```
dw:vote:{date}:{wishIndex}:likes     -> integer count
dw:vote:{date}:{wishIndex}:dislikes  -> integer count  
dw:vote:{date}:{wishIndex}:voters   -> set of FIDs who voted
```

## Development

### Prerequisites

- Node.js 18+
- Vercel account with KV configured
- Environment variables (auto-configured when using Vercel KV):
  - `KV_URL`
  - `KV_REST_API_URL` 
  - `KV_REST_API_TOKEN`
  - `KV_REST_API_READ_ONLY_TOKEN` (optional)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run locally:
   ```bash
   npm run dev
   ```

3. Run tests:
   ```bash
   npm test
   ```

### Deployment

1. **Deploy to Vercel:**
   ```bash
   vercel
   ```

2. **Add Vercel KV:**
   - Go to your Vercel project dashboard
   - Navigate to Storage → Create Database → KV
   - Name your database (e.g., "daily-wishes-kv")
   - Connect it to your project
   - Environment variables will be automatically configured

3. **Verify Deployment:**
   - Visit your deployment URL
   - Test the Frame in Warpcast or a Frame simulator
   - The initial button should say "Tell me my wish"
   - After clicking, you should see your personalized wish with Like/Dislike buttons
   - After voting, you should see "Thank you!" message with live stats

## How It Works

1. **Wish Selection**: Uses FNV-1a hash of `fid + date` to deterministically select a wish
2. **Frame Flow**: 
   - Entry: "Tell me my wish" button → `/api/wish`
   - Wish display: Shows wish with Like/Dislike buttons → `/api/vote`
   - After vote: Shows "Thank you!" with updated stats
3. **Vote Deduplication**: Uses KV sets to track who has voted each day
4. **Statistics**: Real-time percentages calculated from vote counts

## Testing

- Unit tests for hash function and wish selection logic
- Manual testing via Farcaster Frame simulators (Warpcast devtools, Neynar playground)
- Test various scenarios: with/without FID, repeat votes, multiple users

## License

MIT