import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserActivity, UserActivityDocument } from './schemas/user-activity.schema';

@Injectable()
export class UserActivityService {
    constructor(
        @InjectModel(UserActivity.name)
        private userActivityModel: Model<UserActivityDocument>,
    ) { }

    async logActivity(
        userId: string,
        action: string,
        description: string,
        req?: any,
        metadata?: Record<string, any>,
    ) {
        let ipAddress = '';
        let userAgent = '';

        if (req) {
            ipAddress = req.ip || req.connection?.remoteAddress || '';
            userAgent = req.headers?.['user-agent'] || '';
        }

        try {
            await this.userActivityModel.create({
                user: userId,
                action,
                description,
                ipAddress,
                userAgent,
                metadata,
            });
        } catch (error) {
            console.error('Failed to log user activity', error);
            // Don't throw error to avoid blocking the main action
        }
    }

    async getUserActivities(userId: string, limit = 50) {
        return this.userActivityModel
            .find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();
    }
}
