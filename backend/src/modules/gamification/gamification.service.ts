import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  GamificationProfile,
  GamificationProfileDocument,
} from './schemas/gamification-profile.schema';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { User } from '../auth/schemas/user.schema';

@Injectable()
export class GamificationService {
  constructor(
    @InjectModel(GamificationProfile.name)
    private gamificationModel: Model<GamificationProfileDocument>,
    private loyaltyService: LoyaltyService,
  ) {}

  async getProfile(userId: string): Promise<GamificationProfileDocument> {
    let profile = await this.gamificationModel.findOne({ user: userId });
    if (!profile) {
      profile = await this.gamificationModel.create({ user: userId });
    }
    return profile;
  }

  async checkIn(userId: string) {
    const profile = await this.getProfile(userId);
    const now = new Date();
    const lastCheckIn = profile.lastCheckIn
      ? new Date(profile.lastCheckIn)
      : null;

    let pointsAwarded = 0;
    const message = 'Check-in successful!';

    if (!lastCheckIn) {
      // First ever check-in
      profile.currentStreak = 1;
      profile.highestStreak = 1;
      pointsAwarded = 10;
    } else {
      const diffTime = Math.abs(now.getTime() - lastCheckIn.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Check if it's the same day
      const isSameDay =
        now.getDate() === lastCheckIn.getDate() &&
        now.getMonth() === lastCheckIn.getMonth() &&
        now.getFullYear() === lastCheckIn.getFullYear();

      if (isSameDay) {
        return {
          profile,
          pointsAwarded: 0,
          message: 'Already checked in today.',
        };
      }

      // Check if it's consecutive (yesterday)
      const isConsecutive =
        now.getTime() - lastCheckIn.getTime() < 48 * 60 * 60 * 1000 &&
        !isSameDay;
      // Simplified: if diffDays is roughly 1. Better logic: check if lastCheckIn was "yesterday"
      // Let's use simplified day diff for reliability across timezones (UTC stored)

      // Proper way: set hours to 0
      const today = new Date(now).setHours(0, 0, 0, 0);
      const last = new Date(lastCheckIn).setHours(0, 0, 0, 0);
      const oneDay = 24 * 60 * 60 * 1000;

      if (today - last === oneDay) {
        // Consecutive
        profile.currentStreak += 1;
        if (profile.currentStreak > profile.highestStreak) {
          profile.highestStreak = profile.currentStreak;
        }
        // Bonus points for streaks
        pointsAwarded = 10 + profile.currentStreak * 5; // 15, 20, 25...
        if (pointsAwarded > 100) pointsAwarded = 100; // Cap
      } else {
        // Broken streak
        profile.currentStreak = 1;
        pointsAwarded = 10;
      }
    }

    profile.lastCheckIn = now;
    profile.lifetimePoints = (profile.lifetimePoints || 0) + pointsAwarded;
    await profile.save();

    if (pointsAwarded > 0) {
      await this.loyaltyService.addPoints(
        userId,
        pointsAwarded,
        `Daily Check-In (Streak: ${profile.currentStreak})`,
      );
    }

    return {
      profile,
      pointsAwarded,
      message: `You earned ${pointsAwarded} points!`,
    };
  }

  async spinWheel(userId: string) {
    const profile = await this.getProfile(userId);
    const now = new Date();

    if (profile.lastSpinDate) {
      const lastSpin = new Date(profile.lastSpinDate);
      if (
        now.getDate() === lastSpin.getDate() &&
        now.getMonth() === lastSpin.getMonth() &&
        now.getFullYear() === lastSpin.getFullYear()
      ) {
        throw new BadRequestException('Already spun today!');
      }
    }

    // Spin Logic
    // Rewards: { label: string, value: number (points), probability: number (0-1) }
    const rewards = [
      { label: '50 Points', value: 50, prob: 0.1 },
      { label: '20 Points', value: 20, prob: 0.2 },
      { label: '10 Points', value: 10, prob: 0.3 },
      { label: '5 Points', value: 5, prob: 0.3 },
      { label: 'Try Again', value: 0, prob: 0.1 },
    ];

    const rand = Math.random();
    let cumulative = 0;
    let selectednodes = rewards[rewards.length - 1];

    for (const reward of rewards) {
      cumulative += reward.prob;
      if (rand <= cumulative) {
        selectednodes = reward;
        break;
      }
    }

    profile.lastSpinDate = now;
    if (selectednodes.value > 0) {
      profile.lifetimePoints =
        (profile.lifetimePoints || 0) + selectednodes.value;
      await this.loyaltyService.addPoints(
        userId,
        selectednodes.value,
        `Spin Wheel Reward`,
      );
    }
    await profile.save();

    return {
      result: selectednodes,
      profile,
    };
  }

  async getLeaderboard() {
    // Return top 10 users by lifetimePoints or just sync with Loyalty points
    // Since we just started tracking lifetimePoints in this module, it might be 0 for old users.
    // Better to query the User model directly via LoyaltyService or if we sync them.
    // For now, let's query the GamificationProfile, assuming active users will generate data.
    return this.gamificationModel
      .find()
      .sort({ lifetimePoints: -1 })
      .limit(10)
      .populate('user', 'firstName lastName avatar')
      .exec();
  }
}
