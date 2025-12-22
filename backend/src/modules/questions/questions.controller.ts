import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto, AnswerQuestionDto } from './dto/question.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../common/interfaces/user.interface';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createQuestionDto: CreateQuestionDto,
    @CurrentUser() user: User,
  ) {
    return this.questionsService.create(user.id, createQuestionDto);
  }

  @Get('product/:productId')
  findAllByProduct(@Param('productId') productId: string) {
    return this.questionsService.findAllByProduct(productId);
  }

  @Post(':id/answer')
  @UseGuards(JwtAuthGuard)
  answer(
    @Param('id') id: string,
    @Body() answerDto: AnswerQuestionDto,
    @CurrentUser() user: User,
  ) {
    // Determine role (simplified check, ideally should check if admin or verified buyer)
    // For now, if role is 'admin', trust it? No, user.role is safer.
    const role = user.role === 'admin' ? 'admin' : 'user';
    return this.questionsService.answer(user.id, id, answerDto.content, role);
  }

  @Patch(':id/upvote')
  @UseGuards(JwtAuthGuard)
  upvote(@Param('id') id: string, @CurrentUser() user: User) {
    return this.questionsService.upvote(user.id, id);
  }
}
