/**
 * Type Definitions
 * Centralized type definitions for the application
 */

// ============================================================================
// Product Types
// ============================================================================

export interface Product {
  id: string;
  name: string;
  description?: string;
  url: string;
  imageUrl?: string;
  price: Price;
  brand?: string;
  category?: string;
  availability: AvailabilityStatus;
  source: string;
  scrapedAt: Date;
}

export interface Price {
  amount: number;
  formattedAmount: string;
  currency: Currency;
}

export type Currency = 'USD' | 'EUR' | 'GBP';
export type AvailabilityStatus = 'IN_STOCK' | 'OUT_OF_STOCK' | 'LIMITED_STOCK';

// ============================================================================
// Search Types
// ============================================================================

export interface SearchIntent {
  item?: string;
  team?: string;
  driver?: string;
  budget?: number;
  category?: string;
}

export interface SearchResult {
  products: Product[];
  searchQuery: string;
  intent: SearchIntent;
  summary: string;
  sources: string[];
  totalFound: number;
  processingTime: number;
}

// ============================================================================
// Scraper Types
// ============================================================================

export interface ScraperTarget {
  id: string;
  name: string;
  baseUrl: string;
  searchPath: string;
  enabled: boolean;
  priority: number;
  delay: number;
  selectors: ScraperSelectors;
  requiresJavaScript: boolean;
  timeout: number;
}

export interface ScraperSelectors {
  productContainer: string;
  name: string;
  price: string;
  image: string;
  link: string;
  availability?: string;
  description?: string;
  loadMoreButton?: string;
}

export interface ScraperResult {
  products: Product[];
  source: string;
  success: boolean;
  error?: string;
  processingTime: number;
}

// ============================================================================
// API Types
// ============================================================================

export interface ApiRequest {
  message: string;
  maxResults?: number;
  sources?: string[];
}

export interface ApiResponse {
  success: boolean;
  data?: SearchResult;
  error?: ApiError;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// ============================================================================
// OpenAI Types
// ============================================================================

export interface IntentExtractionPrompt {
  userQuery: string;
}

export interface ResponseGenerationPrompt {
  userQuery: string;
  products: Product[];
  intent: SearchIntent;
  sources: string[];
}

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// ============================================================================
// Logging Types
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

