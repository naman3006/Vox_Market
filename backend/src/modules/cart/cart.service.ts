import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Cart, CartDocument, CartItem } from './schemas/cart.schema';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  private readonly MIN_QUANTITY = 1;
  private readonly MAX_QUANTITY = 999;

  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @Optional() @Inject(CACHE_MANAGER) private cacheManager?: Cache,
  ) {}

  // ... (lines 28-215 omitted, no changes)

  private async getProductPrice(
    productId: string,
  ): Promise<{ price: number } | null> {
    const product = await this.productModel
      .findById(productId)
      .select('price')
      .exec();
    return product ? { price: product.price } : null;
  }

  async findOne(userId: string, role: string = 'user'): Promise<CartDocument> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      let cart = await this.cartModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .populate('items.productId')
        .exec();

      if (cart) {
        // Migration: Ensure role exists for existing carts
        if (!cart.role) {
          cart.role = role || 'user';
          await cart.save();
          this.logger.log(
            `Backfilled role for user: ${userId} to ${cart.role}`,
          );
        }
      } else {
        cart = new this.cartModel({
          userId: new Types.ObjectId(userId),
          role: role || 'user',
          items: [],
          totalPrice: 0,
        });
        await cart.save();
        this.logger.log(`Cart created for user: ${userId} with role: ${role}`);
      }
      return cart;
    } catch (error) {
      this.logger.error(
        `Error finding cart for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error; // Rethrow to let NestJS handle it, but now it's logged
    }
  }

  async add(
    userId: string,
    role: string,
    addToCartDto: AddToCartDto,
  ): Promise<CartDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    if (!Types.ObjectId.isValid(addToCartDto.productId)) {
      throw new BadRequestException('Invalid product ID format');
    }

    this.validateQuantity(addToCartDto.quantity);

    try {
      const cart = await this.findOne(userId, role);

      // Find existing item or create new one
      const existingItemIndex = cart.items.findIndex(
        (item) =>
          item.productId &&
          item.productId.toString() === addToCartDto.productId.toString(),
      );

      if (existingItemIndex > -1) {
        // Update existing item
        const newQuantity =
          cart.items[existingItemIndex].quantity + addToCartDto.quantity;
        this.validateQuantity(newQuantity);
        cart.items[existingItemIndex].quantity = newQuantity;
        this.logger.debug(
          `Updated cart item quantity for product: ${addToCartDto.productId}`,
        );
      } else {
        // Add new item - fetch price from product
        const product = await this.getProductPrice(addToCartDto.productId);

        const newItem: CartItem = {
          productId: new Types.ObjectId(addToCartDto.productId),
          quantity: addToCartDto.quantity,
          price: product?.price || 0,
        };
        cart.items.push(newItem);
        this.logger.debug(`Added new item to cart: ${addToCartDto.productId}`);
      }

      // Recalculate total price
      cart.totalPrice = this.calculateTotalPrice(cart.items);
      await cart.save();
      this.invalidateCartCache(userId);

      return cart;
    } catch (error) {
      this.logger.error(`Error adding to cart: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to add item to cart');
    }
  }

  async update(
    userId: string,
    role: string,
    itemId: string,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    this.validateQuantity(updateCartItemDto.quantity);

    try {
      const cart = await this.findOne(userId, role);
      const itemIndex = cart.items.findIndex(
        (item) => item._id?.toString() === itemId,
      );

      if (itemIndex === -1) {
        throw new NotFoundException('Item not found in cart');
      }

      cart.items[itemIndex].quantity = updateCartItemDto.quantity;
      cart.totalPrice = this.calculateTotalPrice(cart.items);
      await cart.save();
      this.invalidateCartCache(userId);

      this.logger.log(`Updated cart item: ${itemId} for user: ${userId}`);
      return cart;
    } catch (error) {
      this.logger.error(`Error updating cart: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update cart item');
    }
  }

  async remove(
    userId: string,
    role: string,
    itemId: string,
  ): Promise<CartDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    try {
      const cart = await this.findOne(userId, role);
      const initialLength = cart.items.length;

      cart.items = cart.items.filter((item) => item._id?.toString() !== itemId);

      if (cart.items.length === initialLength) {
        throw new NotFoundException('Item not found in cart');
      }

      cart.totalPrice = this.calculateTotalPrice(cart.items);
      await cart.save();
      this.invalidateCartCache(userId);

      this.logger.log(`Removed item ${itemId} from cart for user: ${userId}`);
      return cart;
    } catch (error) {
      this.logger.error(
        `Error removing from cart: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to remove item from cart');
    }
  }

  async clear(userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    try {
      const result = await this.cartModel
        .deleteOne({ userId: new Types.ObjectId(userId) })
        .exec();

      if (result.deletedCount === 0) {
        throw new NotFoundException('Cart not found');
      }

      this.invalidateCartCache(userId);
      this.logger.log(`Cleared cart for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Error clearing cart: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to clear cart');
    }
  }

  private validateQuantity(quantity: number): void {
    if (
      !Number.isInteger(quantity) ||
      quantity < this.MIN_QUANTITY ||
      quantity > this.MAX_QUANTITY
    ) {
      throw new BadRequestException(
        `Quantity must be between ${this.MIN_QUANTITY} and ${this.MAX_QUANTITY}`,
      );
    }
  }

  private calculateTotalPrice(items: CartItem[]): number {
    return items.reduce(
      (sum, item) => sum + (item.price || 0) * item.quantity,
      0,
    );
  }

  private invalidateCartCache(userId: string): void {
    if (this.cacheManager) {
      const cacheKey = `cart:${userId}`;
      this.cacheManager.del(cacheKey).catch((err) => {
        this.logger.warn(`Failed to invalidate cart cache: ${err.message}`);
      });
    }
  }
}
