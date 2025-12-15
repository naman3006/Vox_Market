import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CouponDocument = Coupon & Document;

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
  BOGO = 'bogo', // Buy One Get One
  FREE_SHIPPING = 'free_shipping',
}

export enum CouponStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
}

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ required: true })
  description: string;

  @Prop({ enum: DiscountType, required: true })
  discountType: DiscountType;

  @Prop({ required: true, min: 0 })
  discountValue: number; // Percentage (0-100) or fixed amount

  @Prop({ min: 0 })
  costInPoints: number; // Points required to redeem this coupon

  @Prop({ min: 0, default: 0 })
  minPurchaseAmount: number; // Minimum cart value to apply coupon

  @Prop({ min: 0 })
  maxDiscountAmount: number; // Maximum discount cap (for percentage discounts)

  @Prop({ required: true })
  validFrom: Date;

  @Prop({ required: true })
  validUntil: Date;

  @Prop({ min: 0, default: 0 })
  usageLimit: number; // 0 = unlimited

  @Prop({ min: 0, default: 1 })
  usageLimitPerUser: number; // How many times one user can use this

  @Prop({ default: 0 })
  usedCount: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  usedBy: Types.ObjectId[]; // Track which users used this coupon

  @Prop({ enum: CouponStatus, default: CouponStatus.ACTIVE })
  status: CouponStatus;

  @Prop({ default: true })
  isActive: boolean;

  // Restrictions
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Category' }], default: [] })
  applicableCategories: Types.ObjectId[]; // Empty = all categories

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [] })
  applicableProducts: Types.ObjectId[]; // Empty = all products

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  applicableUsers: Types.ObjectId[]; // Empty = all users

  @Prop({ default: false })
  firstTimeUserOnly: boolean;

  // Metadata
  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop()
  notes: string; // Internal notes for admins
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

// Indexes
// CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index({ status: 1, isActive: 1 });
CouponSchema.index({ validFrom: 1, validUntil: 1 });
