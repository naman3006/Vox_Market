/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  Optional,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Order, OrderDocument } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { NotificationGateway } from '../notifications/notification.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { CouponsService } from '../coupons/coupons.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel('Product') private productModel: Model<any>,
    @InjectModel('User') private userModel: Model<any>,
    // private notificationGateway: NotificationGateway,
    private notificationsService: NotificationsService,
    private eventEmitter: EventEmitter2,
    private couponsService: CouponsService,
    @Optional() @Inject(CACHE_MANAGER) private cacheManager?: Cache,
  ) { }

  async create(
    createOrderDto: CreateOrderDto,
    userId: string,
  ): Promise<OrderDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    // Validate order items
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    try {
      const itemsWithIds = createOrderDto.items.map((item) => {
        if (!Types.ObjectId.isValid(item.productId)) {
          throw new BadRequestException(
            `Invalid product ID format: ${item.productId}`,
          );
        }
        return {
          ...item,
          productId: new Types.ObjectId(item.productId),
        };
      });

      // Handle Coupon Usage
      let appliedCouponId = null;
      if (createOrderDto.appliedCoupon) {
        try {
          if (Types.ObjectId.isValid(createOrderDto.appliedCoupon)) {
            await this.couponsService.applyCoupon(createOrderDto.appliedCoupon, userId);
            appliedCouponId = new Types.ObjectId(createOrderDto.appliedCoupon);
          }
        } catch (error) {
          this.logger.warn(`Failed to apply coupon ${createOrderDto.appliedCoupon}: ${error.message}`);
          // Decide if we should block order creation or just proceed without coupon.
          // Usually if user expects discount, failing is safer?
          // But front-end already validated. If applyCoupon fails (e.g. limit reached in split second),
          // strictly we should fail.
          // For now, I'll log and proceed but NOT attach coupon ID to order if it failed to apply.
        }
      }

      const order = new this.orderModel({
        ...createOrderDto,
        userId: new Types.ObjectId(userId),
        items: itemsWithIds,
        appliedCoupon: appliedCouponId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedOrder = await order.save();
      this.logger.log(`Order created: ${savedOrder._id} for user: ${userId}`);

      // Emit event for order creation
      this.eventEmitter.emit('order.created', {
        orderId: savedOrder._id,
        userId,
        order: savedOrder,
      });

      // 1. Notify Buyer
      await this.notificationsService.create(
        userId,
        `Order #${savedOrder._id} created successfully`,
        'order'
      );

      // 2. Notify Sellers
      const productIds = itemsWithIds.map(i => i.productId);
      const products = await this.productModel.find({ _id: { $in: productIds } }).select('sellerId title').lean();

      const sellerIds = new Set(products.map(p => p.sellerId?.toString()).filter(Boolean));

      for (const sellerId of sellerIds) {
        await this.notificationsService.create(
          sellerId,
          `New order received! Order #${savedOrder._id} contains your products.`,
          'order'
        );
      }

      // 3. Notify Admins
      const admins = await this.userModel.find({ role: 'admin' }).select('_id').lean();
      for (const admin of admins) {
        await this.notificationsService.create(
          admin._id.toString(),
          `New order #${savedOrder._id} placed by user.`,
          'order'
        );
      }

      // 4. Real-time update to Admins
      this.notificationsService.sendToRole('admin', 'order.created', {
        orderId: savedOrder._id,
        order: savedOrder,
      });

      this.invalidateUserOrdersCache(userId);
      return savedOrder;
    } catch (error) {
      this.logger.error(`Error creating order: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create order');
    }
  }

  async findMy(userId: string): Promise<OrderDocument[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const cacheKey = `user_orders:${userId}`;

    // Try cache
    if (this.cacheManager) {
      const cached = await this.cacheManager.get<OrderDocument[]>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for user orders: ${userId}`);
        return cached;
      }
    }

    try {
      const orders = await this.orderModel
        .find({ userId: new Types.ObjectId(userId) })
        .populate('items.productId')
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      if (this.cacheManager) {
        await this.cacheManager.set(cacheKey, orders, 300000); // 5 minutes
      }

      return orders as unknown as OrderDocument[];
    } catch (error) {
      this.logger.error(
        `Error fetching user orders: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to fetch orders');
    }
  }

  async findAll(): Promise<OrderDocument[]> {
    const cacheKey = 'all_orders';

    if (this.cacheManager) {
      const cached = await this.cacheManager.get<OrderDocument[]>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for all orders`);
        return cached;
      }
    }

    try {
      const orders = await this.orderModel
        .find()
        .populate('userId')
        .populate('items.productId')
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      if (this.cacheManager) {
        await this.cacheManager.set(cacheKey, orders, 300000); // 5 minutes
      }

      return orders as unknown as OrderDocument[];
    } catch (error) {
      this.logger.error(
        `Error fetching all orders: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to fetch orders');
    }
  }

  async findBySeller(sellerId: string): Promise<OrderDocument[]> {
    if (!Types.ObjectId.isValid(sellerId)) {
      throw new BadRequestException('Invalid seller ID format');
    }

    try {
      const orders = await this.orderModel
        .find()
        .populate('userId')
        .populate('items.productId')
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      // Filter orders where at least one item belongs to a product with sellerId
      const filtered = (orders as any[]).filter((order) => {
        return (order.items || []).some((it) => {
          const prod = it.productId as any;
          return prod && prod.sellerId && prod.sellerId.toString() === sellerId;
        });
      });

      return filtered as unknown as OrderDocument[];
    } catch (error) {
      this.logger.error(
        `Error fetching seller orders: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to fetch seller orders');
    }
  }

  async findByProduct(
    productId: string,
    sellerId?: string,
  ): Promise<OrderDocument[]> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID format');
    }

    try {
      const orders = await this.orderModel
        .find({ 'items.productId': new Types.ObjectId(productId) })
        .populate('userId')
        .populate('items.productId')
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      if (!sellerId) return orders as unknown as OrderDocument[];

      const filtered = (orders as any[]).filter((order) => {
        return (order.items || []).some((it) => {
          const prod = it.productId as any;
          return prod && prod.sellerId && prod.sellerId.toString() === sellerId;
        });
      });

      return filtered as unknown as OrderDocument[];
    } catch (error) {
      this.logger.error(
        `Error fetching product orders: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to fetch product orders');
    }
  }

  async acceptBySeller(
    orderId: string,
    sellerId: string,
  ): Promise<OrderDocument> {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID format');
    }
    if (!Types.ObjectId.isValid(sellerId)) {
      throw new BadRequestException('Invalid seller ID format');
    }

    try {
      const order = await this.orderModel
        .findById(orderId)
        .populate('items.productId')
        .exec();

      if (!order) throw new NotFoundException('Order not found');

      // Ensure seller owns at least one product in order
      const ownsProduct = (order.items || []).some((it: any) => {
        const prod = it.productId as any;
        return prod && prod.sellerId && prod.sellerId.toString() === sellerId;
      });

      if (!ownsProduct) {
        throw new ForbiddenException(
          'You do not have permission to accept this order',
        );
      }

      // Update order status to processing (seller accepted)
      const updated = await this.orderModel
        .findByIdAndUpdate(
          orderId,
          {
            orderStatus: 'processing',
            updatedAt: new Date(),
            $push: {
              statusHistory: {
                status: 'processing',
                timestamp: new Date(),
                updatedBy: new Types.ObjectId(sellerId),
                note: 'Accepted by seller',
              },
            },
          },
          { new: true },
        )
        .exec();

      // Notify buyer
      if (updated && updated.userId) {
        await this.notificationsService.create(
          updated.userId.toString(),
          `Your Order #${updated._id} has been accepted by seller`,
          'order'
        );
      }

      // Emit status updated event
      this.eventEmitter.emit('order.status.updated', {
        orderId,
        userId: updated.userId,
        status: 'processing',
      });

      this.invalidateUserOrdersCache((updated.userId || '').toString());
      return updated;
    } catch (error) {
      this.logger.error(
        `Error accepting order by seller: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to accept order');
    }
  }

  async findOne(id: string): Promise<OrderDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid order ID format');
    }

    try {
      const order = await this.orderModel
        .findById(id)
        .populate('userId')
        .populate('items.productId')
        .exec();

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      return order;
    } catch (error) {
      this.logger.error(`Error fetching order: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch order');
    }
  }

  async cancel(orderId: string, userId: string): Promise<OrderDocument> {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID format');
    }

    try {
      const order = await this.orderModel.findById(orderId);

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // Check ownership
      if (order.userId.toString() !== userId) {
        throw new ForbiddenException('You can only cancel your own orders');
      }

      // Check status
      if (order.orderStatus !== 'pending') {
        throw new BadRequestException('Only pending orders can be cancelled');
      }

      // Update status
      const updatedOrder = await this.orderModel
        .findByIdAndUpdate(
          orderId,
          {
            orderStatus: 'cancelled',
            updatedAt: new Date(),
            $push: {
              statusHistory: {
                status: 'cancelled',
                timestamp: new Date(),
                updatedBy: new Types.ObjectId(userId),
                note: 'Cancelled by user',
              },
            },
          },
          { new: true },
        )
        .populate('items.productId')
        .exec();

      this.logger.log(`Order cancelled by user: ${orderId}`);

      // Emit event
      this.eventEmitter.emit('order.status.updated', {
        orderId,
        userId,
        status: 'cancelled',
      });

      // Notify User
      try {
        await this.notificationsService.create(
          userId,
          `Order #${orderId} has been cancelled successfully`,
          'order'
        );
      } catch (err) {
        this.logger.warn(`Failed to notify user about order cancellation: ${err.message}`);
      }

      // Notify Sellers? (Optional, but good practice if they were notified of creation)
      // Re-using logic to find sellers
      try {
        const sellerIds = new Set((updatedOrder.items || []).map((it: any) => it.productId?.sellerId?.toString()).filter(Boolean));
        for (const sellerId of sellerIds) {
          await this.notificationsService.create(
            sellerId,
            `Order #${orderId} has been cancelled by the buyer.`,
            'order'
          );
        }
      } catch (err) {
        this.logger.warn(`Failed to notify sellers about order cancellation: ${err.message}`);
      }

      this.invalidateUserOrdersCache(userId);
      return updatedOrder;
    } catch (error) {
      this.logger.error(`Error cancelling order: ${error.message}`, error.stack);
      if (error instanceof ForbiddenException || error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to cancel order');
    }
  }

  async updateStatus(
    id: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
    userId: string = 'admin', // Default to 'admin' if not passed
  ): Promise<OrderDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid order ID format');
    }

    // Validate status
    const validStatuses = [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ];
    if (!validStatuses.includes(updateOrderStatusDto.orderStatus)) {
      throw new BadRequestException(
        `Invalid order status. Must be one of: ${validStatuses.join(', ')}`,
      );
    }

    try {
      const order = await this.orderModel
        .findByIdAndUpdate(
          id,
          {
            $set: {
              orderStatus: updateOrderStatusDto.orderStatus,
              updatedAt: new Date(),
              ...(updateOrderStatusDto.trackingNumber && { trackingNumber: updateOrderStatusDto.trackingNumber }),
              ...(updateOrderStatusDto.courierService && { courierService: updateOrderStatusDto.courierService }),
            },
            $push: {
              statusHistory: {
                status: updateOrderStatusDto.orderStatus,
                timestamp: new Date(),
                note: updateOrderStatusDto.note || 'Status updated by admin',
                updatedBy: userId,
              },
            },
          },
          { new: true },
        )
        .populate('items.productId') // Populate to find sellers
        .exec();

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      this.logger.log(
        `Order status updated: ${id} to ${updateOrderStatusDto.orderStatus}`,
      );

      // Emit event for status update
      this.eventEmitter.emit('order.status.updated', {
        orderId: id,
        userId: order.userId,
        status: updateOrderStatusDto.orderStatus,
      });

      const payload = {
        orderId: order._id,
        status: updateOrderStatusDto.orderStatus,
        order: order // Send full updated order
      };

      // Real-time update to user
      this.notificationsService.sendRealTimeUpdate(order.userId.toString(), 'order_update', payload);

      // Real-time update to Admins
      this.notificationsService.sendToRole('admin', 'order.status.updated', {
        orderId: id,
        status: updateOrderStatusDto.orderStatus,
        order: order
      });

      // 1. Notify Buyer (Persistent Notification)
      await this.notificationsService.create(
        order.userId.toString(),
        `Order #${order._id} status updated to ${updateOrderStatusDto.orderStatus}`,
        'order'
      );

      // 2. Notify Sellers (if updated by Admin)
      // Since updateStatus is protected by @Roles('admin') in controller (usually), we can assume admin action here
      // But let's look at the items to find sellers
      const sellerIds = new Set((order.items || []).map((it: any) => it.productId?.sellerId?.toString()).filter(Boolean));

      for (const sellerId of sellerIds) {
        await this.notificationsService.create(
          sellerId,
          `Order #${order._id} status updated to ${updateOrderStatusDto.orderStatus} by Admin`,
          'order'
        );
      }

      this.invalidateUserOrdersCache(order.userId.toString());
      return order;
    } catch (error) {
      this.logger.error(
        `Error updating order status: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to update order status');
    }
  }

  private invalidateUserOrdersCache(userId: string): void {
    if (this.cacheManager) {
      const keys = [`user_orders:${userId}`, 'all_orders'];
      keys.forEach((key) => {
        this.cacheManager?.del(key).catch((err) => {
          this.logger.warn(
            `Failed to invalidate cache key ${key}: ${err.message}`,
          );
        });
      });
    }
  }
}
