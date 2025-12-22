import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationGateway } from '../notifications/notification.gateway';

@Injectable()
export class OrdersListener {
  private readonly logger = new Logger(OrdersListener.name);

  constructor(
    @InjectModel('User') private userModel: Model<any>,
    private notificationGateway: NotificationGateway,
  ) {}

  @OnEvent('order.paid', { async: true })
  async handleOrderPaid(payload: { orderId: string; paymentId?: string }) {
    try {
      // Notify all admin users so they can process/assign the order
      const admins = await this.userModel.find({ role: 'admin' }).lean().exec();
      const message = {
        type: 'ORDER_PAID',
        payload,
      };
      admins.forEach((admin) => {
        this.notificationGateway.sendNotificationToUser(
          admin._id.toString(),
          message,
        );
      });
      this.logger.log(
        `Notified ${admins.length} admin(s) about paid order ${payload.orderId}`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to notify admins for order.paid: ${err.message}`,
      );
    }
  }
}
