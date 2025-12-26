/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { TwoFactorAuthenticationService } from './2fa.service';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User, UserDocument } from './schemas/user.schema';
import { User as UserInterface } from '../../common/interfaces/user.interface';
import { UserRole } from '../../common/enums/user-role.enum';
import { MailService } from '../mail/mail.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { UserActivityService } from '../user-activity/user-activity.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 10;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCK_TIME = 15 * 60 * 1000; // 15 minutes

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private mailService: MailService,
    private readonly twoFactorAuthenticationService: TwoFactorAuthenticationService,
    private readonly loyaltyService: LoyaltyService,
    private readonly userActivityService: UserActivityService,
  ) { }

  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: UserInterface; token: string }> {
    const { email, password, name } = registerDto;

    // Validate email format
    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Invalid email format');
    }

    // Check if user exists
    const existingUser = await this.userModel.findOne({
      email: email.toLowerCase(),
    });
    if (existingUser) {
      this.logger.warn(`Registration attempt with existing email: ${email}`);
      throw new ConflictException('Email already registered');
    }

    // Hash password with improved security
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    try {
      // Generate unique referral code
      const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      let referredBy = null;

      // Handle Referral
      if (registerDto.referralCode) {
        const referrer = await this.userModel.findOne({
          referralCode: registerDto.referralCode,
        });

        if (referrer) {
          referredBy = referrer._id;

          // Award Referrer Bonus (Await to ensure completion)
          try {
            await this.loyaltyService.addPoints(
              referrer._id.toString(),
              500,
              `Referral Bonus: ${name}`,
            );
            this.logger.log(`Awarded 500 points to referrer ${referrer._id}`);
          } catch (err) {
            this.logger.error(`Failed to award referral bonus: ${err.message}`);
          }
        } else {
          this.logger.warn(`Referral code not found: ${registerDto.referralCode}`);
        }
      }

      const userDoc = new this.userModel({
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name.trim(),
        role: UserRole.user,
        loginAttempts: 0,
        lockUntil: null,
        referralCode,
        referredBy,
      });
      await userDoc.save();

      // Award New User Welcome Bonus
      if (referredBy) {
        this.loyaltyService
          .addPoints(userDoc._id.toString(), 100, 'Welcome Bonus (Referred)')
          .catch((err) =>
            this.logger.error(`Failed to award welcome bonus: ${err.message}`),
          );
      }

      const token = this.generateToken(
        userDoc._id.toString(),
        userDoc.email,
        userDoc.role,
      );
      const userResponse = this.sanitizeUser(userDoc);

      this.logger.log(`User registered successfully: ${email}`);

      // Log Activity
      await this.userActivityService.logActivity(
        userDoc._id.toString(),
        'REGISTER',
        'User registered successfully',
      );

      return { user: userResponse, token };
    } catch (error) {
      this.logger.error(`Registration error: ${error.message}`);
      throw new BadRequestException('Failed to register user');
    }
  }

  async login(loginDto: LoginDto): Promise<{
    user: UserInterface;
    token?: string;
    isTwoFactorAuthenticationEnabled?: boolean;
  }> {
    const { email, password, twoFactorAuthenticationCode } = loginDto;

    const userDoc = await this.userModel
      .findOne({
        email: email.toLowerCase(),
      })
      .select(
        '+twoFactorAuthenticationSecret +password +isTwoFactorEnabled +lockUntil +loginAttempts',
      );

    if (!userDoc) {
      this.logger.warn(`Login attempt with non-existent email: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (userDoc.lockUntil && userDoc.lockUntil > new Date()) {
      throw new UnauthorizedException(
        'Account temporarily locked. Try again later.',
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userDoc.password);
    if (!isPasswordValid) {
      // Increment login attempts
      userDoc.loginAttempts = (userDoc.loginAttempts || 0) + 1;

      if (userDoc.loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        userDoc.lockUntil = new Date(Date.now() + this.LOCK_TIME);
        this.logger.warn(
          `Account locked due to multiple failed attempts: ${email}`,
        );
      }
      await userDoc.save();
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset login attempts on successful login
    if (userDoc.loginAttempts > 0) {
      userDoc.loginAttempts = 0;
      userDoc.lockUntil = null;
      await userDoc.save();
    }

    // Lazy Migration: Generate referral code if missing
    if (!userDoc.referralCode) {
      userDoc.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await userDoc.save();
      this.logger.log(`Generated missing referral code for user ${email}`);
    }

    if (userDoc.isTwoFactorEnabled) {
      // Generate and log the token for testing login
      const token = speakeasy.totp({
        secret: userDoc.twoFactorAuthenticationSecret,
        encoding: 'base32',
      });
      console.log(`[DEBUG] LOGIN 2FA CODE: ${token}`);

      if (!twoFactorAuthenticationCode) {
        // Send email with code
        const mailResult = await this.mailService.send2FACodeEmail(
          userDoc.email,
          token,
        );

        return {
          user: this.sanitizeUser(userDoc),
          isTwoFactorAuthenticationEnabled: true,
          // @ts-ignore
          twoFactorAuthUrl: mailResult.previewUrl,
        };
      }
      const isCodeValid =
        this.twoFactorAuthenticationService.isTwoFactorAuthenticationCodeValid(
          twoFactorAuthenticationCode,
          userDoc,
        );
      if (!isCodeValid) {
        throw new UnauthorizedException('Wrong authentication code');
      }
    }

    const token = this.generateToken(
      userDoc._id.toString(),
      userDoc.email,
      userDoc.role,
    );
    const userResponse = this.sanitizeUser(userDoc);

    this.logger.log(`User logged in successfully: ${email}`);

    await this.userActivityService.logActivity(
      userDoc._id.toString(),
      'LOGIN',
      'User logged in',
    );

    return { user: userResponse, token };
  }

  async logout(userId: string): Promise<void> {
    await this.userActivityService.logActivity(
      userId,
      'LOGOUT',
      'User logged out',
    );
  }

  private generateToken(userId: string, email: string, role: UserRole): string {
    const payload = {
      sub: userId,
      email,
      role,
      iat: Math.floor(Date.now() / 1000),
    };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(userDoc: UserDocument): UserInterface {
    return {
      id: userDoc._id.toString(),
      email: userDoc.email,
      role: userDoc.role,
      name: userDoc.name,
      isTwoFactorEnabled: userDoc.isTwoFactorEnabled,
      referralCode: userDoc.referralCode,
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  async forgotPassword(email: string): Promise<any> {
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = expires;
    user.resetPasswordAttempts = 0;
    await user.save();

    // Force email sending to next tick to guarantee non-blocking response
    setTimeout(() => {
      this.mailService
        .sendOtpEmail(user.email, otp)
        .then((mailResult) => {
          if (!mailResult.success) {
            this.logger.error(`Failed to send OTP email to ${email}: ${mailResult.error}`);
          } else {
            this.logger.log(`OTP sent to ${email}`);
          }
        })
        .catch((err) => {
          this.logger.error(`Error sending OTP email: ${err.message}`);
        });
    }, 1);

    this.logger.log(`OTP generated for ${email} (email scheduled non-blocking)`);

    return {
      success: true,
      message: 'If your email is registered, you will receive an OTP shortly.',
      previewUrl: undefined,
    };
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const user = await this.userModel.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      this.logger.warn(`Verify OTP failed: User not found for ${email}`);
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (user.resetPasswordOtp !== otp) {
      user.resetPasswordAttempts = (user.resetPasswordAttempts || 0) + 1;

      if (user.resetPasswordAttempts >= 5) {
        user.resetPasswordOtp = null;
        user.resetPasswordExpires = null;
        user.resetPasswordAttempts = 0;
        await user.save();
        this.logger.warn(`Verify OTP failed: Too many attempts for ${email}`);
        throw new BadRequestException(
          'Too many failed attempts. Please request a new OTP.',
        );
      }

      await user.save();
      this.logger.warn(
        `Verify OTP failed: OTP mismatch for ${email}. Expected: ${user.resetPasswordOtp}, Received: ${otp}`,
      );
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (user.resetPasswordExpires < new Date()) {
      this.logger.warn(`Verify OTP failed: OTP expired for ${email}`);
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Reset attempts on success
    user.resetPasswordAttempts = 0;
    await user.save();

    return true;
  }

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userModel.findOne({
      email: email.toLowerCase(),
      resetPasswordOtp: otp,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    user.password = hashedPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordExpires = null;
    await user.save();

    this.logger.log(`Password reset successfully for ${email}`);
  }
}
