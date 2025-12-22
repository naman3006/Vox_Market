import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../common/interfaces/user.interface'; // Interface

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @CurrentUser() user: User) {
    return this.ordersService.create(createOrderDto, user.id);
  }

  @Get('my')
  findMy(@CurrentUser() user: User) {
    return this.ordersService.findMy(user.id);
  }

  @Get()
  @Roles('admin')
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('seller')
  @Roles('seller')
  findBySeller(@CurrentUser() user: User) {
    return this.ordersService.findBySeller(user.id);
  }

  @Get('product/:productId')
  @Roles('admin', 'seller')
  findByProduct(
    @Param('productId') productId: string,
    @CurrentUser() user: User,
  ) {
    // For sellers, only return orders for their products
    const sellerId = user?.role === 'seller' ? user.id : undefined;
    return this.ordersService.findByProduct(productId, sellerId);
  }

  @Patch(':id/accept')
  @Roles('seller')
  acceptBySeller(@Param('id') id: string, @CurrentUser() user: User) {
    return this.ordersService.acceptBySeller(id, user.id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.ordersService.cancel(id, user.id);
  }

  @Patch(':id/status')
  @Roles('admin')
  updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
}
