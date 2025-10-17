/**
 * AI-Powered HTML Scraper Service
 * Uses OpenAI to extract product information from raw HTML
 */

import { OpenAI } from 'openai';
import puppeteer, { Browser, Page } from 'puppeteer';
import { logger } from '../utils/logger';
import { Product, ScraperTarget, ScraperResult } from '../types';
import { config } from '../config';

export class AIScraperService {
  private openai: OpenAI;
  private browser: Browser | null = null;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Initialize Puppeteer browser
   */
  private async initializeBrowser(): Promise<Browser> {
    if (!this.browser) {
      logger.info('Initializing Puppeteer browser for AI scraper');
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
   * Scrape target using AI to parse HTML
   */
  async scrapeTargetWithAI(
    target: ScraperTarget,
    query: string
  ): Promise<ScraperResult> {
    const startTime = Date.now();
    let page: Page | null = null;

    try {
      const browser = await this.initializeBrowser();
      page = await browser.newPage();

      // Set user agent and viewport
      await page.setUserAgent(config.scraper.userAgent);
      await page.setViewport({ width: 1920, height: 1080 });

      // Navigate to search page
      const searchUrl = `${target.baseUrl}${target.searchPath}?q=${encodeURIComponent(query)}`;
      logger.info(`AI Scraping: ${searchUrl}`);

      await page.goto(searchUrl, {
        waitUntil: 'networkidle2',
        timeout: target.timeout,
      });

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, target.delay));

      // Load more products (handle pagination)
      await this.loadMoreProducts(page);

      // Get the HTML content
      const htmlContent = await page.content();
      logger.debug(`Retrieved HTML content: ${htmlContent.length} characters`);

      // Extract products using AI
      const products = await this.extractProductsWithAI(htmlContent, target.name, query);

      const processingTime = Date.now() - startTime;
      logger.info(`AI scrape completed for ${target.name}`, {
        productsFound: products.length,
        processingTime,
      });

      return {
        products,
        source: target.name,
        success: true,
        processingTime,
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error(`AI scrape failed for ${target.name}`, { error });
      
      return {
        products: [],
        source: target.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime,
      };
    }
  }

  /**
   * Extract products from HTML using OpenAI
   */
  private async extractProductsWithAI(
    htmlContent: string,
    siteName: string,
    query: string
  ): Promise<Product[]> {
    try {
      // Extract product-relevant HTML sections
      const relevantHTML = this.extractProductRelevantHTML(htmlContent);

      const prompt = this.createExtractionPrompt(relevantHTML, siteName, query);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-5-nano', // Using latest model for extraction
        messages: [
          {
            role: 'developer',
            content: `You are an expert web scraper that extracts product information from HTML. 
            You must return ONLY valid JSON with no additional text or formatting.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1, // Low temperature for consistent extraction
        max_tokens: 2000,
        store: true,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const parsed = JSON.parse(content);
      return parsed.products || [];

    } catch (error) {
      logger.error('AI extraction failed', { error });
      return [];
    }
  }

  /**
   * Load more products by handling pagination
   */
  private async loadMoreProducts(page: Page): Promise<void> {
    try {
      // Try to click "Load More" button multiple times
      for (let i = 0; i < 6; i++) { // Try up to 6 times to get all 42 products
        // Look for common "Load More" button patterns
        const loadMoreSelectors = [
          'button[data-testid="load-more"]',
          'button:contains("Load More")',
          'button:contains("Show More")',
          'button:contains("More")',
          '.load-more',
          '.show-more',
          '.pagination-next',
          'a[aria-label*="next"]',
          'a[aria-label*="more"]',
          '[data-testid*="load"]',
          '[data-testid*="more"]',
          'button[class*="load"]',
          'button[class*="more"]',
          'a[class*="load"]',
          'a[class*="more"]'
        ];
        
        let clicked = false;
        
        for (const selector of loadMoreSelectors) {
          try {
            const button = await page.$(selector);
            if (button) {
              const isVisible = await button.isIntersectingViewport();
              if (isVisible) {
                await button.click();
                logger.info(`Clicked load more button: ${selector}`);
                clicked = true;
                break;
              }
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        // If no button found, try clicking any element with "load more" text
        if (!clicked) {
          try {
            const loadMoreButton = await page.evaluateHandle(() => {
              const buttons = document.querySelectorAll('button, a');
              for (const button of buttons) {
                const text = button.textContent?.toLowerCase() || '';
                if (text.includes('load more') || text.includes('show more')) {
                  return button;
                }
              }
              return null;
            });
            
            if (loadMoreButton.asElement()) {
              await (loadMoreButton.asElement() as any).click();
              logger.info('Clicked load more button via text search');
              clicked = true;
            }
          } catch (e) {
            // Continue
          }
        }
        
        if (!clicked) {
          logger.info(`No more "Load More" buttons found after ${i + 1} attempts`);
          break;
        }
        
        // Wait for new products to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if we got more products
        const productCount = await page.$$eval('[class*="product"], [data-testid*="product"]', elements => elements.length);
        logger.info(`Products loaded so far: ${productCount}`);
        
        // If we have 42+ products, we're done
        if (productCount >= 42) {
          logger.info('Reached target product count (42+)');
          break;
        }
      }
      
    } catch (error) {
      logger.warn('Error during pagination handling', { error });
    }
  }

  /**
   * Extract product-relevant HTML sections from large HTML
   */
  private extractProductRelevantHTML(htmlContent: string): string {
    try {
      // Find the main content area (skip CSS, scripts, etc.)
      const bodyStart = htmlContent.indexOf('<body');
      if (bodyStart === -1) return htmlContent;

      const bodyEnd = htmlContent.indexOf('</body>');
      const bodyContent = bodyEnd !== -1 
        ? htmlContent.substring(bodyStart, bodyEnd)
        : htmlContent.substring(bodyStart);

      // Extract product-related sections
      const productSections = [];
      
      // Look for common product container patterns (expanded for F1 Authentics)
      const productPatterns = [
        /<div[^>]*class="[^"]*product[^"]*"[^>]*>.*?<\/div>/gis,
        /<article[^>]*class="[^"]*product[^"]*"[^>]*>.*?<\/article>/gis,
        /<section[^>]*class="[^"]*product[^"]*"[^>]*>.*?<\/section>/gis,
        /<div[^>]*data-testid="[^"]*product[^"]*"[^>]*>.*?<\/div>/gis,
        // F1 Authentics specific patterns
        /<div[^>]*class="[^"]*product-card[^"]*"[^>]*>.*?<\/div>/gis,
        /<div[^>]*class="[^"]*product-tile[^"]*"[^>]*>.*?<\/div>/gis,
        /<div[^>]*class="[^"]*product-item[^"]*"[^>]*>.*?<\/div>/gis,
        /<div[^>]*class="[^"]*grid-item[^"]*"[^>]*>.*?<\/div>/gis,
        /<div[^>]*class="[^"]*card[^"]*"[^>]*>.*?<\/div>/gis,
      ];

      for (const pattern of productPatterns) {
        const matches = bodyContent.match(pattern);
        if (matches) {
          productSections.push(...matches);
        }
      }

      // If we found product sections, use them
      if (productSections.length > 0) {
        return productSections.join('\n\n');
      }

      // Fallback: extract main content area (remove CSS, scripts)
      const cleanContent = bodyContent
        .replace(/<style[^>]*>.*?<\/style>/gis, '')
        .replace(/<script[^>]*>.*?<\/script>/gis, '')
        .replace(/<link[^>]*>/gi, '')
        .replace(/<meta[^>]*>/gi, '');

      // Limit to reasonable size for AI processing (increased for more products)
      const maxLength = 150000; // ~37k tokens
      return cleanContent.length > maxLength 
        ? cleanContent.substring(0, maxLength) + '...'
        : cleanContent;

    } catch (error) {
      logger.error('Error extracting product HTML', { error });
      // Fallback to original content with truncation
      const maxLength = 50000;
      return htmlContent.length > maxLength 
        ? htmlContent.substring(0, maxLength) + '...'
        : htmlContent;
    }
  }

  /**
   * Create extraction prompt for OpenAI
   */
  private createExtractionPrompt(htmlContent: string, siteName: string, query: string): string {
    return `
Extract product information from this ${siteName} HTML page. The user searched for: "${query}"

Find all products on this page and extract:
- name: Product name/title
- price: Price with currency (extract numeric value and currency)
- url: Product page URL
- imageUrl: Product image URL
- availability: "IN_STOCK", "OUT_OF_STOCK", or "LIMITED_STOCK"

HTML Content:
${htmlContent}

Return ONLY a JSON object with this exact structure:
{
  "products": [
    {
      "name": "Product Name",
      "price": {
        "amount": 99.99,
        "formattedAmount": "£99.99",
        "currency": "GBP"
      },
      "url": "https://example.com/product",
      "imageUrl": "https://example.com/image.jpg",
      "availability": "IN_STOCK"
    }
  ]
}

If no products are found, return: {"products": []}
`;
  }

  /**
   * Scrape multiple targets using AI
   */
  async scrapeMultipleTargetsWithAI(
    targets: ScraperTarget[],
    query: string
  ): Promise<ScraperResult[]> {
    logger.info(`AI scraping ${targets.length} targets`, { query });

    const results = await Promise.allSettled(
      targets.map(target => this.scrapeTargetWithAI(target, query))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        logger.error(`AI scraping failed for ${targets[index].name}`, {
          error: result.reason,
        });
        return {
          products: [],
          source: targets[index].name,
          success: false,
          error: result.reason?.message || 'Unknown error',
          processingTime: 0,
        };
      }
    });
  }
}
