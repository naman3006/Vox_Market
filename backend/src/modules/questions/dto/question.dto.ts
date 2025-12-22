import { IsString, IsNotEmpty } from 'class-validator';

export class CreateQuestionDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsString()
  productId: string;
}

export class AnswerQuestionDto {
  @IsNotEmpty()
  @IsString()
  content: string;
}
