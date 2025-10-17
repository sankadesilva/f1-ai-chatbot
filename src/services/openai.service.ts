/**
 * OpenAI Service
 * Handles all OpenAI API interactions for intent extraction and response generation
 */

import OpenAI from 'openai';
import { config } from '../config';
import { logger } from '../utils/logger';
import type { SearchIntent, Product, IntentExtractionPrompt, ResponseGenerationPrompt } from '../types';

class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  /**
   * Extract search intent from user query
   */
  async extractIntent(userQuery: string): Promise<SearchIntent> {
    try {
      logger.info('Extracting search intent', { userQuery });

        const response = await this.client.chat.completions.create({
          model: config.openai.model,
          messages: [
            {
              role: 'developer',
              content: `You are an AI assistant specialized in understanding F1 merchandise search queries.
Extract search intent and return ONLY valid JSON with this exact structure:
{
  "item": "product type (e.g., hoodie, cap, t-shirt, jacket, model, flag)",
  "team": "F1 team name (e.g., Red Bull, Ferrari, Mercedes, McLaren, Aston Martin, Alpine, Williams, etc.)",
  "driver": "driver name (e.g., Verstappen, Hamilton, Leclerc, Russell, Alonso, Norris, etc.)",
  "budget": number (maximum price in dollars, only if mentioned),
  "category": "category (e.g., clothing, accessories, collectibles, models)"
}

Only include fields that are clearly mentioned or can be confidently inferred. Use null for missing fields.
Return ONLY the JSON object, no additional text.`,
            },
            {
              role: 'user',
              content: userQuery,
            },
          ],
          temperature: 0.3,
          max_completion_tokens: 200,
          store: true,
        });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        logger.warn('Empty response from OpenAI');
        return {};
      }

      try {
        const intent = JSON.parse(content);
        logger.info('Intent extracted successfully', { intent });
        return intent;
      } catch (parseError) {
        logger.error('Failed to parse intent JSON', parseError, { content });
        return {};
      }
    } catch (error) {
      logger.error('Error extracting intent from OpenAI', error);
      return {};
    }
  }

  /**
   * Generate friendly response summary
   */
  async generateResponse(
    userQuery: string,
    products: Product[],
    intent: SearchIntent,
    sources: string[]
  ): Promise<string> {
    try {
      logger.info('Generating AI response', { 
        userQuery, 
        productCount: products.length,
        sources 
      });

      const productInfo = products
        .slice(0, 3)
        .map((p) => `${p.name} - ${p.price.formattedAmount} (${p.source})`)
        .join(', ');

      const response = await this.client.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'developer',
            content: `You are a helpful and enthusiastic F1 merchandise shopping assistant.
Generate a friendly, conversational response that:
1. Acknowledges the user's request
2. Mentions the number of products found
3. Highlights key products (if any)
4. Mentions the sources searched
5. Offers to help with more specific searches if needed
6. Keeps the response under 100 words
7. Uses an enthusiastic, helpful tone

Be natural and conversational, like a real shopping assistant would be.`,
          },
          {
            role: 'user',
            content: `User asked: "${userQuery}"
Found ${products.length} products
Top products: ${productInfo || 'None'}
Sources searched: ${sources.join(', ')}
User intent: ${JSON.stringify(intent)}`,
          },
        ],
        temperature: config.openai.temperature,
        max_completion_tokens: config.openai.maxTokens,
        store: true,
      });

      const summary = response.choices[0]?.message?.content || 
        `I found ${products.length} F1 merchandise items${sources.length > 0 ? ` from ${sources.join(', ')}` : ''} for you!`;

      logger.info('Response generated successfully');
      return summary;
    } catch (error) {
      logger.error('Error generating response from OpenAI', error);
      return `I found ${products.length} F1 merchandise items for you!`;
    }
  }

  /**
   * Generate general conversational response (not product-related)
   */
  async generateGeneralResponse(userQuery: string): Promise<string> {
    try {
      logger.info('Generating general AI response', { userQuery });

      const response = await this.client.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'developer',
            content: `You are a friendly and enthusiastic F1 merchandise shopping assistant. 
You help people find F1 merchandise, answer questions about Formula 1, and provide shopping advice.

Guidelines:
- Be conversational, friendly, and enthusiastic about F1
- If they're asking about F1 merchandise, guide them to ask for specific items
- If they're just chatting, respond naturally and ask if they need help with F1 shopping
- Keep responses under 100 words
- Keep responses professional and helpful
- Always offer to help with F1 merchandise searches

Examples of good responses:
- "Hi there! I'm your F1 merchandise assistant! Are you looking for any specific F1 gear today?"
- "That's awesome! I love F1 too! Need help finding any merchandise?"
- "Great question! I can help you find F1 merchandise. What are you looking for?`
          },
          {
            role: 'user',
            content: userQuery,
          },
        ],
        temperature: 0.7,
        max_completion_tokens: 150,
        store: true,
      });

      const summary = response.choices[0]?.message?.content || 
        "Hi there! I'm your F1 merchandise assistant! How can I help you find some awesome F1 gear today?";

      logger.info('General response generated successfully');
      return summary;
    } catch (error) {
      logger.error('Error generating general response from OpenAI', error);
      return "Hi there! I'm your F1 merchandise assistant! How can I help you find some awesome F1 gear today?";
    }
  }

  /**
   * Extract products from HTML using AI
   */
  async extractProductsFromHTML(htmlContent: string, query: string): Promise<string> {
    try {
      const prompt = `Extract F1 merchandise products from this HTML content. Look for:
- Product names (helmets, models, collectibles, etc.)
- Prices (in any currency)
- Product URLs/links
- Image URLs
- Availability status

Return ONLY a JSON array of products in this exact format:
[
  {
    "name": "Product Name",
    "price": "Price text (e.g., $29.99, €49.95)",
    "url": "https://...",
    "imageUrl": "https://...",
    "availability": "In Stock" or "Out of Stock"
  }
]

HTML Content:
${htmlContent.substring(0, 12000)}`;

      const response = await this.client.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'developer',
            content: 'You are an expert at extracting product information from HTML. Return ONLY valid JSON array, no other text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_completion_tokens: 2000,
        store: true,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      logger.error('Error extracting products from HTML', error);
      return '';
    }
  }

  /**
   * Build search query from intent
   */
  buildSearchQuery(intent: SearchIntent): string {
    const terms: string[] = ['Formula 1', 'F1'];

    if (intent.team) terms.push(intent.team);
    if (intent.driver) terms.push(intent.driver);
    if (intent.item) terms.push(intent.item);
    if (intent.category) terms.push(intent.category);

    const query = terms.join(' ');
    logger.debug('Built search query', { intent, query });
    return query;
  }
}

export const openAIService = new OpenAIService();

