import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async getFrequentlyBoughtTogether(
    productId: string,
    limit: number = 4,
  ): Promise<ProductDocument[]> {
    if (!Types.ObjectId.isValid(productId)) {
      return [];
    }

    const objectId = new Types.ObjectId(productId);

    // 1. Find orders that contain this product
    // 2. Unwind items
    // 3. Exclude the product itself
    // 4. Group by product and count
    // 5. Sort by count desc
    // 6. Limit
    // 7. Lookup product details

    const recommendations = await this.orderModel
      .aggregate<ProductDocument>([
        { $match: { 'items.productId': objectId } },
        { $unwind: '$items' },
        { $match: { 'items.productId': { $ne: objectId } } },
        {
          $group: {
            _id: '$items.productId',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: limit || 4 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: '$product' },
        { $replaceRoot: { newRoot: '$product' } },
        { $match: { isActive: true } }, // Ensure we only recommend active products
      ])
      .exec();

    return recommendations;
  }
}
