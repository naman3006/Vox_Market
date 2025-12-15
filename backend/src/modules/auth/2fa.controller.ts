import {
    ClassSerializerInterceptor,
    Controller,
    Post,
    UseGuards,
    Req,
    Res,
    UseInterceptors,
    Body,
    UnauthorizedException,
    HttpCode,
} from '@nestjs/common';
import { TwoFactorAuthenticationService } from './2fa.service';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { User } from './schemas/user.schema';
import { MailService } from '../mail/mail.service';
import * as speakeasy from 'speakeasy';

@Controller('auth/2fa')
@UseInterceptors(ClassSerializerInterceptor)
export class TwoFactorAuthenticationController {

    constructor(
        private readonly twoFactorAuthenticationService: TwoFactorAuthenticationService,
        private readonly usersService: UsersService,
        private readonly mailService: MailService, // Inject MailService
    ) { }

    @Post('generate')
    @UseGuards(JwtAuthGuard)
    async register(@Req() request: any) {
        const { otpauthUrl, secret } =
            await this.twoFactorAuthenticationService.generateTwoFactorAuthenticationSecret(
                request.user,
            );

        const qrCodeUrl = await this.twoFactorAuthenticationService.generateQrCodeDataURL(otpauthUrl);

        // Generate token for email
        const token = speakeasy.totp({
            secret: secret,
            encoding: 'base32',
        });

        // Send email with code
        const mailResult = await this.mailService.send2FACodeEmail(request.user.email, token);

        return {
            secret,
            qrCodeUrl,
            otpauthUrl,
            debugUrl: mailResult.previewUrl,
        };
    }

    @Post('turn-on')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    async turnOnTwoFactorAuthentication(
        @Req() request: any,
        @Body() { twoFactorAuthenticationCode }: { twoFactorAuthenticationCode: string },
    ) {
        const user = await this.usersService.findByIdWith2FASecret(request.user.id);
        const isCodeValid =
            this.twoFactorAuthenticationService.isTwoFactorAuthenticationCodeValid(
                twoFactorAuthenticationCode,
                user,
            );
        if (!isCodeValid) {
            throw new UnauthorizedException('Wrong authentication code');
        }
        await this.usersService.turnOnTwoFactorAuthentication(request.user.id);

        return {
            success: true,
            message: 'Two-factor authentication enabled',
        };
    }

    @Post('turn-off')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    async turnOffTwoFactorAuthentication(@Req() request: any) {
        await this.usersService.turnOffTwoFactorAuthentication(request.user.id);
        return {
            success: true,
            message: 'Two-factor authentication disabled',
        };
    }
}
