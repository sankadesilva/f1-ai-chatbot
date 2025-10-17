/**
 * Application Configuration
 * Centralized configuration management with environment variable validation
 */

export const config = {
  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-5-nano',
    maxTokens: 500,
  },

  // Application Settings
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.API_PORT || '3000', 10),
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '20', 10),
  },

  // Web Scraper Configuration
  scraper: {
    timeout: parseInt(process.env.SCRAPER_TIMEOUT_MS || '10000', 10),
    maxConcurrent: parseInt(process.env.SCRAPER_MAX_CONCURRENT || '5', 10),
    delayBetweenRequests: parseInt(process.env.SCRAPER_DELAY_MS || '1000', 10),
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    maxRetries: 3,
    retryDelay: 2000,
  },

  // Cache Configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL_SECONDS || '300', 10),
    enabled: process.env.NODE_ENV === 'production',
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    pretty: process.env.NODE_ENV === 'development',
  },

  // CORS Configuration
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
} as const;

/**
 * Validate required environment variables
 */
export function validateConfig(): void {
  const required = ['OPENAI_API_KEY'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file or environment configuration.'
    );
  }
}

/**
 * Get configuration value safely
 */
export function getConfig<T extends keyof typeof config>(key: T): typeof config[T] {
  return config[key];
}

