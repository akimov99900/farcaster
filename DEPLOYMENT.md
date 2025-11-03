# Deployment Guide

## Quick Deploy to Vercel

### Prerequisites
- A Vercel account (sign up at https://vercel.com)
- A GitHub/GitLab/Bitbucket account

### Step-by-Step Deployment

1. **Push to Git Repository**
   ```bash
   git add .
   git commit -m "feat: implement daily wishes Farcaster frame"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Select your repository
   - Click "Import"

3. **Configure Project**
   - Framework Preset: Other (auto-detected)
   - Root Directory: `./`
   - Build Command: (leave empty - no build needed)
   - Output Directory: `public`
   - Install Command: `npm install`

4. **Enable Vercel KV Storage**
   After initial deployment:
   - Go to your project dashboard
   - Click "Storage" tab
   - Click "Create Database"
   - Select "KV" (Redis)
   - Name it (e.g., "daily-wishes-kv")
   - Click "Create"
   
   The following environment variables will be automatically added:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

5. **Redeploy**
   - After KV is configured, trigger a redeployment
   - Go to "Deployments" tab
   - Click "..." on the latest deployment
   - Click "Redeploy"

6. **Test Your Frame**
   - Copy your deployment URL (e.g., `https://daily-wishes-fixed.vercel.app`)
   - Go to Warpcast Frame Validator: https://warpcast.com/~/developers/frames
   - Paste your URL
   - Test the frame interactions

7. **Share on Farcaster**
   - Create a cast on Warpcast
   - Paste your frame URL
   - The frame will be embedded automatically
   - Users can interact directly in the feed!

## Local Development

If you want to develop locally with Vercel KV:

```bash
# Install Vercel CLI globally
npm install -g vercel

# Link to your Vercel project
vercel link

# Pull environment variables from Vercel
vercel env pull .env.local

# Run development server
npm run dev
```

Visit http://localhost:3000 to test locally.

## Troubleshooting

### Frame not loading in Warpcast
- Ensure your deployment URL is accessible (not localhost)
- Check that all frame meta tags are present in HTML
- Verify OG image endpoint returns valid SVG

### Vote not persisting
- Confirm Vercel KV is enabled and environment variables are set
- Check Vercel logs for errors: Dashboard → Your Project → Logs
- Verify KV connection: Dashboard → Storage → KV Database

### Different wish every refresh
- This is expected on first load (no FID yet)
- When clicked from Farcaster, FID is included and wish stays consistent per day
- Test with Warpcast Frame Validator to simulate real FID

### Stats not updating
- Check Vercel logs for vote endpoint errors
- Verify button indices are being captured correctly (1 = Like, 2 = Dislike)
- Test with different Farcaster accounts (different FIDs)

## Monitoring

Monitor your frame usage:
- **Vercel Analytics**: Dashboard → Your Project → Analytics
- **Vercel Logs**: Dashboard → Your Project → Logs  
- **KV Usage**: Dashboard → Storage → Your KV Database → Metrics

## Updating Wishes

To add or modify wishes:

1. Edit `src/wishes.ts`
2. Commit and push changes
3. Vercel will auto-deploy

Note: Changing the wish list will affect which wish users see for their FID + date combination, as the selection is based on array index.

## Cost Considerations

Vercel Free Tier includes:
- Unlimited deployments
- 100 GB bandwidth per month
- Serverless function invocations

Vercel KV Free Tier includes:
- 30,000 commands per month
- 256 MB storage
- 30 concurrent connections

For higher usage, upgrade to Vercel Pro plan.
