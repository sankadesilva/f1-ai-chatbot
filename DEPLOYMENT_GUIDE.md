# F1 AI Chatbot - Vercel Deployment Guide

## Prerequisites
- Vercel account (free at [vercel.com](https://vercel.com))
- GitHub account
- OpenAI API key

## Step 1: Prepare Your Repository

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Production ready F1 AI Chatbot"
   git push origin main
   ```

2. **Verify your project structure:**
   ```
   ├── pages/api/
   │   ├── chat.ts              # Main chatbot API
   │   ├── search.ts            # Product search API
   │   ├── health.ts            # Health check
   │   └── debug-f1-authentics-scraper.ts  # Debug endpoint
   ├── src/
   │   ├── config/              # Configuration
   │   ├── services/            # Core services
   │   ├── types/               # TypeScript types
   │   └── utils/               # Utilities
   ├── package.json
   ├── vercel.json             # Vercel configuration
   └── README.md
   ```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect it's a Next.js project
5. Click "Deploy"

### Option B: Deploy via Vercel CLI
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. Login to Vercel:
   ```bash
   vercel login
   ```
3. Deploy:
   ```bash
   vercel
   ```

## Step 3: Configure Environment Variables

1. In your Vercel dashboard, go to your project
2. Go to Settings → Environment Variables
3. Add the following variables:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `OPENAI_API_KEY` | Your OpenAI API key | Production, Preview, Development |
   | `NODE_ENV` | `production` | Production |

4. Click "Save" for each variable

## Step 4: Test Your Deployment

### Health Check
```bash
curl https://your-app-name.vercel.app/api/health
```
Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-16T17:45:00.000Z"
}
```

### Chat API Test
```bash
curl -X POST https://your-app-name.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hi, show me F1 helmets"}'
```

### Search API Test
```bash
curl -X POST https://your-app-name.vercel.app/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "F1 merchandise", "maxResults": 10}'
```

## Step 5: Postman Testing

1. Import the provided Postman collection: `F1_AI_Chatbot_Tests.postman_collection.json`
2. Update the environment variable `base_url` to your Vercel URL
3. Run the test suite

## Step 6: Monitor Your Deployment

### Vercel Dashboard
- Go to your project dashboard
- Check the "Functions" tab for API performance
- Monitor logs in the "Functions" → "View Function Logs"

### Key Metrics to Watch
- **Response Time**: Should be under 30 seconds
- **Success Rate**: Should be >95%
- **Error Rate**: Should be <5%

## Troubleshooting

### Common Issues

1. **Timeout Errors**
   - Vercel has a 60-second timeout for serverless functions
   - Our scraper is configured for this limit
   - If you get timeouts, check the logs

2. **Environment Variables Not Working**
   - Ensure variables are set for the correct environment
   - Redeploy after adding new variables

3. **OpenAI API Errors**
   - Check your API key is valid
   - Verify you have sufficient credits
   - Check rate limits

4. **Scraping Errors**
   - Some sites may block serverless functions
   - Check Vercel function logs for specific errors
   - Consider adding retry logic if needed

### Debug Endpoints

Use these for debugging (remove in production if desired):

- **F1 Authentics Debug**: `POST /api/debug-f1-authentics-scraper`
- **Health Check**: `GET /api/health`

## Production Checklist

- [ ] Code pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Environment variables configured
- [ ] Health check passes
- [ ] Chat API responds correctly
- [ ] Search API returns products
- [ ] All three targets working (F1 Authentics, Red Bull Shop, eBay)
- [ ] Postman tests passing
- [ ] Monitoring set up

## Support

If you encounter issues:
1. Check Vercel function logs
2. Test locally first with `npm run dev`
3. Verify environment variables
4. Check OpenAI API status

## Next Steps

After successful deployment:
1. Set up custom domain (optional)
2. Configure monitoring alerts
3. Set up CI/CD for automatic deployments
4. Consider adding rate limiting for production use