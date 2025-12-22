// src/modules/upload/upload.service.ts (No changes needed - already provided)
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {}

  async optimizeImage(
    filePath: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
    } = {},
  ): Promise<string> {
    const { width = 800, height, quality = 80 } = options;

    const parsedPath = path.parse(filePath);
    const optimizedFileName = `${parsedPath.name}-optimized${parsedPath.ext}`;
    const optimizedPath = path.join(parsedPath.dir, optimizedFileName);

    try {
      let transformer = sharp(filePath).jpeg({ quality });

      if (width || height) {
        transformer = transformer.resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      await transformer.toFile(optimizedPath);

      // Delete original file
      await fs.promises.unlink(filePath);

      return optimizedPath;
    } catch (error) {
      console.error('Error optimizing image:', error);
      return filePath;
    }
  }

  async createThumbnail(filePath: string): Promise<string | null> {
    const parsedPath = path.parse(filePath);
    const thumbnailFileName = `${parsedPath.name}-thumb${parsedPath.ext}`;
    const thumbnailPath = path.join(parsedPath.dir, thumbnailFileName);

    try {
      await sharp(filePath)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 70 })
        .toFile(thumbnailPath);

      return thumbnailPath;
    } catch (error) {
      console.error('Error creating thumbnail:', error);
      return null;
    }
  }

  async processProductImages(files: Express.Multer.File[]): Promise<{
    images: string[];
    thumbnails: string[];
  }> {
    const images: string[] = [];
    const thumbnails: string[] = [];

    if (!files || files.length === 0) {
      console.warn('⚠️ No files received in processProductImages');
      return { images: [], thumbnails: [] };
    }

    for (const file of files) {
      if (!file || !file.path) {
        console.error('❌ Invalid file received:', file);
        continue;
      }

      try {
        // Optimize main image
        const optimizedPath = await this.optimizeImage(file.path, {
          width: 1200,
          quality: 85,
        });

        // Create thumbnail
        const thumbnailPath = await this.createThumbnail(optimizedPath);

        // Convert to URL paths
        const baseUrl = this.configService.get<string>(
          'BASE_URL',
          'http://localhost:3000',
        );

        // Extract relative path starting from 'uploads/' to avoid absolute path in URL
        const uploadsIndex = optimizedPath.indexOf('uploads');

        const relativePath =
          uploadsIndex > -1
            ? optimizedPath.substring(uploadsIndex).replace(/\\/g, '/')
            : optimizedPath.replace(/\\/g, '/');

        const imageUrl = `${baseUrl}/${relativePath}`;

        // Also extract relative path for thumbnail
        let thumbnailUrl = imageUrl;
        if (thumbnailPath) {
          const thumbnailRelativePath =
            thumbnailPath.indexOf('uploads') > -1
              ? thumbnailPath
                  .substring(thumbnailPath.indexOf('uploads'))
                  .replace(/\\/g, '/')
              : thumbnailPath.replace(/\\/g, '/');
          thumbnailUrl = `${baseUrl}/${thumbnailRelativePath}`;
        }

        images.push(imageUrl);
        thumbnails.push(thumbnailUrl);
      } catch (err) {
        console.error('❌ Failed processing file:', file, err);
      }
    }

    return { images, thumbnails };
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      await fs.promises.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  async deleteProductImages(imageUrls: string[]): Promise<void> {
    const baseUrl = this.configService.get<string>(
      'BASE_URL',
      'http://localhost:3000',
    );

    for (const url of imageUrls) {
      const filePath = url.replace(baseUrl + '/', '');
      await this.deleteFile(filePath);

      // Also delete thumbnail
      const parsedPath = path.parse(filePath);
      const thumbnailPath = path.join(
        parsedPath.dir,
        `${parsedPath.name}-thumb${parsedPath.ext}`,
      );
      await this.deleteFile(thumbnailPath);
    }
  }
}
