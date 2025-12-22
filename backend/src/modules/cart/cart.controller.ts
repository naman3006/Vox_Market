import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../common/interfaces/user.interface'; // Interface

@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('user', 'admin')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  findOne(@CurrentUser() user: User) {
    return this.cartService.findOne(user.id, user.role);
  }

  @Post('add')
  add(@Body() addToCartDto: AddToCartDto, @CurrentUser() user: User) {
    return this.cartService.add(user.id, user.role, addToCartDto);
  }

  @Patch('update/:id')
  update(
    @Param('id') id: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
    @CurrentUser() user: User,
  ) {
    return this.cartService.update(user.id, user.role, id, updateCartItemDto);
  }

  @Delete('remove/:id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.cartService.remove(user.id, user.role, id);
  }

  @Delete('clear')
  clear(@CurrentUser() user: User) {
    return this.cartService.clear(user.id);
  }

  // Admin routes
  @Get('admin/:userId')
  @Roles('admin')
  getCartByUserId(@Param('userId') userId: string) {
    return this.cartService.findOne(userId, 'user'); // Defaults to 'user' for viewing, assuming viewing existing
  }

  @Delete('admin/:userId')
  @Roles('admin')
  clearCartByUserId(@Param('userId') userId: string) {
    return this.cartService.clear(userId);
  }
}
