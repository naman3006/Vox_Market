import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type OrderDocument = Order & Document;

export enum OrderStatus {
  pending = 'pending',
  confirmed = 'confirmed',
  processing = 'processing',
  shipped = 'shipped',
  delivered = 'delivered',
  cancelled = 'cancelled',
}

export enum PaymentStatus {
  pending = 'pending',
  paid = 'paid',
  failed = 'failed',
  refunded = 'refunded',
}

export enum ReturnStatus {
  none = 'none',
  requested = 'requested',
  approved = 'approved',
  rejected = 'rejected',
  completed = 'completed',
}

@Schema({ _id: false })
class StatusHistory {
  @Prop({ enum: OrderStatus, required: true })
  status: OrderStatus;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;

  @Prop()
  note: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;
}

@Schema()
class OrderItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product' })
  productId: Types.ObjectId;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  price: number;

  @Prop()
  productName: string; // Store product name at time of order

  @Prop()
  productImage: string; // Store product image at time of order
}

const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class ShippingAddress {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  addressLine: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  postalCode: string;

  @Prop({ required: true })
  country: string;

  @Prop({ required: true })
  phone: string;
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], default: [] })
  items: OrderItem[];

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ default: 0 })
  subtotal: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ default: 0 })
  shippingCost: number;

  @Prop({ default: 0 })
  tax: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Coupon' })
  appliedCoupon: Types.ObjectId;

  @Prop()
  couponCode: string;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.pending })
  paymentStatus: PaymentStatus;

  @Prop({ enum: OrderStatus, default: OrderStatus.pending })
  orderStatus: OrderStatus;

  @Prop({ type: ShippingAddress, required: true })
  shippingAddress: ShippingAddress;

  @Prop({ type: Object })
  billingAddress: any;

  @Prop()
  trackingNumber: string;

  @Prop()
  courierService: string;

  @Prop()
  estimatedDelivery: Date;

  @Prop()
  actualDelivery: Date;

  @Prop({ type: [StatusHistory], default: [] })
  statusHistory: StatusHistory[];

  @Prop({ enum: ReturnStatus, default: ReturnStatus.none })
  returnStatus: ReturnStatus;

  @Prop()
  returnReason: string;

  @Prop()
  returnRequestedAt: Date;

  @Prop({ default: 0 })
  refundAmount: number;

  @Prop()
  paymentMethod: string;

  @Prop()
  paymentTransactionId: string;

  @Prop()
  customerNotes: string;

  @Prop()
  internalNotes: string;

  @Prop()
  customerPhone: string;

  @Prop()
  customerEmail: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Indexes for better query performance
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ trackingNumber: 1 });
OrderSchema.index({ createdAt: -1 });
