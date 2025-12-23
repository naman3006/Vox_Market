import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '@/config/jwt.config';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailModule } from '../mail/mail.module';
import { TwoFactorAuthenticationController } from './2fa.controller';
import { TwoFactorAuthenticationService } from './2fa.service';
import { UsersModule } from '../users/users.module';
import { ConfigModule } from '@nestjs/config';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { UserActivityModule } from '../user-activity/user-activity.module';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    JwtModule.register(jwtConfig),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MailModule,
    UsersModule,
    LoyaltyModule,
    UserActivityModule,
  ],
  controllers: [AuthController, TwoFactorAuthenticationController],
  providers: [AuthService, JwtStrategy, TwoFactorAuthenticationService],
  exports: [AuthService, TwoFactorAuthenticationService],
})
export class AuthModule { }
