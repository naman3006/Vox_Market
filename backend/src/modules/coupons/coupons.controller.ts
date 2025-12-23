import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

import { CouponStatus, DiscountType } from './schemas/coupon.schema';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() createCouponDto: CreateCouponDto, @Request() req) {
    return this.couponsService.create(createCouponDto, req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'reseller')
  findAll(
    @Query('status') status?: CouponStatus,
    @Query('isActive') isActive?: string,
    @Query('discountType') discountType?: DiscountType,
  ) {
    const filters: any = {};

    if (status) filters.status = status;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (discountType) filters.discountType = discountType;

    return this.couponsService.findAll(filters);
  }

  @Get('active')
  getActiveCoupons() {
    return this.couponsService.getActiveCoupons();
  }

  @Get('my-coupons')
  @UseGuards(JwtAuthGuard)
  getMyCoupons(@Request() req) {
    return this.couponsService.findMyCoupons(req.user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'reseller')
  findOne(@Param('id') id: string) {
    return this.couponsService.findOne(id);
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.couponsService.findByCode(code);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'reseller')
  getCouponStats(@Param('id') id: string) {
    return this.couponsService.getCouponStats(id);
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  validateCoupon(@Body() validateCouponDto: ValidateCouponDto, @Request() req) {
    return this.couponsService.validateCoupon(
      validateCouponDto,
      req.user.userId,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateCouponDto: UpdateCouponDto) {
    return this.couponsService.update(id, updateCouponDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.couponsService.remove(id);
  }
}
