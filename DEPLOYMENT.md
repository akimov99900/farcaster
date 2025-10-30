# Deployment Guide

## Vercel Deployment

### Prerequisites
1. Vercel account
2. Vercel CLI installed: `npm i -g vercel`

### Setup Steps

#### 1. Create Vercel KV Store
```bash
# Login to Vercel
vercel login

# Link your project
vercel link

# Create a KV store
vercel kv create daily-wishes-kv
```

#### 2. Environment Variables
The KV creation will automatically set these variables:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

Verify in your Vercel project settings: Settings → Environment Variables

#### 3. Deploy
```bash
# Deploy to production
vercel --prod

# Or push to your connected Git repository
git push origin main
```

### Testing the Frame

#### Farcaster Frame Validators
Test your frame using these tools:

1. **Warpcast Frame Validator**
   - https://warpcast.com/~/developers/frames
   - Enter your deployment URL

2. **Neynar Frame Playground**
   - https://docs.neynar.com/docs/how-to-build-a-farcaster-frame
   - Test frame interactions with mock FIDs

#### Local Testing
```bash
# Install dependencies
npm install

# Run tests
npm test

# Start local dev server (requires Vercel CLI and KV setup)
vercel dev
```

### Troubleshooting

#### KV Connection Issues
- Verify environment variables are set in Vercel dashboard
- Check KV store is in the same Vercel team/project
- Review logs: `vercel logs <deployment-url>`

#### Frame Not Displaying
- Validate frame metadata using validators above
- Check image URL is accessible: `/api/og`
- Ensure proper CORS headers (handled automatically by Vercel)

#### Votes Not Persisting
- Check KV connection in Vercel logs
- Verify FID is being extracted from frame POST data
- Test with frame validator tools that send proper POST data

### Environment Variables

#### Production
Set in Vercel Dashboard → Settings → Environment Variables:
- `KV_URL` (auto-set by Vercel KV)
- `KV_REST_API_URL` (auto-set by Vercel KV)
- `KV_REST_API_TOKEN` (auto-set by Vercel KV)

#### Local Development
Create `.env.local`:
```bash
KV_URL="your-kv-url"
KV_REST_API_URL="your-kv-rest-api-url"
KV_REST_API_TOKEN="your-kv-rest-api-token"
```

Get these values from Vercel Dashboard → Storage → KV → daily-wishes-kv → `.env.local` tab

### Monitoring

#### Check Vote Statistics
You can query KV directly:
```bash
# Get today's stats for wish index 0
vercel kv get dw:vote:2024-01-15:0:likes
vercel kv get dw:vote:2024-01-15:0:dislikes
vercel kv smembers dw:vote:2024-01-15:0:voters
```

#### View Logs
```bash
vercel logs <deployment-url> --follow
```

## Manual Deployment (Alternative)

If not using Vercel:
1. Ensure Node.js 18+ runtime
2. Configure Redis-compatible KV store (Upstash, Redis Cloud, etc.)
3. Set environment variables for KV connection
4. Update base URLs in code if needed
5. Deploy with your preferred serverless platform
