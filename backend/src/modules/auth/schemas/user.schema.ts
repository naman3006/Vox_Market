import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '../../../common/enums/user-role.enum';

export enum LoyaltyTier {
  BRONZE = 'Bronze',
  SILVER = 'Silver',
  GOLD = 'Gold',
}

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ enum: UserRole, default: UserRole.user })
  role: UserRole;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Address' }] })
  addresses: Types.ObjectId[];

  @Prop({ default: 0 })
  loginAttempts: number;

  @Prop({ default: null })
  avatar: string;

  @Prop({ default: null })
  phone: string;

  @Prop({ default: null })
  resetPasswordOtp: string | null;

  @Prop({ type: Date, default: null })
  resetPasswordExpires: Date | null;

  @Prop({ default: 0 })
  resetPasswordAttempts: number;

  @Prop({ type: Date, default: null })
  lockUntil: Date | null;

  @Prop({ nullable: true, select: false })
  twoFactorAuthenticationSecret: string;

  @Prop({ default: false })
  isTwoFactorEnabled: boolean;

  // Loyalty System
  @Prop({ default: 0 })
  loyaltyPoints: number;

  @Prop({ enum: LoyaltyTier, default: LoyaltyTier.BRONZE })
  loyaltyTier: LoyaltyTier;

  @Prop({ default: 0 })
  totalPointsEarned: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
