/**
 * Debug F1 Authentics Scraper
 * Test the specialized F1 Authentics scraper with load more functionality
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { f1AuthenticsScraperService } from '../../src/services/f1-authentics-scraper.service';
import { logger } from '../../src/utils/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query = 'helmet' } = req.body;

  logger.info('Testing F1 Authentics scraper', { query });

  try {
    // Test the specialized F1 Authentics scraper
    const products = await f1AuthenticsScraperService.scrapeF1Authentics(query);

    logger.info('F1 Authentics scraper test completed', {
      productsFound: products.length,
      products: products.slice(0, 3).map(p => ({
        name: p.name,
        price: p.price.formattedAmount,
        source: p.source
      }))
    });

    res.status(200).json({
      success: true,
      data: {
        query,
        productsFound: products.length,
        products: products,
        summary: `Found ${products.length} products from F1 Authentics`,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    logger.error('F1 Authentics scraper test failed', { error });
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
  } finally {
    // Close browser
    await f1AuthenticsScraperService.closeBrowser();
  }
}
