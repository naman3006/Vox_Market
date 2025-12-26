import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
    I18nValidationExceptionFilter,
    i18nValidationErrorFactory,
} from 'nestjs-i18n';
import { TransFormInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SocketAdapter } from './common/adapters/socket.adapter';
import { join } from 'path';

export function setupApp(app: NestExpressApplication) {
    // Serve static files (for uploaded images) - Only if not in limited serverless env without persistent storage
    // But we keep it for compatibility if they rely on it for pre-seeded assets
    const uploadPath = join(process.cwd(), 'uploads');
    app.useStaticAssets(uploadPath, {
        prefix: '/uploads/',
    });

    // Enable CORS
    app.enableCors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: false,
            forbidNonWhitelisted: false,
            transform: true,
            exceptionFactory: i18nValidationErrorFactory,
        }),
    );

    app.useGlobalInterceptors(new TransFormInterceptor());
    app.useGlobalFilters(
        new HttpExceptionFilter(),
        new I18nValidationExceptionFilter({ detailedErrors: false }),
    );

    // Note: WebSockets might not work in Vercel/Netlify Serverless functions
    // We keep it here, but it might just be ignored or fail gracefully if the environment doesn't support upgrading
    try {
        app.useWebSocketAdapter(new SocketAdapter(app));
    } catch (e) {
        console.warn('WebSocket adapter could not be initialized (expected in serverless):', e);
    }
}
