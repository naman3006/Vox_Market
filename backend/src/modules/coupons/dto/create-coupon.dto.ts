import {
    IsString,
    IsEnum,
    IsNumber,
    IsDate,
    IsOptional,
    IsBoolean,
    IsArray,
    Min,
    Max,
    MinLength,
    MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountType } from '../schemas/coupon.schema';

export class CreateCouponDto {
    @IsString()
    @MinLength(3)
    @MaxLength(20)
    code: string;

    @IsString()
    @MinLength(10)
    description: string;

    @IsEnum(DiscountType)
    discountType: DiscountType;

    @IsNumber()
    @Min(0)
    discountValue: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    minPurchaseAmount?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    maxDiscountAmount?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    costInPoints?: number;

    @Type(() => Date)
    @IsDate()
    validFrom: Date;

    @Type(() => Date)
    @IsDate()
    validUntil: Date;

    @IsOptional()
    @IsNumber()
    @Min(0)
    usageLimit?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    usageLimitPerUser?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    applicableCategories?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    applicableProducts?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    applicableUsers?: string[];

    @IsOptional()
    @IsBoolean()
    firstTimeUserOnly?: boolean;

    @IsOptional()
    @IsString()
    notes?: string;
}
