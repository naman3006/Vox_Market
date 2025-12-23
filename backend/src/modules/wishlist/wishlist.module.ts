import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { ProductSchema } from '../products/schemas/product.schema';
import { WishlistSchema } from './schemas/wishlist.schema';
import { UserActivityModule } from '../user-activity/user-activity.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Wishlist', schema: WishlistSchema },
      { name: 'Product', schema: ProductSchema },
    ]),
    UserActivityModule,
  ],
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService],
})
export class WishlistModule { }
