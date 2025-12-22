import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private notificationGateway: NotificationGateway,
  ) {}

  async create(
    userId: string,
    message: string,
    type: string = 'order',
  ): Promise<NotificationDocument> {
    const notification = new this.notificationModel({
      userId: new Types.ObjectId(userId),
      message,
      type,
    });
    const savedNotification = await notification.save();

    // Send real-time notification
    this.notificationGateway.sendNotificationToUser(userId, savedNotification);

    return savedNotification;
  }

  async findAll(userId: string): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAsRead(id: string, userId: string): Promise<NotificationDocument> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid notification ID');
    }

    const notification = await this.notificationModel
      .findOneAndUpdate(
        { _id: id, userId: new Types.ObjectId(userId) },
        { read: true },
        { new: true },
      )
      .exec();
    if (!notification) throw new NotFoundException('Notification not found');
    return notification;
  }
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel
      .updateMany(
        { userId: new Types.ObjectId(userId), read: false },
        { read: true },
      )
      .exec();
  }

  sendRealTimeUpdate(userId: string, event: string, payload: any) {
    this.notificationGateway.server.to(userId).emit(event, payload);
  }

  sendToRole(role: string, event: string, payload: any) {
    this.notificationGateway.server.to(`role:${role}`).emit(event, payload);
  }
}
