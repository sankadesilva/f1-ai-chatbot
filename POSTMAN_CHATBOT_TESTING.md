# 🤖 AI Chatbot Testing Guide for Postman

This guide provides comprehensive Postman tests to simulate real AI chatbot conversations with your F1 merchandise scraper.

## 📋 Prerequisites

1. **Postman installed** (Desktop or Web version)
2. **Your API running locally** (usually `http://localhost:3000`)
3. **Environment variables set** (if needed)

## 🚀 Quick Setup

### 1. Create a New Postman Collection
- Name: `F1 AI Chatbot Tests`
- Description: `Comprehensive tests for F1 merchandise AI chatbot`

### 2. Set up Environment Variables
Create a new environment with these variables:
```
base_url: http://localhost:3000
api_endpoint: {{base_url}}/api/search
```

## 🧪 Test Scenarios

### Test 1: Basic F1 Merchandise Search
**Request Name:** `Search F1 Helmets`
**Method:** `POST`
**URL:** `{{api_endpoint}}`
**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "message": "I'm looking for F1 helmets",
  "maxResults": 10
}
```

**Expected Response:**
- Status: 200
- Contains products from F1 Authentics, Red Bull Shop, and eBay
- AI-generated summary

---

### Test 2: Specific Driver Merchandise
**Request Name:** `Search Lewis Hamilton Merchandise`
**Method:** `POST`
**URL:** `{{api_endpoint}}`

**Body:**
```json
{
  "message": "Do you have any Lewis Hamilton merchandise?",
  "maxResults": 15
}
```

---

### Test 3: Team-Specific Search
**Request Name:** `Search Red Bull Racing Items`
**Method:** `POST`
**URL:** `{{api_endpoint}}`

**Body:**
```json
{
  "message": "Show me Red Bull Racing team merchandise",
  "maxResults": 12
}
```

---

### Test 4: Budget-Conscious Search
**Request Name:** `Search Affordable F1 Items`
**Method:** `POST`
**URL:** `{{api_endpoint}}`

**Body:**
```json
{
  "message": "I want F1 merchandise under $50",
  "maxResults": 20
}
```

---

### Test 5: Category-Specific Search
**Request Name:** `Search F1 Apparel`
**Method:** `POST`
**URL:** `{{api_endpoint}}`

**Body:**
```json
{
  "message": "What F1 clothing and apparel do you have?",
  "maxResults": 15
}
```

---

### Test 6: Conversational Query
**Request Name:** `Conversational F1 Search`
**Method:** `POST`
**URL:** `{{api_endpoint}}`

**Body:**
```json
{
  "message": "I'm a new F1 fan and want to buy some cool merchandise for my room",
  "maxResults": 25
}
```

---

### Test 7: Specific Item Search
**Request Name:** `Search F1 Diecast Cars`
**Method:** `POST`
**URL:** `{{api_endpoint}}`

**Body:**
```json
{
  "message": "I'm looking for F1 diecast model cars",
  "maxResults": 10
}
```

---

### Test 8: Error Handling - Empty Message
**Request Name:** `Test Empty Message Error`
**Method:** `POST`
**URL:** `{{api_endpoint}}`

**Body:**
```json
{
  "message": "",
  "maxResults": 10
}
```

**Expected Response:**
- Status: 400
- Error message about empty message

---

### Test 9: Error Handling - Message Too Long
**Request Name:** `Test Message Too Long`
**Method:** `POST`
**URL:** `{{api_endpoint}}`

**Body:**
```json
{
  "message": "This is a very long message that exceeds the 500 character limit and should trigger an error response from the API because it's too long and contains too many characters to be processed properly by the system which has a maximum limit of 500 characters per message to ensure optimal performance and prevent abuse of the API endpoint which could potentially cause issues with the server if messages were allowed to be unlimited in length which would not be a good practice for any production API system that needs to handle multiple concurrent requests efficiently without running into memory or processing issues that could affect the overall user experience and system stability",
  "maxResults": 10
}
```

**Expected Response:**
- Status: 400
- Error message about message length

---

### Test 10: Rate Limiting Test
**Request Name:** `Test Rate Limiting`
**Method:** `POST`
**URL:** `{{api_endpoint}}`

**Body:**
```json
{
  "message": "test rate limit",
  "maxResults": 5
}
```

**Note:** Run this request multiple times quickly to test rate limiting

---

## 🔄 Automated Test Sequence

### Create a Test Collection with Pre-request Scripts

**Pre-request Script (for all requests):**
```javascript
// Add timestamp to prevent caching
pm.globals.set("timestamp", Date.now());
```

**Test Script (for all requests):**
```javascript
// Basic response validation
pm.test("Response status is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success field", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
});

pm.test("Response has timestamp", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('timestamp');
});

// For successful responses
if (pm.response.code === 200) {
    pm.test("Response contains data", function () {
        const jsonData = pm.response.json();
        pm.expect(jsonData).to.have.property('data');
    });
    
    pm.test("Data contains products array", function () {
        const jsonData = pm.response.json();
        pm.expect(jsonData.data).to.have.property('products');
        pm.expect(jsonData.data.products).to.be.an('array');
    });
    
    pm.test("Data contains search summary", function () {
        const jsonData = pm.response.json();
        pm.expect(jsonData.data).to.have.property('summary');
        pm.expect(jsonData.data.summary).to.be.a('string');
    });
    
    pm.test("Response time is reasonable", function () {
        pm.expect(pm.response.responseTime).to.be.below(30000); // 30 seconds max
    });
}

// For error responses
if (pm.response.code >= 400) {
    pm.test("Error response has error field", function () {
        const jsonData = pm.response.json();
        pm.expect(jsonData).to.have.property('error');
    });
}
```

## 🎯 Advanced Testing Scenarios

### Test 11: Multi-Source Verification
**Request Name:** `Verify All Sources Working`
**Method:** `POST`
**URL:** `{{api_endpoint}}`

**Body:**
```json
{
  "message": "F1 merchandise from all sources",
  "maxResults": 30
}
```

**Test Script:**
```javascript
pm.test("All three sources are present", function () {
    const jsonData = pm.response.json();
    const sources = jsonData.data.sources;
    
    pm.expect(sources).to.include('F1 Authentics');
    pm.expect(sources).to.include('Red Bull Shop');
    pm.expect(sources).to.include('eBay');
});
```

### Test 12: Performance Test
**Request Name:** `Performance Test`
**Method:** `POST`
**URL:** `{{api_endpoint}}`

**Body:**
```json
{
  "message": "F1 merchandise performance test",
  "maxResults": 50
}
```

**Test Script:**
```javascript
pm.test("Response time is under 60 seconds", function () {
    pm.expect(pm.response.responseTime).to.be.below(60000);
});

pm.test("Response time is under 30 seconds", function () {
    pm.expect(pm.response.responseTime).to.be.below(30000);
});
```

## 📊 Monitoring and Analytics

### Test 13: Health Check
**Request Name:** `Health Check`
**Method:** `GET`
**URL:** `{{base_url}}/api/health`

**Expected Response:**
- Status: 200
- Contains system status

### Test 14: Working Targets Verification
**Request Name:** `Verify Working Targets`
**Method:** `POST`
**URL:** `{{base_url}}/api/test-working-targets`

**Body:**
```json
{
  "query": "test"
}
```

## 🚀 Running the Tests

### Manual Testing
1. Import the collection into Postman
2. Set up the environment variables
3. Run individual requests to test specific scenarios
4. Check responses for expected data structure

### Automated Testing
1. Use Postman's Collection Runner
2. Set iterations to 1-3 for each test
3. Enable "Save responses" to review results
4. Check the test results tab for any failures

## 📝 Expected Response Format

### Successful Response:
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "unique-id",
        "name": "Product Name",
        "description": "Product description",
        "url": "https://...",
        "imageUrl": "https://...",
        "price": {
          "amount": 29.99,
          "formattedAmount": "$29.99",
          "currency": "USD"
        },
        "brand": "Brand Name",
        "category": "Category",
        "availability": "IN_STOCK",
        "source": "F1 Authentics",
        "scrapedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "searchQuery": "user query",
    "intent": {
      "item": "helmet",
      "team": "Red Bull",
      "driver": "Lewis Hamilton",
      "budget": 50,
      "category": "apparel"
    },
    "summary": "AI-generated summary of results",
    "sources": ["F1 Authentics", "Red Bull Shop", "eBay"],
    "totalFound": 15,
    "processingTime": 2500
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": "Additional error details"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔧 Troubleshooting

### Common Issues:
1. **Connection Refused**: Check if your API is running on the correct port
2. **Timeout Errors**: Increase timeout in Postman settings
3. **Empty Results**: Check if the scrapers are working properly
4. **Rate Limiting**: Wait between requests or check rate limit settings

### Debug Steps:
1. Check the console logs in your API
2. Use the debug endpoints (`/api/debug-f1-authentics`, `/api/debug-ebay`)
3. Verify environment variables are set correctly
4. Check network connectivity

## 📈 Success Metrics

A successful test should show:
- ✅ All requests return 200 status (except error tests)
- ✅ Response time under 30 seconds
- ✅ Products from all three sources (F1 Authentics, Red Bull Shop, eBay)
- ✅ AI-generated summaries are coherent
- ✅ Product data is properly structured
- ✅ Error handling works correctly

---

**Happy Testing! 🏁**
