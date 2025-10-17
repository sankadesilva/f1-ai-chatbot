# Deployment Guide

Complete guide for deploying the F1 Merchandise Chatbot API to Vercel and integrating with Wix.

## 📋 Pre-Deployment Checklist

- [ ] OpenAI API key ready
- [ ] GitHub repository created
- [ ] Vercel account created
- [ ] Environment variables documented
- [ ] Code tested locally

---

## 🚀 Deploy to Vercel

### Step 1: Prepare Your Repository

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: F1 Chatbot API"

# Create GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/f1-chatbot-api.git
git branch -M main
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 3: Add Environment Variables

In Vercel dashboard, add these environment variables:

```env
OPENAI_API_KEY=sk-your-actual-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo
NODE_ENV=production
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=20
CACHE_TTL_SECONDS=300
ALLOWED_ORIGINS=https://your-wix-site.com
```

### Step 4: Deploy

Click "Deploy" and wait for deployment to complete.

Your API will be available at: `https://your-project.vercel.app`

---

## 🧪 Test Your Deployment

### Test Health Endpoint

```bash
curl https://your-project.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123456,
  "cache": {
    "size": 0,
    "enabled": true
  },
  "environment": "production"
}
```

### Test Search Endpoint

```bash
curl -X POST https://your-project.vercel.app/api/search \
  -H "Content-Type: application/json" \
  -d '{"message": "Red Bull hoodie"}'
```

---

## 🔗 Integrate with Wix

### Step 1: Create Wix Backend File

In your Wix site, create a new backend file: `backend/chatbot.js`

```javascript
import { fetch } from 'wix-fetch';

const API_URL = 'https://your-project.vercel.app/api/search';

export async function searchF1Products(message) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Search error:', error);
    return {
      success: false,
      error: {
        code: 'REQUEST_FAILED',
        message: 'Failed to search products'
      }
    };
  }
}
```

### Step 2: Create Wix Frontend Code

On your Wix page, add this code:

```javascript
import { searchF1Products } from 'backend/chatbot';

$w.onReady(function () {
  // Handle search button click
  $w('#searchButton').onClick(async () => {
    const query = $w('#searchInput').value;
    
    if (!query.trim()) {
      return;
    }
    
    // Show loading
    $w('#loadingText').show();
    $w('#searchButton').disable();
    
    try {
      // Call backend API
      const result = await searchF1Products(query);
      
      if (result.success) {
        // Display results
        displayResults(result.data);
      } else {
        // Show error
        $w('#errorText').text = result.error.message;
        $w('#errorText').show();
      }
    } catch (error) {
      $w('#errorText').text = 'Something went wrong';
      $w('#errorText').show();
    } finally {
      $w('#loadingText').hide();
      $w('#searchButton').enable();
    }
  });
});

function displayResults(data) {
  // Display summary
  $w('#summaryText').text = data.summary;
  
  // Display products
  if (data.products && data.products.length > 0) {
    $w('#productsRepeater').data = data.products.map(product => ({
      _id: product.id,
      name: product.name,
      price: product.price.formattedAmount,
      image: product.imageUrl,
      link: product.url,
      source: product.source,
      availability: product.availability
    }));
    $w('#productsRepeater').show();
  }
}
```

### Step 3: Required Wix Elements

Add these elements to your Wix page:
- **Text Input**: `#searchInput`
- **Button**: `#searchButton`
- **Text**: `#loadingText` (hidden by default)
- **Text**: `#errorText` (hidden by default)
- **Text**: `#summaryText`
- **Repeater**: `#productsRepeater`

---

## 🔄 Update Deployment

When you make changes:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

Vercel will automatically deploy the new version.

---

## 🎯 Production Checklist

- [ ] API deployed successfully
- [ ] Health check returns 200
- [ ] Search endpoint tested
- [ ] CORS configured for Wix domain
- [ ] Rate limiting tested
- [ ] Error handling verified
- [ ] Wix integration tested
- [ ] Environment variables secured
- [ ] Logs monitored

---

## 📊 Monitoring

### View Logs

In Vercel dashboard:
1. Go to your project
2. Click "Deployments"
3. Click on latest deployment
4. Click "Functions" tab
5. View logs for each API call

### Monitor Performance

Check these metrics:
- Response times
- Error rates
- Cache hit rates
- Rate limit triggers

---

## 🐛 Troubleshooting

### API Returns 500 Error

**Check:**
- OpenAI API key is correct
- Environment variables are set
- View Vercel function logs

### CORS Errors

**Fix:**
Update `ALLOWED_ORIGINS` in Vercel environment variables:
```env
ALLOWED_ORIGINS=https://your-wix-site.com,https://www.your-wix-site.com
```

### Slow Response Times

**Optimize:**
- Enable caching
- Reduce number of scraper targets
- Increase cache TTL

---

## 💰 Cost Estimation

### Vercel
- **Hobby Plan**: Free
  - 100GB bandwidth/month
  - Serverless function execution time
  
- **Pro Plan**: $20/month
  - Unlimited bandwidth
  - Faster builds

### OpenAI
- **GPT-3.5-Turbo**: ~$0.002 per request
- **Estimated**: $40/month for 10,000 searches

### Total
- **Development**: $0/month (free tiers)
- **Production (10k searches/month)**: $40-60/month

---

## 🔒 Security Best Practices

1. **Never commit `.env` file**
2. **Use Vercel environment variables**
3. **Configure CORS properly**
4. **Enable rate limiting**
5. **Monitor API usage**
6. **Rotate API keys regularly**

---

## 📞 Support

For deployment issues:
- Vercel Docs: https://vercel.com/docs
- Wix Velo Docs: https://www.wix.com/velo/reference
- GitHub Issues: Your repository issues page

---

## ✅ Post-Deployment

After successful deployment:
1. Update README with production URL
2. Share API documentation with team
3. Set up monitoring alerts
4. Document any custom configurations
5. Create backup of environment variables

