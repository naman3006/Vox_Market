import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Question, QuestionDocument } from './schemas/question.schema';
import { CreateQuestionDto, AnswerQuestionDto } from './dto/question.dto';

@Injectable()
export class QuestionsService {
    constructor(
        @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    ) { }

    async create(userId: string, createQuestionDto: CreateQuestionDto): Promise<Question> {
        const question = new this.questionModel({
            ...createQuestionDto,
            productId: new Types.ObjectId(createQuestionDto.productId),
            userId: new Types.ObjectId(userId),
        });
        return question.save();
    }

    async findAllByProduct(productId: string): Promise<Question[]> {
        return this.questionModel.find({ productId: new Types.ObjectId(productId) })
            .populate('userId', 'name')
            .populate('answers.userId', 'name')
            .sort({ createdAt: -1 })
            .exec();
    }

    async answer(userId: string, questionId: string, content: string, role: string): Promise<Question> {
        const question = await this.questionModel.findById(questionId);
        if (!question) throw new NotFoundException('Question not found');

        question.answers.push({
            userId: new Types.ObjectId(userId),
            content,
            role,
            createdAt: new Date(),
        });

        return question.save();
    }

    async upvote(userId: string, questionId: string): Promise<Question> {
        const question = await this.questionModel.findById(questionId);
        if (!question) throw new NotFoundException('Question not found');

        const uid = new Types.ObjectId(userId);
        // Toggle upvote
        const index = question.upvotes.indexOf(uid);
        if (index === -1) {
            question.upvotes.push(uid);
        } else {
            question.upvotes.splice(index, 1);
        }

        return question.save();
    }
}
