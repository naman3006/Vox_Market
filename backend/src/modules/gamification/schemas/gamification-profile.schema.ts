import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';

export type GamificationProfileDocument = GamificationProfile & Document;

@Schema({ timestamps: true })
export class GamificationProfile {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  user: User;

  @Prop({ default: 0 })
  points: number; 

  @Prop({ default: 0 })
  lifetimePoints: number; 

  @Prop({ default: 0 })
  currentStreak: number;

  @Prop({ default: 0 })
  highestStreak: number;

  @Prop()
  lastCheckIn: Date;

  @Prop()
  lastSpinDate: Date;

  @Prop()
  lastScratchDate: Date;
}

export const GamificationProfileSchema = SchemaFactory.createForClass(GamificationProfile);
