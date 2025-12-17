import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuestionDocument = Question & Document;

@Schema({ timestamps: true })
export class Question {
    @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
    productId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    content: string;

    @Prop({
        type: [{
            userId: { type: Types.ObjectId, ref: 'User' },
            content: { type: String, required: true },
            role: { type: String, enum: ['user', 'admin'], default: 'user' },
            createdAt: { type: Date, default: Date.now }
        }],
        default: []
    })
    answers: {
        userId: Types.ObjectId;
        content: string;
        role: string;
        createdAt: Date;
    }[];

    @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
    upvotes: Types.ObjectId[];
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
