import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SocialProofService } from './social-proof.service';
import { SocialProofGateway } from './social-proof.gateway';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { ProductSchema } from '../products/schemas/product.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Order.name, schema: OrderSchema },
            { name: 'Product', schema: ProductSchema }
        ])
    ],
    providers: [SocialProofService, SocialProofGateway],
    exports: [SocialProofService, SocialProofGateway],
})
export class SocialProofModule { }
