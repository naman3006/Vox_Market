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
    private model: any;

    constructor(
        private configService: ConfigService,
        private ordersService: OrdersService,
        private productsService: ProductsService,
        private cartService: CartService,
        private wishlistService: WishlistService,
        private couponsService: CouponsService,
        private usersService: UsersService
    ) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite-preview-09-2025' });
        } else {
            this.logger.warn('GEMINI_API_KEY not found. Chatbot will run in mock mode.');
        }
    }

    async processMessage(userId: string, message: string, history: any[]) {
        try {
            this.logger.debug(`Processing message for user: ${userId}. Message: ${message}`);
            // 1. Context Gathering
            let context = `Current Date and Time: ${new Date().toLocaleString()}\n`;
            const lowerMsg = message.toLowerCase();

            // Check for Order Intent
            if (lowerMsg.includes('order') || lowerMsg.includes('status') || lowerMsg.includes('tracking')) {
                const orders = await this.ordersService.findMy(userId);
                if (orders.length > 0) {
                    const recentOrder = orders[0];
                    context += `\nUser's most recent order: Order #${recentOrder._id} is currently ${recentOrder.orderStatus}. Total: $${recentOrder.totalAmount}. Placed on ${(recentOrder as any).createdAt}.`;
                } else {
                    context += `\nUser has no recent orders.`;
                }
            }

            // Product Context - Search based on user message
            try {
                // Search limit to 3 to keep context concise
                const searchResults = await this.productsService.findAll({ search: message, limit: 3 } as any);
                if (searchResults.products.length > 0) {
                    const productDetails = searchResults.products.map(p =>
                        `- ${p.title}: $${p.price} (${p.stockStatus}, ${p.stock} left) - Rating: ${p.rating}/5\n  Description: ${p.description.substring(0, 150)}...`
                    ).join('\n');
                    context += `\n\nRelevant Products found for your query:\n${productDetails}\n`;
                }
            } catch (err) {
                this.logger.warn(`Product search failed: ${err.message}`);
            }

            // Cart Intent
            try {
                if (lowerMsg.includes('cart') || lowerMsg.includes('basket') || lowerMsg.includes('bag')) {
                    this.logger.debug('Checking Cart...');
                    const cart = await this.cartService.findOne(userId);
                    if (cart && cart.items.length > 0) {
                        const cartDetails = cart.items.map((item: any) =>
                            `- ${item.productId.title}: $${item.price} (Qty: ${item.quantity})`
                        ).join('\n');
                        context += `\nUser's Cart (${cart.items.length} items, Total: $${cart.totalPrice}):\n${cartDetails}`;
                    } else {
                        context += `\nUser's Cart is empty.`;
                    }
                }
            } catch (e) { this.logger.error(`Cart check failed: ${e.message}`); }

            // Wishlist Intent
            try {
                if (lowerMsg.includes('wishlist') || lowerMsg.includes('saved')) {
                    this.logger.debug('Checking Wishlist...');
                    const wishlist = await this.wishlistService.findOne(userId);
                    if (wishlist && wishlist.productIds.length > 0) {
                        const wishItems = wishlist.productIds.map((p: any) => `- ${p.title}`).join('\n');
                        context += `\nUser's Wishlist:\n${wishItems}`;
                    } else {
                        context += `\nUser's Wishlist is empty.`;
                    }
                }
            } catch (e) { this.logger.error(`Wishlist check failed: ${e.message}`); }

            // Coupon Intent
            try {
                if (lowerMsg.includes('coupon') || lowerMsg.includes('discount') || lowerMsg.includes('promo')) {
                    this.logger.debug('Checking Coupons...');
                    const coupons = await this.couponsService.findAll({ status: CouponStatus.ACTIVE, isActive: true });
                    if (coupons.length > 0) {
                        const couponList = coupons.map(c =>
                            `- Code: ${c.code} (${c.discountType === 'percentage' ? c.discountValue + '%' : '$' + c.discountValue} OFF) - Min Purchase: $${c.minPurchaseAmount}`
                        ).join('\n');
                        context += `\nActive Coupons:\n${couponList}`;
                    } else {
                        context += `\nNo active coupons available right now.`;
                    }
                }
            } catch (e) { this.logger.error(`Coupon check failed: ${e.message}`); }

            // Profile Intent
            try {
                if (lowerMsg.includes('profile') || lowerMsg.includes('account') || lowerMsg.includes('who am i') || lowerMsg.includes('my details')) {
                    this.logger.debug('Checking Profile...');
                    const user = await this.usersService.findOne(userId);
                    if (user) {
                        context += `\nUser Profile: Name: ${user.name}, Email: ${user.email}. Joined: ${new Date((user as any).createdAt).toLocaleDateString()}`;
                    }
                }
            } catch (e) { this.logger.error(`Profile check failed: ${e.message}`); }

            // Check for Product/Recommendation Intent
            if (lowerMsg.includes('recommend') || lowerMsg.includes('suggest') || lowerMsg.includes('buy') || lowerMsg.includes('looking for')) {
                // Simple search extraction - in a real app, use an LLM or keyword extractor
                // For now, let's just grab featured products as a fallback or search if specific keywords exist
                const products = await this.productsService.getFeaturedProducts(5);
                const productList = products.map(p => `- ${p.title}: $${p.price} (Rating: ${p.rating})`).join('\n');
                context += `\nAvailable Featured Products:\n${productList}`;
            }

            // 2. LLM Interaction
            if (this.model) {
                const mappedHistory = history.map(h => ({
                    role: h.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: h.text }]
                }));

                // Gemini requires history to start with 'user'
                // If the first message is from 'model', remove it (it's likely the welcome message)
                while (mappedHistory.length > 0 && mappedHistory[0].role === 'model') {
                    mappedHistory.shift();
                }

                const chat = this.model.startChat({
                    history: mappedHistory,
                    generationConfig: {
                        maxOutputTokens: 500,
                    },
                });

                const prompt = `
        You are a friendly and knowledgeable AI Shopping Assistant for this E-commerce store.
        Your goal is to help users find products, track orders, manage their account, and save money.

        Use the following context to answer the user's question accurately:
        ${context}
        
        Guidelines:
        - If the user asks about their cart, wishlist, or orders, use the provided context.
        - If the user asks for coupons, list the active codes.
        - If suggesting products, mention their rating and price.
        - Be concise, professional, and helpful. 
        - If you don't know something, suggest they check the specific page (e.g., "Please check the Orders page").

        User: ${message}
        `;

                try {
                    const result = await this.retryWithBackoff(async () => {
                        return await chat.sendMessage(prompt);
                    });
                    const response = await result.response;
                    return { text: response.text() };
                } catch (retryError) {
                    this.logger.error(`Failed to get response after retries: ${retryError.message}`);
                    const fallbackMessage = context
                        ? `I'm currently overloaded with requests, but here is some information I found:\n${context}`
                        : "I'm currently overloaded with requests and couldn't process your specific question. Please try again later.";
                    return { text: fallbackMessage };
                }
            }

            // 3. Fallback / Mock Mode
            return {
                text: `(Mock AI) I see you're asking about "${message}". \n\nContext found: ${context || 'None'}. \n\nTo get real AI responses, please add GEMINI_API_KEY to your .env file.`
            };

        } catch (error) {
            this.logger.error(`Chatbot error: ${error.message}`, error.stack);
            return { text: "I'm having trouble connecting to my brain right now. Please try again later." };
        }
    }

    private async retryWithBackoff<T>(operation: () => Promise<T>, retries: number = 3, delay: number = 1000): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            const errorMsg = error.message.toLowerCase();
            if (retries > 0 && (errorMsg.includes('429') || errorMsg.includes('too many requests') || errorMsg.includes('quota'))) {
                this.logger.warn(`Rate limited. Retrying in ${delay}ms... (${retries} retries left)`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.retryWithBackoff(operation, retries - 1, delay * 2);
            } else {
                throw error;
            }
        }
    }
}