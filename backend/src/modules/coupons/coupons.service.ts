import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Coupon,
  CouponDocument,
  CouponStatus,
  DiscountType,
} from './schemas/coupon.schema';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
    private notificationsService: NotificationsService,
    private usersService: UsersService,
  ) { }

  async create(
    createCouponDto: CreateCouponDto,
    userId: string,
  ): Promise<CouponDocument> {
    // Check if coupon code already exists
    const existingCoupon = await this.couponModel.findOne({
      code: createCouponDto.code.toUpperCase(),
    });

    if (existingCoupon) {
      throw new ConflictException('Coupon code already exists');
    }

    // Validate dates
    if (
      new Date(createCouponDto.validFrom) >=
      new Date(createCouponDto.validUntil)
    ) {
      throw new BadRequestException(
        'Valid from date must be before valid until date',
      );
    }

    // Validate discount value
    if (createCouponDto.discountType === DiscountType.PERCENTAGE) {
      if (createCouponDto.discountValue > 100) {
        throw new BadRequestException('Percentage discount cannot exceed 100%');
      }
    }

    const coupon = new this.couponModel({
      ...createCouponDto,
      code: createCouponDto.code.toUpperCase(),
      createdBy: new Types.ObjectId(userId),
      applicableCategories:
        createCouponDto.applicableCategories?.map(
          (id) => new Types.ObjectId(id),
        ) || [],
      applicableProducts:
        createCouponDto.applicableProducts?.map(
          (id) => new Types.ObjectId(id),
        ) || [],
      applicableUsers:
        createCouponDto.applicableUsers?.map((id) => new Types.ObjectId(id)) ||
        [],
    });

    const savedCoupon = await coupon.save();

    // ---------------------------------------------------------
    // NOTIFICATION LOGIC
    // ---------------------------------------------------------
    try {
      // 1. Get all users (or filter active ones if you have an isActive flag)
      const allUsers = await this.usersService.findAll();

      // 2. Prepare the message
      const discountText =
        createCouponDto.discountType === 'percentage'
          ? `${createCouponDto.discountValue}%`
          : `$${createCouponDto.discountValue}`;

      const message = `🎉 New Coupon Alert! Use code ${savedCoupon.code} to get ${discountText} OFF! Valid until ${new Date(savedCoupon.validUntil).toLocaleDateString()}.`;

      // 3. Send notification to each user (excluding admin/creator if desired, but notifying all is fine)
      // Ideally use a queue for mass notifications, but looping is okay for small scale
      for (const user of allUsers) {
        await this.notificationsService.create(
          user._id.toString(),
          message,
          'promotion',
        );
      }
    } catch (error) {
      console.error('Failed to send coupon notifications:', error);
      // Don't fail the request, just log error
    }

    return savedCoupon;
  }

  async findAll(filters?: {
    status?: CouponStatus;
    isActive?: boolean;
    discountType?: DiscountType;
  }): Promise<CouponDocument[]> {
    const query: any = {};

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters?.discountType) {
      query.discountType = filters.discountType;
    }

    return this.couponModel
      .find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<CouponDocument> {
    const coupon = await this.couponModel
      .findById(id)
      .populate('createdBy', 'name email')
      .populate('applicableCategories', 'name')
      .populate('applicableProducts', 'title')
      .exec();

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  async findByCode(code: string): Promise<CouponDocument> {
    const coupon = await this.couponModel
      .findOne({ code: code.toUpperCase() })
      .populate('applicableCategories', 'name')
      .populate('applicableProducts', 'title')
      .exec();

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  async update(
    id: string,
    updateCouponDto: UpdateCouponDto,
  ): Promise<CouponDocument> {
    // Validate dates if being updated
    if (updateCouponDto.validFrom && updateCouponDto.validUntil) {
      if (
        new Date(updateCouponDto.validFrom) >=
        new Date(updateCouponDto.validUntil)
      ) {
        throw new BadRequestException(
          'Valid from date must be before valid until date',
        );
      }
    }

    const updateData: any = { ...updateCouponDto };

    if (updateCouponDto.code) {
      updateData.code = updateCouponDto.code.toUpperCase();
    }

    if (updateCouponDto.applicableCategories) {
      updateData.applicableCategories =
        updateCouponDto.applicableCategories.map(
          (id) => new Types.ObjectId(id),
        );
    }

    if (updateCouponDto.applicableProducts) {
      updateData.applicableProducts = updateCouponDto.applicableProducts.map(
        (id) => new Types.ObjectId(id),
      );
    }

    if (updateCouponDto.applicableUsers) {
      updateData.applicableUsers = updateCouponDto.applicableUsers.map(
        (id) => new Types.ObjectId(id),
      );
    }

    const coupon = await this.couponModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  async remove(id: string): Promise<void> {
    const result = await this.couponModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Coupon not found');
    }
  }

  async validateCoupon(
    validateDto: ValidateCouponDto,
    userId: string,
  ): Promise<{
    valid: boolean;
    message?: string;
    discount?: number;
    coupon?: CouponDocument;
  }> {
    const coupon = await this.findByCode(validateDto.code);

    // Check if coupon is active
    if (!coupon.isActive || coupon.status !== CouponStatus.ACTIVE) {
      return { valid: false, message: 'This coupon is not active' };
    }

    // Check date validity
    const now = new Date();
    if (now < new Date(coupon.validFrom)) {
      return { valid: false, message: 'This coupon is not yet valid' };
    }

    if (now > new Date(coupon.validUntil)) {
      // Auto-expire the coupon
      await this.couponModel.updateOne(
        { _id: coupon._id },
        { status: CouponStatus.EXPIRED },
      );
      return { valid: false, message: 'This coupon has expired' };
    }

    // Check usage limit
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return {
        valid: false,
        message: 'This coupon has reached its usage limit',
      };
    }

    // Check per-user usage limit
    const userUsageCount = coupon.usedBy.filter(
      (id) => id.toString() === userId,
    ).length;

    if (userUsageCount >= coupon.usageLimitPerUser) {
      return {
        valid: false,
        message:
          'You have already used this coupon the maximum number of times',
      };
    }

    // Check minimum purchase amount
    if (
      coupon.minPurchaseAmount > 0 &&
      validateDto.cartTotal < coupon.minPurchaseAmount
    ) {
      return {
        valid: false,
        message: `Minimum purchase amount of $${coupon.minPurchaseAmount} required`,
      };
    }

    // Check applicable categories
    if (coupon.applicableCategories.length > 0 && validateDto.categoryIds) {
      const hasApplicableCategory = validateDto.categoryIds.some((catId) =>
        coupon.applicableCategories.some(
          (appCat) => appCat.toString() === catId,
        ),
      );

      if (!hasApplicableCategory) {
        return {
          valid: false,
          message: 'This coupon is not applicable to items in your cart',
        };
      }
    }

    // Check applicable products
    if (coupon.applicableProducts.length > 0 && validateDto.productIds) {
      const hasApplicableProduct = validateDto.productIds.some((prodId) =>
        coupon.applicableProducts.some(
          (appProd) => appProd.toString() === prodId,
        ),
      );

      if (!hasApplicableProduct) {
        return {
          valid: false,
          message: 'This coupon is not applicable to items in your cart',
        };
      }
    }

    // Check applicable users
    if (coupon.applicableUsers.length > 0) {
      const isApplicableUser = coupon.applicableUsers.some(
        (appUser) => appUser.toString() === userId,
      );

      if (!isApplicableUser) {
        return {
          valid: false,
          message: 'This coupon is not available for your account',
        };
      }
    }

    // Calculate discount
    let discount = 0;

    switch (coupon.discountType) {
      case DiscountType.PERCENTAGE:
        discount = (validateDto.cartTotal * coupon.discountValue) / 100;
        if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
          discount = coupon.maxDiscountAmount;
        }
        break;

      case DiscountType.FIXED:
        discount = Math.min(coupon.discountValue, validateDto.cartTotal);
        break;

      case DiscountType.FREE_SHIPPING:
        // This would be handled separately in the order calculation
        discount = 0;
        break;

      case DiscountType.BOGO:
        // This would require more complex logic based on cart items
        discount = 0;
        break;
    }

    return {
      valid: true,
      message: 'Coupon applied successfully',
      discount: Math.round(discount * 100) / 100,
      coupon,
    };
  }

  async applyCoupon(couponId: string, userId: string): Promise<CouponDocument> {
    const coupon = await this.couponModel.findById(couponId);

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    // Increment usage count
    coupon.usedCount += 1;
    coupon.usedBy.push(new Types.ObjectId(userId));

    return coupon.save();
  }

  async getActiveCoupons(): Promise<CouponDocument[]> {
    const now = new Date();

    return this.couponModel
      .find({
        isActive: true,
        status: CouponStatus.ACTIVE,
        validFrom: { $lte: now },
        validUntil: { $gte: now },
        $or: [
          { usageLimit: 0 },
          { $expr: { $lt: ['$usedCount', '$usageLimit'] } },
        ],
      })
      .select('-usedBy -createdBy')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findMyCoupons(userId: string): Promise<CouponDocument[]> {
    const now = new Date();
    return this.couponModel
      .find({
        applicableUsers: new Types.ObjectId(userId), // Checks if userId is in the array
        validUntil: { $gte: now },
        status: { $ne: CouponStatus.EXPIRED },
        // Optionally only unused ones?
        // usedCount: { $lt: 1 } (since unique coupons are usageLimit: 1)
        $expr: { $lt: ['$usedCount', '$usageLimit'] }, // Safer check
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getCouponStats(couponId: string): Promise<{
    totalUsage: number;
    uniqueUsers: number;
    remainingUses: number;
    conversionRate: number;
  }> {
    const coupon = await this.findOne(couponId);

    const uniqueUsers = new Set(coupon.usedBy.map((id) => id.toString())).size;
    const remainingUses =
      coupon.usageLimit > 0
        ? Math.max(0, coupon.usageLimit - coupon.usedCount)
        : Infinity;

    return {
      totalUsage: coupon.usedCount,
      uniqueUsers,
      remainingUses: remainingUses === Infinity ? -1 : remainingUses,
      conversionRate: 0, // This would require order data
    };
  }
}
