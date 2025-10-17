# 🧪 Postman Testing Guide for New Scraping Targets

## How to Test New Sites with Postman

### 1. **Test New Targets API Endpoint**
**URL**: `http://localhost:3000/api/test-new-targets`  
**Method**: `POST`

### 2. **Available Test Sites**
- `ebay` - eBay Formula 1 merchandise
- `f1authentics` - F1 Authentics official store
- `depop` - Depop fashion reselling
- `grandprix` - Grand Prix Racewear

## 📝 Postman Request Examples

### **Test eBay**
```json
POST http://localhost:3000/api/test-new-targets
Content-Type: application/json

{
  "site": "ebay",
  "searchQuery": "formula 1 merchandise",
  "maxProducts": 5
}
```

### **Test F1 Authentics**
```json
POST http://localhost:3000/api/test-new-targets
Content-Type: application/json

{
  "site": "f1authentics",
  "searchQuery": "red bull",
  "maxProducts": 3
}
```

### **Test Depop**
```json
POST http://localhost:3000/api/test-new-targets
Content-Type: application/json

{
  "site": "depop",
  "searchQuery": "formula 1",
  "maxProducts": 4
}
```

### **Test Grand Prix Racewear**
```json
POST http://localhost:3000/api/test-new-targets
Content-Type: application/json

{
  "site": "grandprix",
  "searchQuery": "f1",
  "maxProducts": 3
}
```

## 📊 Expected Response Format

```json
{
  "success": true,
  "site": "eBay",
  "searchQuery": "formula 1 merchandise",
  "productsFound": 5,
  "products": [
    {
      "name": "Red Bull Racing F1 Hoodie",
      "price": "$45.99",
      "image": "https://example.com/image.jpg",
      "link": "https://example.com/product"
    }
  ],
  "selectors": {
    "container": ".s-item",
    "name": "h3, .s-item__title",
    "price": ".s-item__price, .notranslate",
    "image": "img",
    "link": "a"
  },
  "errors": [],
  "processingTime": 3500
}
```

## 🔍 What to Look For

### **Good Results:**
- ✅ `success: true`
- ✅ `productsFound > 0`
- ✅ Products have names, prices, images
- ✅ `processingTime < 10000` (10 seconds)
- ✅ No errors or minimal errors

### **Poor Results:**
- ❌ `success: false`
- ❌ `productsFound: 0`
- ❌ Missing product data
- ❌ Very long processing times
- ❌ Many errors

## 🧪 Testing Strategy

### **Step 1: Basic Functionality**
Test each site with a simple query:
```json
{
  "site": "ebay",
  "searchQuery": "formula 1",
  "maxProducts": 3
}
```

### **Step 2: Specific Searches**
Test with specific F1 terms:
```json
{
  "site": "ebay",
  "searchQuery": "red bull racing hoodie",
  "maxProducts": 5
}
```

### **Step 3: Compare Results**
Test the same query across different sites:
```json
// Test 1: eBay
{
  "site": "ebay",
  "searchQuery": "ferrari cap",
  "maxProducts": 3
}

// Test 2: F1 Authentics
{
  "site": "f1authentics",
  "searchQuery": "ferrari cap",
  "maxProducts": 3
}
```

## 🚨 Troubleshooting

### **Common Issues:**

1. **No products found:**
   - Try different search terms
   - Check if selectors need updating
   - Verify site is accessible

2. **Timeout errors:**
   - Site may be slow
   - Anti-bot protection
   - Network issues

3. **Selector errors:**
   - HTML structure changed
   - Need to update selectors
   - Site uses different patterns

### **Debugging Steps:**
1. Check the response for error messages
2. Try simpler search queries
3. Test with `maxProducts: 1` first
4. Check if site is accessible in browser

## 📈 Success Metrics

### **Excellent Results:**
- 5+ products found
- All products have complete data
- Processing time < 5 seconds
- No errors

### **Good Results:**
- 3+ products found
- Most products have data
- Processing time < 10 seconds
- Few errors

### **Poor Results:**
- 0-2 products found
- Missing product data
- Processing time > 15 seconds
- Many errors

## 🎯 Next Steps

After testing:
1. **Identify the best performing sites**
2. **Note any selector issues**
3. **Update scraper configuration**
4. **Integrate with main search API**

---

**Ready to test?** Start with eBay and work through each site!
