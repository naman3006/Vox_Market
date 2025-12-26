import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) { }

  @UseGuards(OptionalJwtAuthGuard)
  @Post('message')
  async sendMessage(
    @Body() body: { message: string; history: any[] },
    @Req() req,
  ) {
    const userId = req.user?.id || null;
    return this.chatbotService.processMessage(
      userId,
      body.message,
      body.history,
    );
  }
}
