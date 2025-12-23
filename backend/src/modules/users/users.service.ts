import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';

import { UserActivityService } from '../user-activity/user-activity.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly userActivityService: UserActivityService,
  ) { }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByIdWithPassword(id: string): Promise<UserDocument> {
    return this.userModel.findById(id).select('+password').exec();
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    try {
      const user = await this.userModel
        .findByIdAndUpdate(id, updateUserDto, { new: true })
        .exec();
      if (!user) throw new NotFoundException('User not found');
      if (!user) throw new NotFoundException('User not found');

      // Log Activity
      await this.userActivityService.logActivity(
        id,
        'PROFILE_UPDATE',
        'User profile updated',
      );

      return user;
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException('Email already in use');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0)
      throw new NotFoundException('User not found');
  }

  async setTwoFactorAuthenticationSecret(secret: string, userId: string) {
    return this.userModel.findByIdAndUpdate(userId, {
      twoFactorAuthenticationSecret: secret,
    });
  }

  async turnOnTwoFactorAuthentication(userId: string) {
    return this.userModel.findByIdAndUpdate(userId, {
      isTwoFactorEnabled: true,
    }).then(async (user) => {
      await this.userActivityService.logActivity(userId, '2FA_ENABLED', 'Two-factor authentication enabled');
      return user;
    });
  }

  async findByIdWith2FASecret(id: string): Promise<UserDocument> {
    return this.userModel
      .findById(id)
      .select('+twoFactorAuthenticationSecret')
      .exec();
  }

  async turnOffTwoFactorAuthentication(userId: string) {
    return this.userModel.findByIdAndUpdate(userId, {
      isTwoFactorEnabled: false,
      twoFactorAuthenticationSecret: null,
    }).then(async (user) => {
      await this.userActivityService.logActivity(userId, '2FA_DISABLED', 'Two-factor authentication disabled');
      return user;
    });
  }
}
