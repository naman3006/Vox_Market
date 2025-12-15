// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AddressModule } from './modules/address/address.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { FilesModule } from './modules/files/files.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';


import { LoyaltyModule } from './modules/loyalty/loyalty.module';

@Module({
  imports: [
    LoyaltyModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost/ecommerce-new-features',
    ),
    EventEmitterModule.forRoot(),
    // Feature Modules
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    AddressModule,
    ReviewsModule,
    NotificationsModule,
    AdminModule,
    WishlistModule,
    CouponsModule,
    AnalyticsModule,
    FilesModule,
    RecommendationsModule,
    ChatbotModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
