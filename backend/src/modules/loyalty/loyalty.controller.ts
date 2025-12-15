import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('loyalty')
@UseGuards(JwtAuthGuard)
export class LoyaltyController {
    constructor(private readonly loyaltyService: LoyaltyService) { }

    @Get('status')
    async getStatus(@Request() req) {
        return this.loyaltyService.getLoyaltyStatus(req.user.userId);
    }

    @Post('redeem/:couponId')
    async redeem(@Request() req, @Param('couponId') couponId: string) {
        return this.loyaltyService.redeemPoints(req.user.userId, couponId);
    }
}
