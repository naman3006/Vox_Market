import { Controller, Get, UseGuards, Request, Query, Param } from '@nestjs/common';
import { UserActivityService } from './user-activity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('user-activity')
@UseGuards(JwtAuthGuard)
export class UserActivityController {
    constructor(private readonly userActivityService: UserActivityService) { }

    @Get('me')
    async getMyActivities(@Request() req, @Query('limit') limit: number) {
        return this.userActivityService.getUserActivities(req.user.id, limit);
    }

    @Get('user/:userId')
    async getActivitiesForUser(
        @Param('userId') userId: string,
        @Query('limit') limit: number,
    ) {
        // TODO: Add Admin Role Guard here if not globally applied or specific guard needed
        return this.userActivityService.getUserActivities(userId, limit);
    }
}
