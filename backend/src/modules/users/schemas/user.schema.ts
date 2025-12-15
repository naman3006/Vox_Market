import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '../../../common/enums/user-role.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ enum: UserRole, default: UserRole.user })
  role: UserRole;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Address' }] })
  addresses: Types.ObjectId[];

  @Prop({ nullable: true, select: false })
  twoFactorAuthenticationSecret: string;

  @Prop({ default: false })
  isTwoFactorEnabled: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

/** Add virtual id field */
UserSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

UserSchema.set('toJSON', {
  virtuals: true,
});
