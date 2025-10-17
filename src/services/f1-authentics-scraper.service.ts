/**
 * F1 Authentics Specialized Scraper
 * Uses Puppeteer to load more content and AI to process products
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { openAIService } from './openai.service';
import { logger } from '../utils/logger';
import { config } from '../config';
import { sleep, generateId, normalizePrice, sanitizeText, makeAbsoluteUrl } from '../utils/helpers';
import type { Product, ScraperTarget } from '../types';

class F1AuthenticsScraperService {
  private browser: Browser | null = null;

  /**
   * Initialize Puppeteer browser
   */
  private async initializeBrowser(): Promise<Browser> {
    if (!this.browser) {
      logger.info('Initializing Puppeteer browser for F1 Authentics');
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });
    }
    return this.browser;
  }

  /**
   * Close Puppeteer browser
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      logger.info('Closing Puppeteer browser');
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Scrape F1 Authentics with load more functionality
   */
  async scrapeF1Authentics(query: string): Promise<Product[]> {
    const startTime = Date.now();
    let page: Page | null = null;

    try {
      const browser = await this.initializeBrowser();
      page = await browser.newPage();

      // Set user agent and viewport
      await page.setUserAgent(config.scraper.userAgent);
      await page.setViewport({ width: 1920, height: 1080 });

      // Navigate to search page
      const searchUrl = `https://www.f1authentics.com/search?q=${encodeURIComponent(query)}`;
      logger.info(`Scraping F1 Authentics: ${searchUrl}`);

      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      // Wait for initial content
      await sleep(3000);

      // Click load more button multiple times to get all products
      let loadMoreAttempts = 0;
      const maxAttempts = 5;

      while (loadMoreAttempts < maxAttempts) {
        try {
          // Look for various load more button selectors
          const loadMoreSelectors = [
            'button:contains("Load More")',
            'button:contains("Show More")',
            '.load-more',
            '.show-more',
            '[data-testid="load-more"]',
            'button[class*="load"]',
            'button[class*="more"]'
          ];

          let loadMoreButton = null;
          for (const selector of loadMoreSelectors) {
            try {
              loadMoreButton = await page.$(selector);
              if (loadMoreButton) break;
            } catch (e) {
              // Try next selector
            }
          }

          if (loadMoreButton) {
            logger.debug(`Clicking load more button (attempt ${loadMoreAttempts + 1})`);
            await loadMoreButton.click();
            await sleep(3000); // Wait for content to load
            loadMoreAttempts++;
          } else {
            logger.debug('No load more button found, stopping');
            break;
          }
        } catch (e) {
          logger.debug('Error clicking load more button, stopping');
          break;
        }
      }

      // Extract essential product data directly from JSON attributes
      const essentialData = await page.evaluate(() => {
        const cards = document.querySelectorAll('product-card');
        return Array.from(cards).slice(0, 20).map(card => {
          try {
            const product = JSON.parse(card.getAttribute('product') || '{}');
            return {
              name: product.title,
              price: product.price,
              handle: product.handle,
              image: product.featured_image,
              availability: product.available || 'In Stock'
            };
          } catch (e) {
            return null;
          }
        }).filter(Boolean);
      });

      logger.info(`F1 Authentics extracted ${essentialData.length} products from JSON`);

      // Convert essential data to Product objects
      const products: Product[] = essentialData.map((raw: any) => ({
        id: generateId('f1-authentics'),
        name: sanitizeText(raw.name || ''),
        description: undefined,
        url: raw.handle ? `https://www.f1authentics.com/products/${raw.handle}` : '',
        imageUrl: raw.image ? makeAbsoluteUrl(raw.image, 'https://www.f1authentics.com') : undefined,
        price: normalizePrice(String(raw.price || '')),
        availability: this.determineAvailability(String(raw.availability || '')),
        source: 'F1 Authentics',
        scrapedAt: new Date(),
      }));

      const processingTime = Date.now() - startTime;
      logger.info(`F1 Authentics scrape completed`, {
        productsFound: products.length,
        processingTime,
      });

      return products;

    } catch (error) {
      if (page) await page.close().catch(() => {});
      logger.error(`F1 Authentics scrape failed`, error);
      throw error;
    }
  }

  /**
   * Determine availability status from text
   */
  private determineAvailability(text: string): 'IN_STOCK' | 'OUT_OF_STOCK' | 'LIMITED_STOCK' {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('out of stock') || 
        lowerText.includes('unavailable') || 
        lowerText.includes('sold out')) {
      return 'OUT_OF_STOCK';
    }
    
    if (lowerText.includes('limited') || 
        lowerText.includes('few left') || 
        lowerText.includes('low stock')) {
      return 'LIMITED_STOCK';
    }
    
    return 'IN_STOCK';
  }
}

export const f1AuthenticsScraperService = new F1AuthenticsScraperService();
