import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: (configService: ConfigService) => {
    return cloudinary.config({
      cloud_name: configService.get('CLOUDINARY_CLOUD_NAME') || 'dpmdpckrp',
      api_key: configService.get('CLOUDINARY_API_KEY') || '612991424655661',
      api_secret:
        configService.get('CLOUDINARY_API_SECRET') ||
        'MWIKwSX42N4ZS6PF9myYf7J2XDE',
    });
  },
  inject: [ConfigService],
};
