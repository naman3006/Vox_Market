import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { ConfigModule } from '@nestjs/config';
import { CartModule } from '../cart/cart.module';
import { WishlistModule } from '../wishlist/wishlist.module';
import { CouponsModule } from '../coupons/coupons.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule,
    OrdersModule,
    ProductsModule,
    CartModule,
    WishlistModule,
    CouponsModule,
    UsersModule,
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService],
})
export class ChatbotModule {}
