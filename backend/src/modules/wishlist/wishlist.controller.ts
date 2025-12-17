import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../common/interfaces/user.interface'; // Interface

@Controller('wishlist')
export class WishlistController {
  constructor(private wishlistService: WishlistService) { }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: User) {
    return this.wishlistService.findAll(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body('name') name: string, @CurrentUser() user: User) {
    if (!name) name = 'New Wishlist';
    return this.wishlistService.create(user.id, name);
  }

  @Get('share/:token')
  findByToken(@Param('token') token: string) {
    return this.wishlistService.findByToken(token);
  }

  @Post('shared/toggle-bought')
  toggleBought(@Body() body: { shareToken: string; productId: string; boughtBy: string }) {
    return this.wishlistService.toggleBoughtStatus(body.shareToken, body.productId, body.boughtBy);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.wishlistService.findOne(id, user.id);
  }

  @Patch(':id/privacy')
  @UseGuards(JwtAuthGuard)
  updatePrivacy(@Param('id') id: string, @Body('privacy') privacy: string, @CurrentUser() user: User) {
    return this.wishlistService.updatePrivacy(id, user.id, privacy);
  }

  @Post('add/:productId')
  @UseGuards(JwtAuthGuard)
  add(@Param('productId') productId: string, @CurrentUser() user: User, @Body('wishlistId') wishlistId?: string) {
    return this.wishlistService.add(user.id, productId, wishlistId);
  }

  @Delete('remove/:productId')
  @UseGuards(JwtAuthGuard)
  remove(@Param('productId') productId: string, @CurrentUser() user: User, @Body('wishlistId') wishlistId?: string) {
    return this.wishlistService.remove(user.id, productId, wishlistId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.wishlistService.delete(id, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: { name?: string }, @CurrentUser() user: User) {
    return this.wishlistService.update(id, user.id, body);
  }
}
