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
- Environment variables:
  - `KV_URL`
  - `KV_REST_API_URL` 
  - `KV_REST_API_TOKEN`

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

1. Fork or clone this repository to your GitHub account
2. Go to [Vercel](https://vercel.com) and import the project
3. During import, enable "KV" storage from the Vercel dashboard
4. Deploy! The environment variables will be automatically configured by Vercel

**Important:** After deployment, you need to enable Vercel KV:
- Go to your project in Vercel dashboard
- Navigate to "Storage" tab
- Click "Create Database" → "KV"
- The environment variables (`KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`) will be automatically added

### Local Development

For local development with Vercel KV:

```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run locally
npm run dev
```

## How It Works

1. **Wish Selection**: Uses FNV-1a hash of `fid + date` to deterministically select a wish
2. **Frame Flow**: 
   - Entry: "Tell me my wish" button → `/api/wish`
   - Wish display: Shows wish with Like/Dislike buttons → `/api/vote`
   - After vote: Shows "Thank you!" with updated stats
3. **Vote Deduplication**: Uses KV sets to track who has voted each day
4. **Statistics**: Real-time percentages calculated from vote counts

## Testing

### Unit Tests

Run the test suite to verify hash function and wish selection logic:

```bash
npm test
```

### Manual Testing

Test the frame using Farcaster Frame simulators:

1. **Warpcast Frame Validator**
   - Go to https://warpcast.com/~/developers/frames
   - Enter your deployed URL
   - Test the frame interactions

2. **Neynar Frame Playground**
   - Go to https://dev.neynar.com/
   - Use the Frame Debugger tool
   - Enter your deployed URL

3. **Test Scenarios**
   - Initial load: "Tell me my wish" button should appear
   - Click button: Should show personalized wish with Like/Dislike buttons
   - Vote: Should show "Thank you!" message with updated stats
   - Vote again: Should show "Voted Today" and current stats
   - Different FIDs: Should get different wishes on the same day
   - Same FID next day: Should get a different wish

### Testing in Production

Once deployed, share your frame URL in a Farcaster cast to test with real users!

## License

MIT