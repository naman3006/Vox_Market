import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import { User } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { toFileStream, toDataURL } from 'qrcode';
import { Response } from 'express';

@Injectable()
export class TwoFactorAuthenticationService {
    constructor(
        private readonly usersService: UsersService,
        private readonly configService: ConfigService,
    ) { }

    public async generateTwoFactorAuthenticationSecret(user: User & { _id?: any; id?: string }) {
        const secret = speakeasy.generateSecret({
            name: this.configService.get('TWO_FACTOR_AUTHENTICATION_APP_NAME') || 'E-Commerce App',
            issuer: 'E-Commerce App',
        });


        console.log(`[DEBUG] Generated 2FA Secret: ${secret.base32} for User ID: ${user._id || user.id}`);

        // Generate and log the token for testing
        const token = speakeasy.totp({
            secret: secret.base32,
            encoding: 'base32',
        });
        console.log(`[DEBUG] AUTO-GENERATED 2FA CODE FOR TESTING: ${token}`);

        const otpauthUrl = secret.otpauth_url;

        await this.usersService.setTwoFactorAuthenticationSecret(secret.base32, user._id || user.id);

        return {
            secret: secret.base32,
            otpauthUrl,
        };
    }

    public async generateQrCodeDataURL(otpauthUrl: string) {
        return toDataURL(otpauthUrl);
    }

    public async pipeQrCodeStream(stream: Response, otpauthUrl: string) {
        return toFileStream(stream, otpauthUrl);
    }

    public isTwoFactorAuthenticationCodeValid(twoFactorAuthenticationCode: string, user: User) {
        console.log(`[DEBUG] Verifying Code: ${twoFactorAuthenticationCode} for User Secret: ${user.twoFactorAuthenticationSecret}`);
        return speakeasy.totp.verify({
            secret: user.twoFactorAuthenticationSecret,
            encoding: 'base32',
            token: twoFactorAuthenticationCode,
            window: 1, // Allow 1 step (30s) window for email delay
        });
    }
}
