import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';

export type GamificationActivityDocument = GamificationActivity & Document;

@Schema({ timestamps: true })
export class GamificationActivity {
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'User',
        required: true,
    })
    user: User;

    @Prop({ required: true })
    action: string; // e.g. "won", "reached", "scratched"

    @Prop({ required: true })
    details: string; // e.g. "50 Points", "Silver Tier"

    @Prop({ required: true })
    type: string; // SPIN, SCRATCH, CHECKIN, LEVELUP

    @Prop({ default: Date.now })
    createdAt: Date;
}

export const GamificationActivitySchema = SchemaFactory.createForClass(GamificationActivity);
