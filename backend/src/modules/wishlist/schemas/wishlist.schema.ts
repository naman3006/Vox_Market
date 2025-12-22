import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WishlistDocument = Wishlist & Document;

@Schema()
export class Wishlist {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ default: 'My Wishlist' })
  name: string;

  @Prop({ enum: ['private', 'public'], default: 'private' })
  privacy: string;

  @Prop({ unique: true, sparse: true })
  shareToken: string;

  @Prop({
    type: [
      {
        productId: { type: Types.ObjectId, ref: 'Product', required: true },
        isBought: { type: Boolean, default: false },
        boughtBy: { type: String, default: null }, // Name of the person who bought it (User or Guest)
        addedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  items: {
    productId: Types.ObjectId;
    isBought: boolean;
    boughtBy: string | null;
    addedAt: Date;
  }[];
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);
