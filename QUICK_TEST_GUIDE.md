# 🚀 Quick Test Guide for F1 AI Chatbot

## 📥 Import Setup (2 minutes)

### 1. Import Collection
- Open Postman
- Click **Import** button
- Select `F1_AI_Chatbot_Tests.postman_collection.json`
- Click **Import**

### 2. Import Environment
- Click **Import** button again
- Select `F1_Chatbot_Environment.postman_environment.json`
- Click **Import**

### 3. Select Environment
- In the top-right corner, select **"F1 Chatbot Environment"** from the dropdown

## 🧪 Quick Test Sequence (5 minutes)

### Step 1: Health Check
1. Run **"Health Check"** request
2. ✅ Should return 200 status

### Step 2: Verify Configuration
1. Run **"Verify Working Targets"** request
2. ✅ Should show F1 Authentics, Red Bull Shop, and eBay enabled

### Step 3: Basic Search Test
1. Run **"Search F1 Helmets"** request
2. ✅ Should return products from all 3 sources
3. ✅ Response time should be under 30 seconds

### Step 4: Conversational Test
1. Run **"Conversational F1 Search"** request
2. ✅ Should return AI-generated summary
3. ✅ Should include products from multiple sources

### Step 5: Error Handling Test
1. Run **"Test Empty Message Error"** request
2. ✅ Should return 400 status with error message

## 🎯 Success Criteria

Your chatbot is working correctly if:
- ✅ All requests return expected status codes
- ✅ Products are returned from F1 Authentics, Red Bull Shop, and eBay
- ✅ AI summaries are coherent and relevant
- ✅ Response times are under 30 seconds
- ✅ Error handling works properly

## 🔧 Troubleshooting

### If requests fail:
1. **Check if API is running**: `npm run dev` or `yarn dev`
2. **Check port**: Default is `http://localhost:3000`
3. **Check logs**: Look at your terminal for error messages
4. **Test individual sources**: Use debug endpoints

### Debug Endpoints:
- `POST {{base_url}}/api/debug-f1-authentics` - Test F1 Authentics
- `POST {{base_url}}/api/debug-ebay` - Test eBay
- `GET {{base_url}}/api/health` - Check system health

## 📊 Performance Expectations

- **Response Time**: 10-30 seconds (depending on query complexity)
- **Success Rate**: 95%+ for working targets
- **Product Count**: 5-50 products per search (depending on query)
- **Sources**: All 3 sources should contribute products

## 🚀 Ready for Production?

If all tests pass, your chatbot is ready for production! The three working targets (F1 Authentics, Red Bull Shop, eBay) will provide comprehensive F1 merchandise search results.

---

**Happy Testing! 🏁**
