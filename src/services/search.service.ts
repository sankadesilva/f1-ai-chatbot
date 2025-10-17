/**
 * Search Service
 * Main service that coordinates search operations
 */

import { openAIService } from './openai.service';
import { scraperService } from './scraper.service';
import { logger } from '../utils/logger';
import { cache } from '../utils/cache';
import { getEnabledTargets } from '../config/scraper-targets';
import type { SearchResult, SearchIntent, Product } from '../types';

class SearchService {
  /**
   * Filter products based on search intent
   */
  private filterProductsByIntent(products: Product[], intent: SearchIntent): Product[] {
    return products.filter((product) => {
      const productText = `${product.name} ${product.description || ''} ${product.brand || ''}`.toLowerCase();

      // Filter by team
      if (intent.team && !productText.includes(intent.team.toLowerCase())) {
        return false;
      }

      // Filter by driver
      if (intent.driver && !productText.includes(intent.driver.toLowerCase())) {
        return false;
      }

      // Filter by item type
      if (intent.item && !productText.includes(intent.item.toLowerCase())) {
        return false;
      }

      // Filter by budget
      if (intent.budget && product.price.amount > intent.budget) {
        return false;
      }

      return true;
    });
  }

  /**
   * Remove duplicate products
   */
  private removeDuplicates(products: Product[]): Product[] {
    const seen = new Set<string>();
    return products.filter((product) => {
      // Create a key from normalized product name
      const key = product.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (seen.has(key)) {
        return false;
      }
      
      seen.add(key);
      return true;
    });
  }

  /**
   * Sort products by relevance
   */
  private sortByRelevance(products: Product[], query: string): Product[] {
    const queryWords = query.toLowerCase().split(' ');

    return products.sort((a, b) => {
      const aScore = this.calculateRelevanceScore(a, queryWords);
      const bScore = this.calculateRelevanceScore(b, queryWords);
      return bScore - aScore;
    });
  }

  /**
   * Calculate relevance score for a product
   */
  private calculateRelevanceScore(product: Product, queryWords: string[]): number {
    let score = 0;
    const productText = `${product.name} ${product.description || ''} ${product.brand || ''}`.toLowerCase();
    const productName = product.name.toLowerCase();

    queryWords.forEach((word) => {
      if (word.length < 2) return; // Skip very short words

      // Exact match in name (highest weight)
      if (productName.includes(word)) {
        score += 3;
      }

      // Match in full product text
      if (productText.includes(word)) {
        score += 1;
      }
    });

    // Bonus for in-stock items
    if (product.availability === 'IN_STOCK') {
      score += 0.5;
    }

    return score;
  }

  /**
   * Main search method
   */
  async searchProducts(
    userQuery: string,
    maxResults: number = 20
  ): Promise<SearchResult> {
    const startTime = Date.now();
    logger.info('Starting product search', { userQuery, maxResults });

    try {
      // Check cache first
      const cacheKey = `search:${userQuery.toLowerCase()}:${maxResults}`;
      const cached = cache.get<SearchResult>(cacheKey);
      if (cached) {
        logger.info('Returning cached search results');
        return cached;
      }

      // Step 1: Extract search intent using OpenAI
      let intent: SearchIntent;
      let searchQuery: string;
      
      try {
        intent = await openAIService.extractIntent(userQuery);
        searchQuery = openAIService.buildSearchQuery(intent);
        logger.info('Intent extracted successfully', { intent, searchQuery });
      } catch (error) {
        logger.warn('Intent extraction failed, using original query', { error: error instanceof Error ? error.message : 'Unknown error' });
        // Fallback: use original query as search term
        intent = {
          item: userQuery.toLowerCase(),
          team: undefined,
          driver: undefined,
          budget: undefined,
          category: 'general'
        };
        searchQuery = userQuery;
      }
      
      // Step 3: Get scraper targets
      const targets = getEnabledTargets();
      logger.info(`Using ${targets.length} scraper targets`);

      // Step 4: Scrape all targets in parallel
      const scraperResults = await scraperService.scrapeMultipleTargets(targets, searchQuery);

      // Step 5: Collect all products
      const allProducts: Product[] = [];
      const successfulSources: string[] = [];

      scraperResults.forEach((result) => {
        if (result.success && result.products.length > 0) {
          allProducts.push(...result.products);
          successfulSources.push(result.source);
        }
      });

      logger.info(`Collected ${allProducts.length} products from ${successfulSources.length} sources`);

      // Step 6: Filter by intent
      const filteredProducts = this.filterProductsByIntent(allProducts, intent);
      
      // Step 7: Remove duplicates
      const uniqueProducts = this.removeDuplicates(filteredProducts);
      
      // Step 8: Sort by relevance
      const sortedProducts = this.sortByRelevance(uniqueProducts, searchQuery);
      
      // Step 9: Limit results
      const finalProducts = sortedProducts.slice(0, maxResults);

      // Step 10: Generate AI response
      const summary = await openAIService.generateResponse(
        userQuery,
        finalProducts,
        intent,
        successfulSources
      );

      const processingTime = Date.now() - startTime;

      const result: SearchResult = {
        products: finalProducts,
        searchQuery,
        intent,
        summary,
        sources: successfulSources,
        totalFound: sortedProducts.length,
        processingTime,
      };

      // Cache the result
      cache.set(cacheKey, result);

      logger.info('Search completed successfully', {
        productsReturned: finalProducts.length,
        totalFound: sortedProducts.length,
        sources: successfulSources.length,
        processingTime,
      });

      return result;
    } catch (error) {
      logger.error('Search failed', error);
      throw error;
    } finally {
      // Cleanup browser resources
      await scraperService.closeBrowser();
    }
  }

  /**
   * Get search suggestions (for autocomplete)
   */
  async getSearchSuggestions(partial: string): Promise<string[]> {
    const suggestions = [
      'Red Bull Racing hoodie',
      'Ferrari cap',
      'Mercedes jacket',
      'McLaren t-shirt',
      'Max Verstappen merchandise',
      'Lewis Hamilton gear',
      'F1 model cars',
      'F1 flags',
      'Team polo shirts',
      'Racing jackets',
    ];

    return suggestions
      .filter((s) => s.toLowerCase().includes(partial.toLowerCase()))
      .slice(0, 5);
  }
}

export const searchService = new SearchService();

