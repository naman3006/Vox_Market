
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('chatbot')
export class ChatbotController {
    constructor(private readonly chatbotService: ChatbotService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post('message')
    async sendMessage(@Body() body: { message: string, history: any[] }, @Req() req) {
        const userId = req.user.id;
        return this.chatbotService.processMessage(userId, body.message, body.history);
    }
}
