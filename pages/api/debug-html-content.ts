/**
 * Debug API to see what HTML content is being captured
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import puppeteer, { Browser, Page } from 'puppeteer';
import { getTargetById } from '../../src/config/scraper-targets';
import { logger } from '../../src/utils/logger';
import { config } from '../../src/config';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { targetId, query } = req.body;

  if (!targetId || !query) {
    return res.status(400).json({ 
      error: 'Missing required fields: targetId, query' 
    });
  }

  logger.info('Debugging HTML content', { targetId, query });

  const target = getTargetById(targetId);
  if (!target) {
    return res.status(404).json({ 
      error: `Target ${targetId} not found` 
    });
  }

  let browser: Browser | null = null;

  try {
    browser = await puppeteer.launch({
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

    const page = await browser.newPage();
    await page.setUserAgent(config.scraper.userAgent);
    await page.setViewport({ width: 1920, height: 1080 });

    const searchUrl = `${target.baseUrl}${target.searchPath}?q=${encodeURIComponent(query)}`;
    logger.info(`Debugging: ${searchUrl}`);

    await page.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: target.timeout,
    });

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, target.delay));

    // Get page info
    const title = await page.title();
    const url = page.url();
    
    // Get HTML content
    const htmlContent = await page.content();
    
    // Check for common product indicators
    const productIndicators = {
      hasProductElements: htmlContent.includes('product'),
      hasPriceElements: htmlContent.includes('price') || htmlContent.includes('£') || htmlContent.includes('€'),
      hasImages: htmlContent.includes('<img'),
      hasLinks: htmlContent.includes('<a href'),
      htmlLength: htmlContent.length,
      title,
      finalUrl: url,
    };

    // Try to find any product-related content
    const productSnippets = [];
    const lines = htmlContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.toLowerCase().includes('helmet') || 
          line.toLowerCase().includes('product') ||
          line.toLowerCase().includes('price')) {
        productSnippets.push({
          lineNumber: i + 1,
          content: line.trim().substring(0, 200)
        });
      }
      if (productSnippets.length >= 10) break; // Limit to 10 snippets
    }

    logger.info('HTML debug completed', {
      target: target.name,
      htmlLength: htmlContent.length,
      productIndicators,
      snippetCount: productSnippets.length,
    });

    res.status(200).json({
      success: true,
      data: {
        target: {
          id: target.id,
          name: target.name,
          url: searchUrl,
        },
        query,
        pageInfo: {
          title,
          finalUrl: url,
        },
        htmlAnalysis: {
          contentLength: htmlContent.length,
          productIndicators,
          productSnippets,
        },
        // Include first 2000 chars of HTML for inspection
        htmlPreview: htmlContent.substring(0, 2000),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('HTML debug failed', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
