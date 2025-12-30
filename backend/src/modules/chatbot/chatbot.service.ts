import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { CartService } from '../cart/cart.service';
import { WishlistService } from '../wishlist/wishlist.service';
import { CouponsService } from '../coupons/coupons.service';
import { UsersService } from '../users/users.service';
import { CouponStatus } from '../coupons/schemas/coupon.schema';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private genAI: GoogleGenerativeAI;

  // Multi-Model Configuration
  // Updated 2025-12-16: Includes Gemini 2.0, Experimental, and Gemma 3 variants
  private readonly models = [
    'gemini-2.0-flash-exp', // Experimental (Often has separate quota)
    'gemini-exp-1206', // Experimental (High Capability)
    'gemini-2.0-flash', // Primary: Fast & High Quality
    'gemini-2.5-flash-lite-preview-09-2025', // User's original
    'gemma-3-1b-it', // Gemma 3 (Verified Working!)
    'gemma-3-4b-it', // Gemma 3 (Likely Working)
    'gemma-3-27b-it', // Gemma 3 (High capability)
    'gemini-flash-latest', // Stable Fallback
    'gemini-pro-latest', // Reasoning Fallback
  ];

  // Simple In-Memory Cache: Map<UserQueryKey, {response: string, timestamp: number}>
  private cache = new Map<string, { response: string; timestamp: number }>();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 Minutes

  constructor(
    private configService: ConfigService,
    private ordersService: OrdersService,
    private productsService: ProductsService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private couponsService: CouponsService,
    private usersService: UsersService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      this.logger.warn(
        'GEMINI_API_KEY not found. Chatbot will run in mock mode.',
      );
    }
  }

  async processMessage(userId: string, message: string, history: any[]) {
    try {
      this.logger.debug(
        `Processing message for user: ${userId}. Message: ${message}`,
      );

      // 1. Check Cache
      const cacheKey = `${userId}:${message.trim().toLowerCase()}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        this.logger.debug('Returning cached response');
        try {
          return JSON.parse(cached.response);
        } catch {
          return { text: cached.response };
        }
      }

      // 2. Build Context
      const context = await this.buildContext(userId, message);

      // 3. LLM Interaction with Model Fallback
      if (this.genAI) {
        const mappedHistory = this.formatHistory(history);
        const prompt = this.generatePrompt(context, message);

        for (const modelName of this.models) {
          try {
            this.logger.debug(`Attempting generation with model: ${modelName}`);
            const model = this.genAI.getGenerativeModel({ model: modelName });

            const chat = model.startChat({
              history: mappedHistory,
              generationConfig: { maxOutputTokens: 500 },
            });

            const result = await chat.sendMessage(prompt);
            const response = result.response.text();

            // Try extracting JSON if present (often wrapped in ```json ... ```)
            let finalResponse = { text: response };
            try {
              const cleanText = response.replace(/```json/g, '').replace(/```/g, '').trim();
              if (cleanText.startsWith('{')) {
                const parsed = JSON.parse(cleanText);
                finalResponse = parsed; // { action, params, text }
              }
            } catch (e) {
              // ignore, treat as text
            }

            // Cache the successful response
            this.cache.set(cacheKey, { response, timestamp: Date.now() }); // Cache original string? Or parsed?
            // Let's cache the original string to keep it simple, but we return the object.
            // Actually, we should cache the object or stringify it.
            this.cache.set(cacheKey, { response: JSON.stringify(finalResponse), timestamp: Date.now() });

            return finalResponse;
          } catch (err) {
            const isQuotaError =
              err.message.includes('429') ||
              err.message.includes('quota') ||
              err.message.includes('Too Many Requests');
            if (isQuotaError) {
              this.logger.warn(
                `Model ${modelName} quota exceeded/failed. Trying next model...`,
              );
              continue; // Try next model
            } else {
              // If it's not a quota error (e.g., bad request), throw it to stop trying
              this.logger.error(
                `Model ${modelName} error (non-quota): ${err.message}`,
              );
              // Optional: depending on strategy, we could still try others, but let's assume other errors are fatal
              // actually, let's try others just in case specific model is down
              continue;
            }
          }
        }

        // If loop finishes without returning (All models failed)
        this.logger.error(
          'All 9 models (Gemini + Gemma) failed (Quota/Error). Switching to Rule-Based Fallback.',
        );

        // Graceful Degradation: Use the gathered context to answer directly
        if (context.length > 50) {
          // arbitrary length to ensure we have real info
          return {
            text: `⚠️ **AI Brain Offline (Daily Quota Exceeded)**\n\nI couldn't generate a creative response, but I found this information for you:\n${context.replace('Current Date and Time:', '').trim()}`,
          };
        }

        return {
          text: "I'm currently overloaded with requests (Daily Quota Exceeded). Please try again later.",
        };
      }

      // 4. Mock Mode (No API Key)
      return {
        text: `(Mock AI) Context gathered: ${context.length} chars. Add GEMINI_API_KEY to use real AI.`,
      };
    } catch (error) {
      this.logger.error(
        `Chatbot critical error: ${error.message}`,
        error.stack,
      );
      return {
        text: "I'm having trouble connecting to the server. Please try again later.",
      };
    }
  }

  private formatHistory(history: any[]) {
    const mapped = history.map((h) => ({
      role: h.sender === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    }));
    // Remove leading 'model' messages as Gemini requires user start
    while (mapped.length > 0 && mapped[0].role === 'model') {
      mapped.shift();
    }
    return mapped;
  }

  private generatePrompt(context: string, message: string): string {
    return `
        You are a smart, friendly, and helpful AI Shopping Assistant.
        Current Context:
        ${context}
        
        Guidelines:
        - Answer based on the context provided.
        - Be concise and polite.
        - If suggesting products, mention price and availability.
        - If you don't know, suggest where to look.

        User Question: ${message}

        CRITICAL: If the user indicates a shopping intent (searching, filtering, sorting, or navigating), you MUST return a strict JSON object (no markdown, no extra text) with this structure:
        {
          "action": "SEARCH" | "NAVIGATE" | "ADD_TO_CART" | "TRACK_ORDER" | "CLEAR_CART",
          "params": {
            "query": "string", // for SEARCH
            "route": "string", // for NAVIGATE (e.g., "/cart", "/profile", "/orders")
            "productId": "string", // for ADD_TO_CART (extract from Context [ID: ...])
            "quantity": number, // for ADD_TO_CART (default 1)
            "orderId": "string" // for TRACK_ORDER
          },
          "text": "Brief confirmation text to speak to the user"
        }

        Examples:
        - "Show me red dresses" -> {"action": "SEARCH", "params": {"query": "red dresses"}, "text": "Searching for red dresses."}
        - "Go to my cart" -> {"action": "NAVIGATE", "params": {"route": "/cart"}, "text": "Taking you to your cart."}
        - "Add the first product to cart" -> {"action": "ADD_TO_CART", "params": {"productId": "...", "quantity": 1}, "text": "Added to cart."}
        
        If it is a general question, just return the plain text response.
        `;
  }

  private async buildContext(userId: string, message: string): Promise<string> {
    let context = `Current Date: ${new Date().toLocaleString()}\n`;
    const lowerMsg = message.toLowerCase();

    try {
      // Parallel context gathering could be faster, but sequential is safer for error isolation

      // Orders
      if (userId && (lowerMsg.includes('order') || lowerMsg.includes('status'))) {
        const orders = await this.ordersService.findMy(userId);
        context +=
          orders.length > 0
            ? `\nLast Order: #${orders[0]._id} is ${orders[0].orderStatus} ($${orders[0].totalAmount}).`
            : `\nNo recent orders found.`;
      }

      // Cart
      if (userId && (lowerMsg.includes('cart') || lowerMsg.includes('bag'))) {
        const cart = await this.cartService.findOne(userId);
        context +=
          cart && cart.items.length
            ? `\nCart: ${cart.items.length} items, Total $${cart.totalPrice}.`
            : `\nCart is empty.`;
      }

      // Wishlist
      if (userId && (lowerMsg.includes('wishlist') || lowerMsg.includes('save'))) {
        const wishlists = await this.wishlistService.findAll(userId);
        const w = wishlists[0];
        context +=
          w && w.items.length
            ? `\nWishlist '${w.name}': ${w.items.length} items.`
            : `\nWishlist is empty.`;
      }

      // Coupons (Public)
      if (lowerMsg.includes('coupon') || lowerMsg.includes('code')) {
        const coupons = await this.couponsService.findAll({
          status: CouponStatus.ACTIVE,
          isActive: true,
        });
        context += coupons.length
          ? `\nCoupons: ${coupons.map((c) => c.code).join(', ')}.`
          : `\nNo active coupons.`;
      }

      // Product Search (Always try if message is long enough, or explicit intent)
      if (message.length > 3) {
        const search = await this.productsService.findAll({
          search: message,
          limit: 3,
        } as any);
        if (search.products.length > 0) {
          context +=
            `\nProducts found:\n` +
            search.products.map((p) => `- [ID: ${p._id}] ${p.title} ($${p.price}) - ${p.stock > 0 ? 'In Stock' : 'Out of Stock'}`).join('\n');
        }
      }
    } catch (e) {
      this.logger.warn(`Context building partial failure: ${e.message}`);
    }

    return context;
  }
}
