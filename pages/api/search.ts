/**
 * Search API Endpoint
 * RESTful API for F1 merchandise search
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { searchService } from '../../src/services/search.service';
import { logger } from '../../src/utils/logger';
import { validateConfig } from '../../src/config';
import type { ApiResponse, ApiRequest } from '../../src/types';

// Validate configuration on startup
try {
  validateConfig();
} catch (error) {
  logger.error('Configuration validation failed', error);
}

/**
 * Rate limiting (simple in-memory implementation)
 */
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, maxRequests: number = 20, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * CORS headers
 */
function setCorsHeaders(res: NextApiResponse): void {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); // Configure this properly in production
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Main API handler
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Set CORS headers
  setCorsHeaders(res);

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST requests are allowed',
      },
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // Get client IP
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
               req.socket.remoteAddress || 
               'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      logger.warn('Rate limit exceeded', { ip });
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Validate request body
    const { message, maxResults, sources }: ApiRequest = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Message is required and must be a non-empty string',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (message.length > 500) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MESSAGE_TOO_LONG',
          message: 'Message must be 500 characters or less',
        },
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Processing search request', { 
      message: message.substring(0, 100),
      ip,
      maxResults 
    });

    // Perform search
    const searchResults = await searchService.searchProducts(
      message.trim(),
      maxResults || 20
    );

    // Return successful response
    return res.status(200).json({
      success: true,
      data: searchResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('API error', error);

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process search request',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

