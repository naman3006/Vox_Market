import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  GamificationProfile,
  GamificationProfileDocument,
} from './schemas/gamification-profile.schema';
import {
  GamificationActivity,
  GamificationActivityDocument,
} from './schemas/gamification-activity.schema';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { User } from '../auth/schemas/user.schema';

@Injectable()
export class GamificationService {
  constructor(
    @InjectModel(GamificationProfile.name)
    private gamificationModel: Model<GamificationProfileDocument>,
    @InjectModel(GamificationActivity.name)
    private activityModel: Model<GamificationActivityDocument>,
    private loyaltyService: LoyaltyService,
  ) { }

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

      await this.logActivity(
        userId,
        'reached',
        `${pointsAwarded} Points (Streak ${profile.currentStreak})`,
        'CHECKIN',
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
        throw new BadRequestException('Already spin today!');
      }
    }
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

      await this.logActivity(
        userId,
        'won',
        `${selectednodes.value} Points`,
        'SPIN',
      );
    }
    await profile.save();

    return {
      result: selectednodes,
      profile,
    };
  }

  async scratchCard(userId: string) {
    const profile = await this.getProfile(userId);
    const now = new Date();

    if (profile.lastScratchDate) {
      const lastScratch = new Date(profile.lastScratchDate);
      if (
        now.getDate() === lastScratch.getDate() &&
        now.getMonth() === lastScratch.getMonth() &&
        now.getFullYear() === lastScratch.getFullYear()
      ) {
        throw new BadRequestException('Already scratched today!');
      }
    }

    // Scratch Logic
    const rewards = [
      { label: '100 Points', value: 100, prob: 0.05 },
      { label: '50 Points', value: 50, prob: 0.1 },
      { label: '20 Points', value: 20, prob: 0.2 },
      { label: '10 Points', value: 10, prob: 0.3 },
      { label: 'Better luck next time', value: 0, prob: 0.35 },
    ];

    const rand = Math.random();
    let cumulative = 0;
    let selectedReward = rewards[rewards.length - 1];

    for (const reward of rewards) {
      cumulative += reward.prob;
      if (rand <= cumulative) {
        selectedReward = reward;
        break;
      }
    }

    profile.lastScratchDate = now;
    if (selectedReward.value > 0) {
      profile.lifetimePoints =
        (profile.lifetimePoints || 0) + selectedReward.value;
      await this.loyaltyService.addPoints(
        userId,
        selectedReward.value,
        `Scratch Card Reward`,
      );

      await this.logActivity(
        userId,
        'scratched',
        `${selectedReward.value} Points`,
        'SCRATCH',
      );
    }
    await profile.save();

    return {
      result: selectedReward,
      profile,
    };
  }

  async getLeaderboard() {
    return this.gamificationModel
      .find()
      .sort({ lifetimePoints: -1 })
      .limit(10)
      .populate('user', 'name avatar')
      .exec();
  }

  async logActivity(
    userId: string,
    action: string,
    details: string,
    type: string,
  ) {
    try {
      await this.activityModel.create({
        user: userId,
        action,
        details,
        type,
      });
    } catch (error) {
      console.error('Error logging gamification activity:', error);
    }
  }

  async getRecentActivities() {
    const activities = await this.activityModel
      .find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('user', 'name avatar')
      .exec();

    // Format for frontend
    return activities.map((activity) => {
      let userName = 'Unknown';
      if (activity.user && (activity.user as any).name) {
        const nameParts = (activity.user as any).name.split(' ');
        userName = nameParts.length > 1
          ? `${nameParts[0]} ${nameParts[1].charAt(0)}.`
          : nameParts[0];
      }

      return {
        user: userName,
        action: activity.action,
        reward: activity.details,
        time: activity.createdAt,
      };
    });
  }
}
