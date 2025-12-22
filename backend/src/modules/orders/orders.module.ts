import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderSchema } from './schemas/order.schema';
import { ProductSchema } from '../products/schemas/product.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { OrdersListener } from './orders.listener';
import { OrderEventsListener } from './order-events.listener';
import { MailModule } from '../mail/mail.module';
import { CouponsModule } from '../coupons/coupons.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { SocialProofModule } from '../social-proof/social-proof.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Order', schema: OrderSchema },
      { name: 'Product', schema: ProductSchema },
    ]),
    NotificationsModule,
    UsersModule,
    MailModule,
    CouponsModule,
    LoyaltyModule,
    SocialProofModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersListener, OrderEventsListener],
  exports: [OrdersService],
})
export class OrdersModule {}
