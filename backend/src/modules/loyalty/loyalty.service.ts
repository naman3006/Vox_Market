import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, LoyaltyTier } from '../auth/schemas/user.schema';
import { Coupon, CouponDocument } from '../coupons/schemas/coupon.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { GamificationProfile, GamificationProfileDocument } from '../gamification/schemas/gamification-profile.schema';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
    @InjectModel(GamificationProfile.name) private gamificationModel: Model<GamificationProfileDocument>,
    private notificationsService: NotificationsService,
  ) { }

  // Calculate points based on order amount and user tier
  calculatePoints(amount: number, tier: LoyaltyTier): number {
    let multiplier = 1;
    switch (tier) {
      case LoyaltyTier.SILVER:
        multiplier = 1.2;
        break;
      case LoyaltyTier.GOLD:
        multiplier = 1.5;
        break;
      default:
        multiplier = 1;
    }
    return Math.floor(amount * multiplier);
  }

  // Award points to a user
  async awardPoints(userId: string, amount: number): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const points = this.calculatePoints(amount, user.loyaltyTier);

    user.loyaltyPoints += points;
    user.totalPointsEarned += points;

    await this.checkAndUpgradeTier(user);

    return user.save();
  }



  async addPoints(userId: string, amount: number, reason?: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    user.loyaltyPoints += amount;
    user.totalPointsEarned += amount;

    await this.checkAndUpgradeTier(user);
    await user.save();

    // SYNC with Gamification Profile
    try {
      await this.gamificationModel.findOneAndUpdate(
        { user: userId },
        { $inc: { points: amount, lifetimePoints: amount } },
        { upsert: true }
      );
    } catch (err) {
      console.error("Failed to sync gamification profile", err);
    }

    if (reason) {
      try {
        await this.notificationsService.create(
          userId,
          `You earned ${amount} points: ${reason}`,
          'system',
        );
      } catch (e) {
        console.error(e);
      }
    }

    return user;
  }

  // Check if user qualifies for a tier upgrade
  private async checkAndUpgradeTier(user: UserDocument) {
    let newTier = user.loyaltyTier;

    // Thresholds: Silver (500), Gold (2000)
    if (user.totalPointsEarned >= 2000) {
      newTier = LoyaltyTier.GOLD;
    } else if (user.totalPointsEarned >= 500) {
      newTier = LoyaltyTier.SILVER;
    } else {
      newTier = LoyaltyTier.BRONZE;
    }

    if (newTier !== user.loyaltyTier) {
      user.loyaltyTier = newTier;
      // Notify user about tier upgrade
      try {
        await this.notificationsService.create(
          user._id.toString(),
          `Congratulations! You've been upgraded to ${newTier} Tier! Enjoy ${newTier === LoyaltyTier.GOLD ? '1.5x' : '1.2x'} points on future purchases.`,
          'system',
        );
      } catch (error) {
        console.error('Failed to send tier upgrade notification:', error);
      }
    }
  }

  // Get loyalty status
  async getLoyaltyStatus(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('loyaltyPoints loyaltyTier totalPointsEarned name email');
    if (!user) throw new NotFoundException('User not found');

    let nextTierPoints = 0;
    let nextTier = '';

    if (user.loyaltyTier === LoyaltyTier.BRONZE) {
      nextTierPoints = 500 - user.totalPointsEarned;
      nextTier = LoyaltyTier.SILVER;
    } else if (user.loyaltyTier === LoyaltyTier.SILVER) {
      nextTierPoints = 2000 - user.totalPointsEarned;
      nextTier = LoyaltyTier.GOLD;
    }

    return {
      points: user.loyaltyPoints,
      tier: user.loyaltyTier,
      totalEarned: user.totalPointsEarned,
      nextTier: nextTier || 'Max Tier',
      pointsToNextTier: Math.max(0, nextTierPoints),
    };
  }

  // Redeem points for a coupon
  async redeemPoints(
    userId: string,
    couponId: string,
  ): Promise<{ user: User; coupon: Coupon }> {
    const user = await this.userModel.findById(userId);
    const coupon = await this.couponModel.findById(couponId);

    if (!user) throw new NotFoundException('User not found');
    if (!coupon) throw new NotFoundException('Coupon not found');

    if (!coupon.costInPoints || coupon.costInPoints <= 0) {
      throw new BadRequestException(
        'This coupon is not redeemable with points',
      );
    }

    if (user.loyaltyPoints < coupon.costInPoints) {
      throw new BadRequestException('Insufficient points');
    }

    // Deduct points
    user.loyaltyPoints -= coupon.costInPoints;
    user.totalPointsEarned = user.totalPointsEarned; // No change to total earned

    await user.save();

    // Sync Game Profile
    try {
      await this.gamificationModel.findOneAndUpdate(
        { user: userId },
        { $inc: { points: -coupon.costInPoints } }
      );
    } catch (e) {
      console.error('Failed to sync game profile on redeem', e);
    }

    // CREATE UNIQUE COUPON FOR USER
    // Format: CODE-USERI-RAND
    const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const userSuffix = userId.substring(userId.length - 4).toUpperCase();
    const newCode = `${coupon.code}-${userSuffix}${uniqueSuffix}`;

    const newCoupon = new this.couponModel({
      code: newCode,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      costInPoints: 0, // Already paid
      minPurchaseAmount: coupon.minPurchaseAmount,
      maxDiscountAmount: coupon.maxDiscountAmount,
      validFrom: new Date(),
      validUntil: coupon.validUntil, // Or extend? Let's keep original validity or give 30 days
      usageLimit: 1,
      usageLimitPerUser: 1,
      usedCount: 0,
      applicableUsers: [new Types.ObjectId(userId)], // Locked to this user
      applicableCategories: coupon.applicableCategories,
      applicableProducts: coupon.applicableProducts,
      status: 'active',
      isActive: true,
      createdBy: coupon.createdBy,
      notes: `Redeemed with points from ${coupon.code}`
    });

    await newCoupon.save();

    // Notify User
    try {
      await this.notificationsService.create(
        userId,
        `You redeemed ${coupon.description}! Your code is ${newCode}`,
        'system',
      );
    } catch (e) {
      console.error(e);
    }

    return { user, coupon: newCoupon };
  }
}
