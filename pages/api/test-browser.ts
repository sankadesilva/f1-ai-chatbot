/**
 * Test browser functionality
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let browser = null;

  try {
    console.log('Testing browser launch...');
    
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

    console.log('Browser launched successfully');

    const page = await browser.newPage();
    console.log('New page created');

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    console.log('User agent set');

    await page.setViewport({ width: 1920, height: 1080 });
    console.log('Viewport set');

    // Test with a simple page
    await page.goto('https://www.google.com', { 
      waitUntil: 'domcontentloaded', 
      timeout: 10000 
    });
    console.log('Page loaded');

    const title = await page.title();
    console.log('Page title:', title);

    await page.close();
    console.log('Page closed');

    res.status(200).json({
      success: true,
      data: {
        message: 'Browser test successful',
        title: title,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Browser test failed:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('Browser closed');
      } catch (e) {
        console.error('Error closing browser:', e);
      }
    }
  }
}
