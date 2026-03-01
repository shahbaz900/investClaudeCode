# SmartStockPicker - Vercel Deployment Guide

## Quick Setup for Vercel

### Required API Keys (Get these first)

1. **Mistral AI API Key**
   - Go to: https://console.mistral.ai/api-keys/
   - Create a new API key
   - Cost: Free tier available

2. **FinnHub Stock API Key**
   - Go to: https://finnhub.io/dashboard
   - Sign up and get API key
   - Cost: Free tier available

3. **Supabase Credentials**
   - Go to: https://supabase.com/dashboard
   - Create new project
   - Get URL and anon key from Settings > API
   - Cost: Free tier available

### Vercel Environment Variables Setup

1. Push your code to GitHub/GitLab
2. Connect to Vercel Dashboard (https://vercel.com/dashboard)
3. Create new project from your repository
4. Go to **Settings → Environment Variables**
5. Add these variables:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_MISTRAL_API_KEY` | Your Mistral API key | Production, Preview, Development |
| `MISTRAL_API_KEY` | Your Mistral API key (same) | Production, Preview, Development |
| `NEXT_PUBLIC_FINNHUB_API_KEY` | Your FinnHub API key | Production, Preview, Development |
| `FINNHUB_API_KEY` | Your FinnHub API key (same) | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Production only |
| `NEXT_PUBLIC_API_URL` | https://your-backend-url.com | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | https://your-vercel-domain.vercel.app | Production only |

6. Click **Redeploy** to apply changes

### For Backend Deployment

If deploying backend separately (e.g., Railway, Render, Heroku):

Use these environment variables:
```
MISTRAL_API_KEY=your_key
FINNHUB_API_KEY=your_key
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=production
```

### Troubleshooting

- **"API key not found" error**: Check that `NEXT_PUBLIC_*` variables are added correctly
- **Stock data not loading**: Verify FinnHub API key is active
- **Authentication failing**: Confirm Supabase URL and keys are correct
- **CORS errors**: Your backend URL must be accessible from Vercel

### File Structure
- Frontend code is auto-deployed to Vercel
- Backend needs separate deployment (configure `NEXT_PUBLIC_API_URL` to point to it)
