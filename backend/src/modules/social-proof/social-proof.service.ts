import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Redis from 'ioredis';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';

@Injectable()
export class SocialProofService implements OnModuleInit, OnModuleDestroy {
    private redisClient: Redis;
    private readonly logger = new Logger(SocialProofService.name);

    constructor(
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        @InjectModel('Product') private productModel: Model<ProductDocument>,
    ) {
        // Ideally this comes from ConfigService, but for now we default to localhost:6379
        this.redisClient = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
        });
    }

    onModuleInit() {
        this.logger.log('Social Proof Service initialized with Redis');
    }

    onModuleDestroy() {
        this.redisClient.disconnect();
    }

    async incrementViewers(productId: string): Promise<number> {
        const key = `viewers:product:${productId}`;
        const count = await this.redisClient.incr(key);
        await this.redisClient.expire(key, 7200);
        return count;
    }

    async decrementViewers(productId: string): Promise<number> {
        const key = `viewers:product:${productId}`;
        const count = await this.redisClient.decr(key);
        if (count < 0) {
            await this.redisClient.set(key, 0);
            return 0;
        }
        return count;
    }

    async getViewers(productId: string): Promise<number> {
        const key = `viewers:product:${productId}`;
        const count = await this.redisClient.get(key);
        return count ? parseInt(count, 10) : 0;
    }

    async getProductStats(productId: string): Promise<{ soldCount: number; boughtInLast24h: number }> {
        try {
            const product = await this.productModel.findById(productId).select('soldCount').lean();
            const soldCount = product ? (product as any).soldCount : 0;

            // Calculate bought in last 24h
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const aggregation = [
                {
                    $match: {
                        createdAt: { $gte: twentyFourHoursAgo },
                        'items.productId': new Types.ObjectId(productId)
                    }
                },
                { $unwind: '$items' },
                {
                    $match: {
                        'items.productId': new Types.ObjectId(productId)
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalBought: { $sum: '$items.quantity' }
                    }
                }
            ];

            const result = await this.orderModel.aggregate(aggregation);
            const boughtInLast24h = result.length > 0 ? result[0].totalBought : 0;

            return { soldCount, boughtInLast24h };

        } catch (error) {
            this.logger.error(`Error fetching product stats: ${error.message}`);
            return { soldCount: 0, boughtInLast24h: 0 };
        }
    }
}
