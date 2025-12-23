import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Coupon, CouponSchema } from '../coupons/schemas/coupon.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { GamificationProfile, GamificationProfileSchema } from '../gamification/schemas/gamification-profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: GamificationProfile.name, schema: GamificationProfileSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule { }
