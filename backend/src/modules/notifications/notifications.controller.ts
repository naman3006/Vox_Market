import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Post,
  Body,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../common/interfaces/user.interface'; // Interface

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.notificationsService.findAll(user.id);
  }

  @Post('test')
  createTest(@Body('message') message: string, @CurrentUser() user: User) {
    return this.notificationsService.create(
      user.id,
      message || 'Test notification',
    );
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @CurrentUser() user: User) {
    return this.notificationsService.markAsRead(id, user.id);
  }
  @Patch('read-all')
  markAllAsReadByUser(@CurrentUser() user: User) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
