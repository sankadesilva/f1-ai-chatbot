/**
 * Helper Utilities
 * Common utility functions used across the application
 */

import type { Currency, Price } from '../types';

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate unique ID
 */
export function generateId(prefix: string = 'id'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Normalize price string to structured price object
 */
export function normalizePrice(priceText: string): Price {
  // Remove whitespace and common text
  const cleanText = priceText.replace(/\s+/g, '').toLowerCase();
  
  // Try to extract currency and amount
  const patterns = [
    /\$(\d+\.?\d*)/,      // $45.00
    /€(\d+\.?\d*)/,       // €45.00
    /£(\d+\.?\d*)/,       // £45.00
    /(\d+\.?\d*)\s*usd/i, // 45.00 USD
    /(\d+\.?\d*)\s*eur/i, // 45.00 EUR
    /(\d+\.?\d*)\s*gbp/i, // 45.00 GBP
  ];

  let amount = 0;
  let currency: Currency = 'USD';

  for (const pattern of patterns) {
    const match = cleanText.match(pattern);
    if (match) {
      amount = parseFloat(match[1]);
      
      // Determine currency
      if (cleanText.includes('€') || cleanText.includes('eur')) {
        currency = 'EUR';
      } else if (cleanText.includes('£') || cleanText.includes('gbp')) {
        currency = 'GBP';
      } else {
        currency = 'USD';
      }
      break;
    }
  }

  const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
  };

  return {
    amount,
    formattedAmount: amount > 0 ? `${currencySymbols[currency]}${amount.toFixed(2)}` : 'Price not available',
    currency,
  };
}

/**
 * Sanitize and normalize text
 */
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s$€£.,!?-]/g, '');
}

/**
 * Calculate string similarity (0-1)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Levenshtein distance calculation
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Chunk array into smaller arrays
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Retry async function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Make URL absolute
 */
export function makeAbsoluteUrl(url: string, baseUrl: string): string {
  if (isValidUrl(url)) {
    return url;
  }
  
  try {
    const base = new URL(baseUrl);
    return new URL(url, base.origin).href;
  } catch {
    return url;
  }
}

