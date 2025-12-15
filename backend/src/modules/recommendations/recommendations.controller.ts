import { Controller, Get, Param, Query } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('recommendations')
export class RecommendationsController {
    constructor(private readonly recommendationsService: RecommendationsService) { }

    @Public()
    @Get('products/:id')
    async getProductRecommendations(
        @Param('id') id: string,
        @Query('limit') limit?: number
    ) {
        return this.recommendationsService.getFrequentlyBoughtTogether(id, limit);
    }
}
