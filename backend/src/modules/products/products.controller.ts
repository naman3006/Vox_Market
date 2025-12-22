// src/modules/products/products.controller.ts (Updated to handle raw FormData body safely)
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { ProductsService, ProductQueryResult } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Product } from './schemas/product.schema';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../common/interfaces/user.interface';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

// Multer storage configuration for product images
const getProductImageStorage = () => {
  const uploadDir = join(process.cwd(), 'uploads', 'products', 'temp');

  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
      const ext = extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  });
};

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Public()
  @Get()
  findAll(
    @Query() queryProductDto: QueryProductDto,
  ): Promise<ProductQueryResult> {
    return this.productsService.findAll(queryProductDto);
  }

  @Public()
  @Get('featured')
  getFeaturedProducts(@Query('limit') limit?: number): Promise<Product[]> {
    return this.productsService.getFeaturedProducts(limit);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @Public()
  @Get(':id/related')
  getRelatedProducts(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ): Promise<Product[]> {
    return this.productsService.getRelatedProducts(id, limit);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller')
  @UseInterceptors(
    FilesInterceptor('images', 10, { storage: getProductImageStorage() }),
  )
  async create(
    @Body() rawBody: Record<string, string | string[] | undefined>, // Raw multipart body (flat object from FormData)
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB per file
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png|gif|webp)$/,
            skipMagicNumbersValidation: true,
          }),
        ],
        fileIsRequired: false,
      }),
    )
    files: Express.Multer.File[],
    @CurrentUser() user: User,
  ) {
    // Transform raw flat body to DTO structure
    const createDto = this.transformRawBodyToDto(rawBody, CreateProductDto);
    return this.productsService.processAndCreateProduct(
      createDto,
      files,
      user.id,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller')
  @UseInterceptors(
    FilesInterceptor('images', 10, { storage: getProductImageStorage() }),
  )
  async update(
    @Param('id') id: string,
    @Body() rawBody: Record<string, string | string[] | undefined>, // Raw multipart body
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png|gif|webp)$/,
            skipMagicNumbersValidation: true,
          }),
        ],
        fileIsRequired: false,
      }),
    )
    files: Express.Multer.File[],
  ) {
    // Transform raw flat body to DTO structure
    const updateDto = this.transformRawBodyToDto(rawBody, UpdateProductDto);
    return this.productsService.processAndUpdateProduct(id, updateDto, files);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // Helper method to transform flat FormData keys to nested DTO
  /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
  private transformRawBodyToDto<T extends Partial<CreateProductDto>>(
    rawBody: Record<string, string | string[] | undefined>,
    DtoClass: new () => T,
  ): T {
    const dto = new DtoClass();

    const getString = (val: string | string[] | undefined): string => {
      if (!val) return '';
      if (Array.isArray(val)) return val[0] || '';
      return val;
    };

    // Use type assertion to avoid strict partial checks during assignment
    const d = dto as any;

    // Simple fields
    if (rawBody.title) d.title = getString(rawBody.title);
    if (rawBody.description) d.description = getString(rawBody.description);
    if (rawBody.longDescription)
      d.longDescription = getString(rawBody.longDescription);
    if (rawBody.brand) d.brand = getString(rawBody.brand);
    if (rawBody.sku) d.sku = getString(rawBody.sku);
    if (rawBody.thumbnail) d.thumbnail = getString(rawBody.thumbnail);
    if (rawBody.stockStatus) d.stockStatus = getString(rawBody.stockStatus);

    // Boolean handling
    if (rawBody.isFeatured !== undefined) {
      const val = getString(rawBody.isFeatured);
      d.isFeatured = val === 'true';
    }
    if (rawBody.isActive !== undefined) {
      const val = getString(rawBody.isActive);
      d.isActive = val === 'true';
    }

    // Handle images explicitly
    if (rawBody.images) {
      if (Array.isArray(rawBody.images)) {
        d.images = rawBody.images;
      } else if (rawBody.images) {
        d.images = [rawBody.images];
      }
    }

    // Numbers
    [
      'price',
      'discountPrice',
      'stock',
      'weight',
      'rating',
      'soldCount',
    ].forEach((field) => {
      if (rawBody[field] !== undefined) {
        const val = getString(rawBody[field]);
        d[field] = parseFloat(val) || parseInt(val, 10) || 0;
      }
    });

    // categoryId
    d.categoryId = getString(rawBody.categoryId);

    // Tags
    const tagsVal = getString(rawBody.tags);
    if (tagsVal) {
      d.tags = tagsVal
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean);
    }

    // Variants - flattened keys
    d.variants = [];
    let variantIndex = 0;
    while (variantIndex < 50) {
      const nameKey = `variants[${variantIndex}].name`;
      if (rawBody[nameKey] === undefined) break;

      const name = getString(rawBody[nameKey]);
      const options: string[] = [];
      let optIndex = 0;
      while (optIndex < 50) {
        const optKey = `variants[${variantIndex}].options[${optIndex}]`;
        if (rawBody[optKey] === undefined) break;
        options.push(getString(rawBody[optKey]));
        optIndex++;
      }

      if (name && options.length > 0) {
        d.variants.push({ name, options });
      }
      variantIndex++;
    }

    // Specifications
    d.specifications = [];
    let specIndex = 0;
    while (specIndex < 50) {
      const keyKey = `specifications[${specIndex}].key`;
      if (rawBody[keyKey] === undefined) break;

      const key = getString(rawBody[keyKey]);
      const valKey = `specifications[${specIndex}].value`;
      const value = getString(rawBody[valKey]);

      if (key && value) {
        d.specifications.push({ key, value });
      }
      specIndex++;
    }

    // SEO
    d.seo = {
      metaTitle: getString(rawBody['seo[metaTitle]']),
      metaDescription: getString(rawBody['seo[metaDescription]']),
      keywords: getString(rawBody['seo[keywords]'])
        .split(',')
        .map((k: string) => k.trim())
        .filter(Boolean),
    };

    return dto;
  }
}
