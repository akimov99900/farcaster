# Quick Start Guide

Get your Daily Wishes Farcaster Frame up and running in minutes!

## 🚀 Deploy to Vercel (5 minutes)

1. **Fork this repository** to your GitHub account

2. **Deploy to Vercel**
   - Visit https://vercel.com/new
   - Import your forked repository
   - Click "Deploy"

3. **Enable Vercel KV**
   - After deployment, go to your project dashboard
   - Navigate to "Storage" tab
   - Click "Create Database" → Select "KV"
   - Environment variables will be auto-configured

4. **Redeploy**
   - Go to "Deployments" → Click "..." → "Redeploy"
   - Your frame is now live! 🎉

5. **Test it**
   - Copy your Vercel URL
   - Go to https://warpcast.com/~/developers/frames
   - Paste your URL and test

6. **Share it**
   - Create a cast on Warpcast
   - Paste your URL
   - Watch users interact with your frame!

## 📋 What You Get

- ✨ **20 unique daily wishes** that rotate based on user + date
- 👍👎 **Like/Dislike voting** with live statistics
- 🔒 **One vote per day** per user, enforced server-side
- 📊 **Real-time stats** showing percentages and total votes
- 🎯 **Personalized** - each user gets a different wish each day
- 🌐 **English UI** throughout

## 🎨 Customization

### Change the Wishes

Edit `src/wishes.ts`:

```typescript
export const wishes = [
  "Your custom wish here...",
  "Another inspiring message...",
  // Add as many as you want!
];
```

### Update Colors

Edit `api/og.ts` to change the gradient colors:

```typescript
<stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
<stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
```

### Modify Landing Page

Edit `public/index.html` to customize your landing page design.

## 🧪 Testing

### Run Unit Tests
```bash
npm test
```

### Test Frame Locally
```bash
# Install Vercel CLI
npm i -g vercel

# Link project and pull env vars
vercel link
vercel env pull .env.local

# Run dev server
npm run dev
```

### Test in Frame Validators
- **Warpcast**: https://warpcast.com/~/developers/frames
- **Neynar**: https://dev.neynar.com/

## 📱 How Users Interact

1. **See the frame** in their Farcaster feed
2. **Click "Tell me my wish"** to get their personalized daily wish
3. **Vote with Like 👍 or Dislike 👎** buttons
4. **See thank you message** with updated vote percentages
5. **Come back tomorrow** for a new wish!

## 💡 Tips

- **Daily reset**: Wishes and votes reset at midnight UTC
- **Unique wishes**: Each user (FID) gets a deterministic but unique wish per day
- **Vote privacy**: Individual votes are not exposed, only aggregated stats
- **Scalability**: Vercel KV handles up to 30K requests/month on free tier
- **Analytics**: Check Vercel dashboard for usage stats

## 🆘 Need Help?

Check out:
- [README.md](./README.md) - Full documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment guide
- Vercel docs: https://vercel.com/docs
- Farcaster Frames: https://docs.farcaster.xyz/

## 🌟 What's Next?

Ideas to extend your frame:
- Add more wishes
- Create themed wish collections
- Add time-of-day personalization
- Implement wish categories
- Add share functionality
- Create leaderboards
- Multi-language support

Happy building! 🎉
