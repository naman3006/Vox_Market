// src/modules/products/dto/create-product.dto.ts (Updated - tags and keywords as arrays, with Transform for string input if needed)
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsBoolean,
  ValidateNested,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Transform } from 'class-transformer';

class ProductVariantDto {
  @IsString()
  @IsNotEmpty()
  name: string; // e.g., "Color", "Size"

  @IsArray()
  @IsString({ each: true })
  options: string[]; // e.g., ["Red", "Blue"], ["S", "M", "L"]
}

class ProductSpecificationDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  value: string;
}

class SEODto {
  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;

  @Transform(({ value }) =>
    typeof value === 'string'
      ? value
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
      : value || [],
  )
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  longDescription?: string; // Rich text HTML

  @Transform(({ value }: { value: any }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  price: number;

  @Transform(({ value }: { value: any }) => (value ? parseFloat(value) : undefined))
  @IsNumber()
  @IsOptional()
  @Min(0)
  discountPrice?: number;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[]; // Processed URLs

  @IsString()
  @IsOptional()
  thumbnail?: string; // Processed URL

  @IsString()
  @IsOptional()
  brand?: string;

  @Transform(({ value }: { value: any }) => parseInt(value, 10))
  @IsNumber()
  @Min(0)
  stock: number;

  @Transform(({ value }: { value: any }) => (value ? parseFloat(value) : undefined))
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(5)
  rating?: number;

  @Transform(({ value }: { value: any }) => (value ? parseInt(value, 10) : undefined))
  @IsNumber()
  @IsOptional()
  @Min(0)
  soldCount?: number;

  @IsString()
  @IsOptional()
  sku?: string; // Stock Keeping Unit

  @Transform(({ value }: { value: any }) => (value ? parseFloat(value) : undefined))
  @IsNumber()
  @IsOptional()
  @Min(0)
  weight?: number; // in kg

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  @IsOptional()
  variants?: ProductVariantDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSpecificationDto)
  @IsOptional()
  specifications?: ProductSpecificationDto[];

  @Transform(({ value }) =>
    typeof value === 'string'
      ? value
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      : value || [],
  )
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @Transform(({ value }: { value: any }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @Transform(({ value }: { value: any }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ValidateNested()
  @Type(() => SEODto)
  @IsOptional()
  seo?: SEODto;

  @IsString()
  @IsOptional()
  arModelUrl?: string;

  @IsEnum(['floor', 'wall'])
  @IsOptional()
  arPlacement?: string;

  @IsEnum(['in-stock', 'out-of-stock', 'pre-order'])
  @IsOptional()
  stockStatus?: string;
}
