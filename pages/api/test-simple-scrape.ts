/**
 * Simple test for scraping functionality
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getEnabledTargets } from '../../src/config/scraper-targets';
import { scraperService } from '../../src/services/scraper.service';
import { logger } from '../../src/utils/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query = 'f1 helmet' } = req.body;

  logger.info('Testing simple scrape', { query });

  try {
    // Get enabled targets
    const enabledTargets = getEnabledTargets();
    logger.info(`Found ${enabledTargets.length} enabled targets`);

    // Test each target individually
    const results = [];
    
    for (const target of enabledTargets) {
      logger.info(`Testing ${target.name}...`);
      
      try {
        const result = await scraperService.scrapeTarget(target, query);
        results.push({
          target: target.name,
          success: result.success,
          productCount: result.products.length,
          error: result.error,
          processingTime: result.processingTime
        });
        
        logger.info(`${target.name} result:`, {
          success: result.success,
          productCount: result.products.length,
          error: result.error
        });
      } catch (error) {
        logger.error(`Error testing ${target.name}:`, error);
        results.push({
          target: target.name,
          success: false,
          productCount: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime: 0
        });
      }
    }

    // Close browser
    await scraperService.closeBrowser();

    res.status(200).json({
      success: true,
      data: {
        query,
        results,
        summary: {
          totalTargets: enabledTargets.length,
          successfulTargets: results.filter(r => r.success).length,
          totalProducts: results.reduce((sum, r) => sum + r.productCount, 0)
        }
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Simple scrape test failed', { error });
    
    // Ensure browser is closed
    await scraperService.closeBrowser();
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
