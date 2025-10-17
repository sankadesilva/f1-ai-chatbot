# F1 AI Chatbot - Quick Start

## Deploy in 5 Minutes

### 1. Fork & Deploy
1. Click the "Deploy" button below
2. Connect your GitHub account
3. Add your OpenAI API key
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### 2. Test Your Deployment
```bash
# Replace with your Vercel URL
export VERCEL_URL="https://your-app-name.vercel.app"

# Run production tests
node test-production.js
```

### 3. Use the API

#### Chat API
```bash
curl -X POST https://your-app-name.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me F1 helmets"}'
```

#### Search API
```bash
curl -X POST https://your-app-name.vercel.app/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "F1 merchandise", "maxResults": 10}'
```

## 🎯 What You Get

- **AI Chat**: Natural conversations about F1 merchandise
- **Live Scraping**: F1 Authentics, Red Bull Shop, eBay
- **Smart Search**: AI understands context and preferences
- **Production Ready**: Scalable, monitored, and reliable

## Full Documentation

- [Complete Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [API Documentation](./README.md)
- [Postman Collection](./F1_AI_Chatbot_Tests.postman_collection.json)

## Need Help?

1. Check the [Deployment Guide](./DEPLOYMENT_GUIDE.md)
2. Run the production test script
3. Check Vercel function logs
4. Verify environment variables

## Success!

Once deployed, you'll have a fully functional F1 merchandise AI chatbot that can:
- Answer questions about F1 merchandise
- Search across multiple sources
- Provide personalized recommendations
- Handle natural language queries

**Happy racing!**