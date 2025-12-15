/* eslint-disable @typescript-eslint/require-await */
import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const isDev = configService.get('NODE_ENV') !== 'production';
        const mailUser = configService.get('MAIL_USER');
        let transportConfig: any;

        // Prioritize Ethereal in Development to ensure Preview Links work
        if (isDev) {
          try {
            const testAccount = await nodemailer.createTestAccount();
            transportConfig = {
              host: 'smtp.ethereal.email',
              port: 587,
              secure: false,
              auth: {
                user: testAccount.user,
                pass: testAccount.pass,
              },
            };
            console.log('[MailModule] --------------------------------------------------');
            console.log('[MailModule] Using Ethereal Email for Development (Forced)');
            console.log(`[MailModule] Account: ${testAccount.user}`);
            console.log('[MailModule] --------------------------------------------------');
          } catch (err) {
            console.error('[MailModule] Failed to create Ethereal test account', err);
            console.warn('[MailModule] Falling back to environment configuration');

            // Fallback to Env Config if Ethereal fails
            transportConfig = {
              host: configService.get('MAIL_HOST', 'smtp.gmail.com'),
              port: configService.get('MAIL_PORT', 587),
              secure: false,
              auth: {
                user: mailUser,
                pass: configService.get('MAIL_PASSWORD'),
              },
            };
          }
        } else {
          // Production or Non-Dev: Use configured credentials
          transportConfig = {
            host: configService.get('MAIL_HOST', 'smtp.gmail.com'),
            port: configService.get('MAIL_PORT', 587),
            secure: false,
            auth: {
              user: mailUser,
              pass: configService.get('MAIL_PASSWORD'),
            },
          };
        }

        return {
          transport: transportConfig,
          defaults: {
            from: `"${configService.get('MAIL_FROM_NAME', 'E-Commerce')}" <${configService.get('MAIL_FROM', 'noreply@ecommerce.com')}>`,
          },
          template: {
            dir: join(__dirname, '..', '..', 'modules', 'mail', 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: false,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [MailerModule, MailService],
  providers: [MailService],
})
export class MailModule { }
