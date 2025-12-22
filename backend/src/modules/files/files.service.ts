import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import toStream = require('streamifier');
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FilesService {
  constructor(private readonly configService: ConfigService) {}

  async uploadFile(file: Express.Multer.File): Promise<any> {
    const destination =
      this.configService.get<string>('UPLOAD_DESTINATION') || 'cloudinary';

    if (destination === 'local') {
      return this.uploadFileLocal(file);
    }

    return this.uploadFileCloudinary(file);
  }

  private async uploadFileCloudinary(file: Express.Multer.File): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'ecommerce_products' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      toStream.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  private async uploadFileLocal(file: Express.Multer.File): Promise<any> {
    const uploadDir = path.join(process.cwd(), 'uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `file-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    const filepath = path.join(uploadDir, filename);

    try {
      await sharp(file.buffer).webp({ quality: 80 }).toFile(filepath);

      const baseUrl =
        this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
      const fileUrl = `${baseUrl}/uploads/${filename}`;

      return {
        secure_url: fileUrl,
        public_id: filename,
      };
    } catch (error) {
      console.error('Local upload error:', error);
      throw new BadRequestException('Failed to upload file locally');
    }
  }
}
