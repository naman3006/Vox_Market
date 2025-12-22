import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ _id: false })
class ProductVariant {
  @Prop({ required: true })
  name: string;

  @Prop({ type: [String], required: true })
  options: string[];
}

@Schema({ _id: false })
class ProductSpecification {
  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  value: string;
}

@Schema({ _id: false })
class SEO {
  @Prop()
  metaTitle?: string;

  @Prop()
  metaDescription?: string;

  @Prop({ type: [String] })
  keywords?: string[];
}

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, index: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String })
  longDescription: string; // Rich text HTML content

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ min: 0 })
  discountPrice: number;

  @Prop({ type: Types.ObjectId, ref: 'Category', index: true, required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  sellerId: Types.ObjectId; // Owner of the product (seller)

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop()
  thumbnail: string; // Main product image URL

  @Prop({ index: true })
  brand: string;

  @Prop({ required: true, min: 0 })
  stock: number;

  @Prop({ default: 0, min: 0, max: 5 })
  rating: number;

  @Prop({ default: 0, min: 0 })
  soldCount: number;

  @Prop({ unique: true, sparse: true })
  sku: string; // Stock Keeping Unit

  @Prop({ min: 0 })
  weight: number; // in kg

  @Prop({ type: [ProductVariant], default: [] })
  variants: ProductVariant[];

  @Prop({ type: [ProductSpecification], default: [] })
  specifications: ProductSpecification[];

  @Prop({ type: [String], default: [], index: true })
  tags: string[];

  @Prop({ default: false, index: true })
  isFeatured: boolean;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ type: SEO })
  seo: SEO;

  @Prop()
  arModelUrl: string; // URL to the 3D model (.glb/.gltf)

  @Prop({
    type: String,
    enum: ['floor', 'wall'],
    default: 'floor',
  })
  arPlacement: string;

  @Prop({
    type: String,
    enum: ['in-stock', 'out-of-stock', 'pre-order'],
    default: 'in-stock',
  })
  stockStatus: string;

  @Prop({ default: 0 })
  viewCount: number; // Track product views

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Review' }] })
  reviews: Types.ObjectId[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Add indexes for better query performance
ProductSchema.index({ title: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ price: 1, rating: -1 });
ProductSchema.index({ createdAt: -1 });
