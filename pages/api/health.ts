/**
 * Health Check API Endpoint
 * Simple endpoint to verify the API is running
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { cache } from '../../src/utils/cache';

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  cache: {
    size: number;
    enabled: boolean;
  };
  environment: string;
}

const startTime = Date.now();

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  const stats = cache.getStats();

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Date.now() - startTime,
    cache: {
      size: stats.size,
      enabled: stats.enabled,
    },
    environment: process.env.NODE_ENV || 'development',
  });
}

