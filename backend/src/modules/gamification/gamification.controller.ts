import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) { }

  @Get('profile')
  async getProfile(@Request() req) {
    return this.gamificationService.getProfile(req.user.id);
  }

  @Post('check-in')
  async checkIn(@Request() req) {
    return this.gamificationService.checkIn(req.user.id);
  }

  @Post('spin')
  async spinWheel(@Request() req) {
    return this.gamificationService.spinWheel(req.user.id);
  }

  @Post('scratch')
  async scratchCard(@Request() req) {
    return this.gamificationService.scratchCard(req.user.id);
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return this.gamificationService.getLeaderboard();
  }

  @Get('activities')
  async getActivities() {
    return this.gamificationService.getRecentActivities();
  }
}
