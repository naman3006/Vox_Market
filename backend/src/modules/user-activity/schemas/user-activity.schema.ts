import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';

export type UserActivityDocument = UserActivity & Document;

@Schema({ timestamps: true })
export class UserActivity {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    user: User;

    @Prop({ required: true })
    action: string; // e.g. LOGIN, REGISTER, ORDER_PLACED, PROFILE_UPDATE

    @Prop({ required: true })
    description: string; // e.g. "Logged in from Chrome on Linux"

    @Prop()
    ipAddress: string;

    @Prop()
    userAgent: string;

    @Prop({ type: Object })
    metadata: Record<string, any>; // Flexible field for extra data (orderId, etc.)
}

export const UserActivitySchema = SchemaFactory.createForClass(UserActivity);
