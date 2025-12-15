import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotService } from './chatbot.service';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { CartService } from '../cart/cart.service';
import { WishlistService } from '../wishlist/wishlist.service';
import { CouponsService } from '../coupons/coupons.service';
import { UsersService } from '../users/users.service';

// Mock dependencies
const mockConfigService = {
    get: jest.fn().mockReturnValue('mock-api-key'),
};
const mockOrdersService = { findMy: jest.fn().mockResolvedValue([]) };
const mockProductsService = { findAll: jest.fn().mockResolvedValue({ products: [] }), getFeaturedProducts: jest.fn().mockResolvedValue([]) };
const mockCartService = { findOne: jest.fn().mockResolvedValue(null) };
const mockWishlistService = { findOne: jest.fn().mockResolvedValue(null) };
const mockCouponsService = { findAll: jest.fn().mockResolvedValue([]) };
const mockUsersService = { findOne: jest.fn().mockResolvedValue(null) };

// Mock GoogleGenerativeAI
const mockSendMessage = jest.fn();
const mockStartChat = jest.fn().mockReturnValue({
    sendMessage: mockSendMessage,
});
const mockGetGenerativeModel = jest.fn().mockReturnValue({
    startChat: mockStartChat,
});

jest.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: jest.fn().mockImplementation(() => {
            return {
                getGenerativeModel: mockGetGenerativeModel,
            };
        }),
    };
});

describe('ChatbotService', () => {
    let service: ChatbotService;

    beforeEach(async () => {
        jest.useFakeTimers();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatbotService,
                { provide: ConfigService, useValue: mockConfigService },
                { provide: OrdersService, useValue: mockOrdersService },
                { provide: ProductsService, useValue: mockProductsService },
                { provide: CartService, useValue: mockCartService },
                { provide: WishlistService, useValue: mockWishlistService },
                { provide: CouponsService, useValue: mockCouponsService },
                { provide: UsersService, useValue: mockUsersService },
            ],
        }).compile();

        service = module.get<ChatbotService>(ChatbotService);

        // Reset mocks
        mockSendMessage.mockReset();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should retry on 429 error and eventually succeed', async () => {
        // 1. Setup mock to fail twice with 429, then succeed
        mockSendMessage
            .mockRejectedValueOnce(new Error('429 Too Many Requests'))
            .mockRejectedValueOnce(new Error('Quota exceeded')) // Should also match retry condition
            .mockResolvedValue({ response: { text: () => 'Success after retry' } });

        // 2. Call the method - since we use fake timers, we need to advance them while waiting?
        // Actually, retryWithBackoff awaits a Promise that uses setTimeout.
        // If we just await the promise, it will hang because setTimeout is mocked and never fires unless we advance.

        const promise = service.processMessage('user1', 'hello', []);

        // Allow first failure to happen and timer to be set
        await Promise.resolve(); // Context switch
        await jest.advanceTimersByTimeAsync(1000); // Fast forward 1s

        await Promise.resolve(); // Context switch
        await jest.advanceTimersByTimeAsync(2000); // Fast forward 2s

        const result = await promise;

        // 3. Verify interaction
        expect(mockSendMessage).toHaveBeenCalledTimes(3);
        expect(result.text).toBe('Success after retry');
    });

    it('should return overflow message when retries are exhausted', async () => {
        // 1. Setup mock to fail always
        mockSendMessage.mockRejectedValue(new Error('429 Too Many Requests'));

        // 2. Call the method
        const promise = service.processMessage('user1', 'hello', []);

        // Advance timers for all retries (1000 + 2000 + 4000)
        await Promise.resolve();
        await jest.advanceTimersByTimeAsync(1000);
        await Promise.resolve();
        await jest.advanceTimersByTimeAsync(2000);
        await Promise.resolve();
        await jest.advanceTimersByTimeAsync(4000);

        const result = await promise;

        // 3. Verify interaction
        // Initial + 3 retries = 4 calls
        expect(mockSendMessage).toHaveBeenCalledTimes(4);
        expect(result.text).toContain('currently overloaded');
    });

    it('should return context based response if API key is missing (Mock Mode)', async () => {
        // Override config for this test
        jest.spyOn(mockConfigService, 'get').mockReturnValue(null);

        // Re-create service with new config
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatbotService,
                { provide: ConfigService, useValue: mockConfigService },
                { provide: OrdersService, useValue: mockOrdersService },
                { provide: ProductsService, useValue: mockProductsService },
                { provide: CartService, useValue: mockCartService },
                { provide: WishlistService, useValue: mockWishlistService },
                { provide: CouponsService, useValue: mockCouponsService },
                { provide: UsersService, useValue: mockUsersService },
            ],
        }).compile();
        const localService = module.get<ChatbotService>(ChatbotService);

        const result = await localService.processMessage('user1', 'hello', []);
        expect(result.text).toContain('(Mock AI)');
    });
});
