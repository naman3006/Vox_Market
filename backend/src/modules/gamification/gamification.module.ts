import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import {
  GamificationProfile,
  GamificationProfileSchema,
} from './schemas/gamification-profile.schema';
import {
  GamificationActivity,
  GamificationActivitySchema,
} from './schemas/gamification-activity.schema';
import { LoyaltyModule } from '../loyalty/loyalty.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GamificationProfile.name, schema: GamificationProfileSchema },
      { name: GamificationActivity.name, schema: GamificationActivitySchema },
    ]),
    LoyaltyModule,
  ],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule { }
