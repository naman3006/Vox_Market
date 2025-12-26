/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User as UserSchema, UserDocument } from '../schemas/user.schema';
import { User } from '../../../common/interfaces/user.interface';
import { jwtConfig } from '../../../config/jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectModel(UserSchema.name) private userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret as string,
    });
  }

  async validate(payload: any): Promise<User> {
    const user = await this.userModel.findById(payload.sub).exec();
    if (!user) return null;

    // Return full user object (as plain object)
    const userObj = user.toObject();
    return {
      ...userObj,
      id: userObj._id.toString(),
    };
  }
}
