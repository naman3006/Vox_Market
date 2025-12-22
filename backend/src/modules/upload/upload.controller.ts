import {
  Controller,
  Post,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UploadService } from './upload.service';

@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('product-image')
  @Roles('admin', 'seller')
  @UseInterceptors(FileInterceptor('image'))
  async uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.uploadService.processProductImages([file]);

    return {
      success: true,
      image: result.images[0],
      thumbnail: result.thumbnails[0],
    };
  }

  @Post('product-images')
  @Roles('admin', 'seller')
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 images
  async uploadProductImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const result = await this.uploadService.processProductImages(files);

    return {
      success: true,
      images: result.images,
      thumbnails: result.thumbnails,
      count: files.length,
    };
  }

  @Delete('product-images')
  @Roles('admin', 'seller')
  async deleteProductImages(@Body('imageUrls') imageUrls: string[]) {
    if (!imageUrls || imageUrls.length === 0) {
      throw new BadRequestException('No image URLs provided');
    }

    await this.uploadService.deleteProductImages(imageUrls);

    return {
      success: true,
      message: 'Images deleted successfully',
    };
  }
}
