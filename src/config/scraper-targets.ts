/**
 * Scraper Target Configurations
 * Defines all F1 merchandise websites to scrape
 */

import type { ScraperTarget } from '../types';

export const SCRAPER_TARGETS: ScraperTarget[] = [
  {
    id: 'f1-authentics',
    name: 'F1 Authentics',
    baseUrl: 'https://www.f1authentics.com',
    searchPath: '/search',
    enabled: false, // Temporarily disabled due to Vercel Puppeteer issues
    priority: 10,
    delay: 2000,
    requiresJavaScript: true, // Back to Puppeteer for load more functionality
    timeout: 60000,
    selectors: {
      productContainer: '.product-tile, .product-item, .product-card, .product, .grid-item, [data-testid="product"]',
      name: 'h3, h4, .product-name, .product-title, .title, h2, a, .product-tile a',
      price: '.price, .product-price, .price-current, .money, span, .product-tile span',
      image: 'img',
      link: 'a',
      availability: '.availability, .stock-status, .in-stock, .out-of-stock',
      description: '.product-description, .description',
      loadMoreButton: '.load-more, .show-more, [data-testid="load-more"], button:contains("Load More"), button:contains("Show More")',
    },
  },
  {
    id: 'redbull-shop',
    name: 'Red Bull Shop',
    baseUrl: 'https://www.redbullshop.com',
    searchPath: '/en-int/search/',
    enabled: false, // Temporarily disabled due to Vercel Puppeteer issues
    priority: 9,
    delay: 1500,
    requiresJavaScript: true,
    timeout: 20000,
    selectors: {
      productContainer: '.product-tile', // Found 24 products with this selector!
      name: 'h3, .product-name, a, .title',
      price: '.price, .product-price, span',
      image: 'img',
      link: 'a',
      description: '.product-description',
    },
  },
  {
    id: 'ebay',
    name: 'eBay',
    baseUrl: 'https://www.ebay.com',
    searchPath: '/sch/i.html',
    enabled: true,
    priority: 8,
    delay: 2000,
    requiresJavaScript: false, // Try static scraping first
    timeout: 30000,
    selectors: {
      productContainer: '.s-item, .item, .product-item, .listing-item',
      name: '.s-item__title, h3, .item-title, .product-title',
      price: '.s-item__price, .price, .item-price, .product-price',
      image: 'img',
      link: 'a',
      availability: '.s-item__availability, .availability, .stock-status',
      description: '.s-item__subtitle, .item-description, .product-description',
    },
  },
  // Disabled targets - not working properly
  {
    id: 'f1-official-store',
    name: 'F1 Official Store',
    baseUrl: 'https://f1store.formula1.com',
    searchPath: '/en/',
    enabled: false, // Disabled - blocking scrapers
    priority: 0,
    delay: 1500,
    requiresJavaScript: true,
    timeout: 20000,
    selectors: {
      productContainer: '[data-testid="product-tile"], .product-item, .product-card, .product, .grid-tile',
      name: 'h3, .product-name, .product-title, [data-testid="product-name"], h2, .pdp-link',
      price: '.price, .product-price, [data-testid="price"], .price-sales, .sales',
      image: 'img',
      link: 'a',
      availability: '.availability, .stock-status, [data-testid="availability"]',
      description: '.product-description, [data-testid="description"]',
    },
  },
  {
    id: 'fanatics',
    name: 'Fanatics',
    baseUrl: 'https://www.fanatics.com',
    searchPath: '/',
    enabled: false, // Disabled - blocking scrapers
    priority: 0,
    delay: 2000,
    requiresJavaScript: true,
    timeout: 20000,
    selectors: {
      productContainer: '.product-item, .product-card, .search-result-item, [data-testid="product"]',
      name: '.product-name, h3, .product-title, .item-name, h2',
      price: '.price, .product-price, .price-current, .item-price',
      image: 'img',
      link: 'a',
    },
  },
  {
    id: 'depop',
    name: 'Depop',
    baseUrl: 'https://www.depop.com',
    searchPath: '/search',
    enabled: false, // Disabled - not working properly
    priority: 0,
    delay: 2000,
    requiresJavaScript: true,
    timeout: 80000,
    selectors: {
      productContainer: '[data-testid="product-tile"], .product-tile, .product-item, .product-card, .item, .product, .listing',
      name: 'h3, h4, .product-name, .product-title, .title, h2, a, [data-testid="product-name"], .listing-title',
      price: '.price, .product-price, .price-current, .money, .cost, span, .listing-price',
      image: 'img',
      link: 'a',
      availability: '.availability, .stock-status, .sold, .available',
      description: '.product-description, .description, .item-description',
    },
  },
];

/**
 * Get enabled scraper targets sorted by priority
 */
export function getEnabledTargets(): ScraperTarget[] {
  return SCRAPER_TARGETS
    .filter((target) => target.enabled)
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Get scraper target by ID
 */
export function getTargetById(id: string): ScraperTarget | undefined {
  return SCRAPER_TARGETS.find((target) => target.id === id);
}

/**
 * Get targets by priority level
 */
export function getTargetsByPriority(minPriority: number): ScraperTarget[] {
  return SCRAPER_TARGETS
    .filter((target) => target.enabled && target.priority >= minPriority)
    .sort((a, b) => b.priority - a.priority);
}

