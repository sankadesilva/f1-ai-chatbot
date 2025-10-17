# 🔍 New Scraping Targets Research Guide

## Target Sites to Research

### 1. **eBay** (Priority: High)
- **URL**: https://www.ebay.com/sch/i.html?_nkw=formula+1+merchandise
- **Why**: Largest marketplace, tons of F1 items, both new and vintage
- **Challenges**: Anti-bot protection, dynamic pricing, various seller formats

### 2. **F1 Authentics** (Priority: High)
- **URL**: https://www.f1authentics.com
- **Why**: Official authentic F1 merchandise and collectibles
- **Challenges**: Premium pricing, limited stock, authentication requirements

### 3. **Facebook Marketplace** (Priority: Medium)
- **URL**: https://www.facebook.com/marketplace/search/?query=formula%201%20merchandise
- **Why**: Local deals, vintage items, good prices
- **Challenges**: Requires login, location-based, inconsistent format

### 4. **Grand Prix Racewear** (Priority: High)
- **URL**: https://www.grandprixracewear.com
- **Why**: Specialist motorsport auction house, authentic items
- **Challenges**: Auction format, limited availability

### 5. **Depop** (Priority: Medium)
- **URL**: https://www.depop.com/search/?q=formula+1
- **Why**: Clothes reselling site, good for vintage F1 items
- **Challenges**: Fashion-focused, may have less F1-specific items

## How to Test Each Site

### Quick Test Commands:
```bash
# Test all sites comprehensively
npm run research

# Test individual sites quickly
npm run test-site
```

### Manual Testing Steps:
1. **Visit the site** in your browser
2. **Search for "formula 1 merchandise"** or "F1"
3. **Inspect the HTML** to find product containers
4. **Look for patterns** in class names and structure
5. **Check for anti-bot measures** (captchas, rate limiting)

## Expected HTML Patterns

### eBay:
- Product containers: `.s-item`, `.srp-results .s-item`
- Titles: `h3`, `.s-item__title`
- Prices: `.s-item__price`, `.notranslate`
- Images: `img`, `.s-item__image img`

### F1 Authentics:
- Product containers: `.product`, `.product-item`, `.grid-item`
- Titles: `h3`, `.product-name`, `.title`
- Prices: `.price`, `.product-price`
- Images: `img`, `.product-image img`

### Facebook Marketplace:
- Product containers: `[data-testid="marketplace-search-result"]`
- Titles: Various, may be dynamic
- Prices: `.marketplace-search-result-price`
- Images: `img`, `.marketplace-search-result-image img`

## Implementation Strategy

### Phase 1: Research (Current)
- [x] Create research scripts
- [ ] Run comprehensive analysis
- [ ] Identify best selectors for each site

### Phase 2: Implementation
- [ ] Update `scraper-targets.ts` with new configurations
- [ ] Test scraping functionality
- [ ] Handle site-specific challenges

### Phase 3: Integration
- [ ] Integrate with existing search service
- [ ] Test end-to-end functionality
- [ ] Optimize for production

## Challenges to Watch For

### Anti-Bot Measures:
- **Cloudflare protection**
- **Rate limiting**
- **CAPTCHA challenges**
- **IP blocking**

### Technical Challenges:
- **JavaScript-heavy sites**
- **Dynamic content loading**
- **Inconsistent HTML structure**
- **Login requirements**

### Legal/Ethical Considerations:
- **Terms of service compliance**
- **Rate limiting respect**
- **User agent identification**
- **Request delays**

## Success Metrics

### Good Indicators:
- ✅ Can find product containers consistently
- ✅ Can extract product names, prices, images
- ✅ No obvious blockers or errors
- ✅ Reasonable response times

### Red Flags:
- ❌ CAPTCHA or security challenges
- ❌ No products found despite visible items
- ❌ Inconsistent HTML structure
- ❌ Very slow response times

## Next Steps

1. **Run the research scripts** to analyze each site
2. **Review the findings** and choose the best targets
3. **Update scraper configuration** with new sites
4. **Test the implementation** with real searches
5. **Deploy and monitor** performance

---

**Ready to start?** Run `npm run research` to begin analyzing the new targets!
