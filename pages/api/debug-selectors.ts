/**
 * Debug Selectors API - Find the right CSS selectors for scraping
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Only POST requests are allowed'
    });
  }

  const { site, searchQuery } = req.body;

  if (!site || !searchQuery) {
    return res.status(400).json({
      success: false,
      error: 'Site and searchQuery are required'
    });
  }

  let browser = null;

  try {
    // Build search URL
    let searchUrl: string;
    
    if (site === 'ebay') {
      searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}`;
    } else if (site === 'f1authentics') {
      searchUrl = `https://www.f1authentics.com/search?q=${encodeURIComponent(searchQuery)}`;
    } else {
      searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}`;
    }

    console.log(`Debugging ${site}: ${searchUrl}`);

    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate to search page
    await page.goto(searchUrl, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });

    // Wait for content to load - eBay is slow
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Debug analysis
    const debugInfo = await page.evaluate(() => {
      const results: any = {
        pageTitle: document.title,
        currentUrl: window.location.href,
        totalElements: document.querySelectorAll('*').length,
        potentialContainers: {},
        sampleHTML: '',
        pageText: document.body.textContent?.substring(0, 500) || ''
      };

      // Try different container selectors - eBay specific
      const containerSelectors = [
        '.s-item',
        '.srp-results .s-item',
        '.s-item__wrapper',
        '.s-item__info',
        '.s-item__details',
        '.s-item__link',
        '.s-item__image',
        '.item',
        '.listing',
        '.product',
        '.result',
        '.tile',
        '.card',
        '[data-testid*="item"]',
        '[data-testid*="product"]',
        '[data-testid*="listing"]',
        '[data-view="mi:1686|iid:1"]',
        '.s-item__wrapper .s-item__link',
        '.s-item__wrapper .s-item__info',
        '.s-item__wrapper .s-item__details',
        '.s-item__wrapper .s-item__image',
        '.s-item__wrapper .s-item__link .s-item__title',
        '.s-item__wrapper .s-item__link .s-item__price',
        '.s-item__wrapper .s-item__link .s-item__image',
        '.s-item__wrapper .s-item__link .s-item__details',
        '.s-item__wrapper .s-item__link .s-item__info',
        '.s-item__wrapper .s-item__link .s-item__title .s-item__title-text',
        '.s-item__wrapper .s-item__link .s-item__price .s-item__price-text',
        '.s-item__wrapper .s-item__link .s-item__image .s-item__image-wrapper',
        '.s-item__wrapper .s-item__link .s-item__details .s-item__details-wrapper',
        '.s-item__wrapper .s-item__link .s-item__info .s-item__info-wrapper'
      ];

      containerSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            results.potentialContainers[selector] = {
              count: elements.length,
              firstElement: {
                tagName: elements[0]?.tagName,
                className: elements[0]?.className,
                id: elements[0]?.id,
                innerHTML: elements[0]?.innerHTML?.substring(0, 300) + '...'
              }
            };
          }
        } catch (e) {
          // Ignore errors
        }
      });

      // Get sample HTML from the page
      const body = document.body;
      if (body) {
        results.sampleHTML = body.innerHTML.substring(0, 1000) + '...';
      }

      // Check for common patterns
      const patterns = {
        hasImages: document.querySelectorAll('img').length,
        hasLinks: document.querySelectorAll('a').length,
        hasPrices: document.querySelectorAll('*').length, // Will filter in next step
        hasTitles: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length
      };

      // Look for price patterns
      const priceSelectors = ['.price', '.cost', '.amount', '.value', '.s-item__price', '.notranslate'];
      let priceElements = 0;
      priceSelectors.forEach(selector => {
        priceElements += document.querySelectorAll(selector).length;
      });
      patterns.hasPrices = priceElements;

      results.patterns = patterns;

      return results;
    });

    await browser.close();

    return res.status(200).json({
      success: true,
      site,
      searchQuery,
      debugInfo
    });

  } catch (error) {
    if (browser) {
      await browser.close();
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      site,
      searchQuery
    });
  }
}
