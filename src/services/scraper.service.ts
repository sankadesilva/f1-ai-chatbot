/**
 * Web Scraper Service
 * Handles web scraping from multiple F1 merchandise websites
 */

import puppeteer, { Browser, Page } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { sleep, generateId, normalizePrice, sanitizeText, makeAbsoluteUrl, retryWithBackoff } from '../utils/helpers';
import { f1AuthenticsScraperService } from './f1-authentics-scraper.service';
import type { Product, ScraperTarget, ScraperResult, AvailabilityStatus } from '../types';

class ScraperService {
  private browser: Browser | null = null;

  /**
   * Initialize Puppeteer browser
   */
  private async initializeBrowser(): Promise<Browser> {
    if (!this.browser) {
      logger.info('Initializing Puppeteer browser');
      const executablePath = process.env.NODE_ENV === 'production' 
        ? await chromium.executablePath()
        : undefined;

      this.browser = await puppeteer.launch({
        headless: true,
        executablePath,
        args: [
          ...chromium.args,
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
   * Determine availability status from text
   */
  private determineAvailability(text: string): AvailabilityStatus {
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

  /**
   * Scrape using Puppeteer (for JavaScript-heavy sites)
   */
  private async scrapeWithPuppeteer(
    target: ScraperTarget,
    query: string
  ): Promise<Product[]> {
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
      logger.debug(`Scraping with Puppeteer: ${searchUrl}`);

      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: target.timeout,
      });

      // Wait for delay
      await sleep(target.delay);
      
      // Wait for product elements to load
      try {
        await page.waitForSelector(target.selectors.productContainer, { 
          timeout: 10000 
        });
        logger.debug(`Product elements found for ${target.name}`);
      } catch (e) {
        logger.debug(`No product elements found for ${target.name}, continuing anyway...`);
      }

      // Special handling for F1 Authentics - click load more button
      if (target.id === 'f1-authentics') {
        try {
          // Look for load more button and click it multiple times
          for (let i = 0; i < 3; i++) {
            const loadMoreButton = await page.$('button:contains("Load More"), .load-more, .show-more, [data-testid="load-more"]');
            if (loadMoreButton) {
              logger.debug(`Clicking load more button (attempt ${i + 1})`);
              await loadMoreButton.click();
              await sleep(2000); // Wait for content to load
            } else {
              break;
            }
          }
        } catch (e) {
          logger.debug('No load more button found or error clicking it');
        }
      }

      // Extract products
      const products = await page.evaluate((selectors) => {
        const elements = document.querySelectorAll(selectors.productContainer);
        const results: any[] = [];

        elements.forEach((element) => {
          try {
            const nameEl = element.querySelector(selectors.name);
            const priceEl = element.querySelector(selectors.price);
            const imageEl = element.querySelector(selectors.image) as HTMLImageElement;
            const linkEl = element.querySelector(selectors.link) as HTMLAnchorElement;
            const availabilityEl = selectors.availability 
              ? element.querySelector(selectors.availability)
              : null;
            const descEl = selectors.description
              ? element.querySelector(selectors.description)
              : null;

            if (nameEl && priceEl) {
              results.push({
                name: nameEl.textContent?.trim() || '',
                price: priceEl.textContent?.trim() || '',
                imageUrl: imageEl?.src || imageEl?.dataset?.src || '',
                url: linkEl?.href || '',
                availability: availabilityEl?.textContent?.trim() || 'In Stock',
                description: descEl?.textContent?.trim() || '',
              });
            }
          } catch (error) {
            console.error('Error parsing product element:', error);
          }
        });

        return results;
      }, target.selectors);

      await page.close();

      // Transform to Product objects
      const transformedProducts = products.map((raw) => this.transformRawProduct(raw, target));
      
      const processingTime = Date.now() - startTime;
      logger.info(`Puppeteer scrape completed for ${target.name}`, {
        productsFound: transformedProducts.length,
        processingTime,
      });

      return transformedProducts;
    } catch (error) {
      if (page) await page.close().catch(() => {});
      logger.error(`Puppeteer scrape failed for ${target.name}`, error);
      throw error;
    }
  }

  /**
   * Scrape using Cheerio (for static HTML sites)
   */
  private async scrapeWithCheerio(
    target: ScraperTarget,
    query: string
  ): Promise<Product[]> {
    const startTime = Date.now();

    try {
      const searchUrl = `${target.baseUrl}${target.searchPath}?q=${encodeURIComponent(query)}`;
      logger.debug(`Scraping with Cheerio: ${searchUrl}`);

      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': config.scraper.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: target.timeout,
      });

      const $ = cheerio.load(response.data);
      const products: Product[] = [];

      $(target.selectors.productContainer).each((index, element) => {
        try {
          const $el = $(element);
          const name = $el.find(target.selectors.name).first().text().trim();
          const priceText = $el.find(target.selectors.price).first().text().trim();
          const imageUrl = $el.find(target.selectors.image).first().attr('src') ||
                          $el.find(target.selectors.image).first().attr('data-src') || '';
          const url = $el.find(target.selectors.link).first().attr('href') || '';
          const availabilityText = target.selectors.availability
            ? $el.find(target.selectors.availability).first().text().trim()
            : 'In Stock';
          const description = target.selectors.description
            ? $el.find(target.selectors.description).first().text().trim()
            : '';

          if (name && priceText) {
            const rawProduct = {
              name,
              price: priceText,
              imageUrl,
              url,
              availability: availabilityText,
              description,
            };
            products.push(this.transformRawProduct(rawProduct, target));
          }
        } catch (error) {
          logger.error('Error parsing product element', error);
        }
      });

      const processingTime = Date.now() - startTime;
      logger.info(`Cheerio scrape completed for ${target.name}`, {
        productsFound: products.length,
        processingTime,
      });

      return products.slice(0, 10); // Limit to 10 products per target
    } catch (error) {
      logger.error(`Cheerio scrape failed for ${target.name}`, error);
      throw error;
    }
  }

  /**
   * Transform raw product data to Product type
   */
  private transformRawProduct(raw: any, target: ScraperTarget): Product {
    return {
      id: generateId(target.id),
      name: sanitizeText(raw.name),
      description: raw.description ? sanitizeText(raw.description) : undefined,
      url: makeAbsoluteUrl(raw.url, target.baseUrl),
      imageUrl: raw.imageUrl ? makeAbsoluteUrl(raw.imageUrl, target.baseUrl) : undefined,
      price: normalizePrice(raw.price),
      availability: this.determineAvailability(raw.availability),
      source: target.name,
      scrapedAt: new Date(),
    };
  }

  /**
   * Scrape a single target with retry logic
   */
  async scrapeTarget(target: ScraperTarget, query: string): Promise<ScraperResult> {
    const startTime = Date.now();

    try {
      const searchUrl = `${target.baseUrl}${target.searchPath}${encodeURIComponent(query)}`;
      logger.info(`Starting scrape for ${target.name}`, { 
        query, 
        searchUrl: searchUrl,
        targetId: target.id 
      });

      let products: Product[];

      // Special handling for F1 Authentics
      if (target.id === 'f1-authentics') {
        products = await retryWithBackoff(
          async () => {
            return await f1AuthenticsScraperService.scrapeF1Authentics(query);
          },
          config.scraper.maxRetries,
          config.scraper.retryDelay
        );
      } else {
        products = await retryWithBackoff(
          async () => {
            if (target.requiresJavaScript) {
              return await this.scrapeWithPuppeteer(target, query);
            } else {
              return await this.scrapeWithCheerio(target, query);
            }
          },
          config.scraper.maxRetries,
          config.scraper.retryDelay
        );
      }

      const processingTime = Date.now() - startTime;

      return {
        products,
        source: target.name,
        success: true,
        processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error(`Scrape failed for ${target.name}`, error);

      return {
        products: [],
        source: target.name,
        success: false,
        error: errorMessage,
        processingTime,
      };
    }
  }

  /**
   * Scrape multiple targets in parallel
   */
  async scrapeMultipleTargets(
    targets: ScraperTarget[],
    query: string
  ): Promise<ScraperResult[]> {
    logger.info(`Scraping ${targets.length} targets`, { query });

    const promises = targets.map((target) => this.scrapeTarget(target, query));
    const results = await Promise.allSettled(promises);

    const scraperResults: ScraperResult[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          products: [],
          source: targets[index].name,
          success: false,
          error: result.reason?.message || 'Promise rejected',
          processingTime: 0,
        };
      }
    });

    const successCount = scraperResults.filter((r) => r.success).length;
    logger.info(`Scraping completed: ${successCount}/${targets.length} successful`);

    return scraperResults;
  }
}

export const scraperService = new ScraperService();

