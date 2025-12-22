/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface SendMailResult {
  success: boolean;
  error?: string;
  messageId?: string;
  previewUrl?: string | false;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly isDev = process.env.NODE_ENV !== 'production';

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  /**
   * Send order confirmation to customer with order details
   */
  async sendOrderConfirmation(
    email: string,
    orderData: {
      orderId: string;
      customerName: string;
      items: any[];
      total: number;
      shippingAddress: any;
    },
  ): Promise<SendMailResult> {
    if (!email) {
      this.logger.warn('No email provided for order confirmation');
      return { success: false, error: 'No email provided' };
    }

    try {
      this.logger.debug(
        `Sending order confirmation to ${email} for order ${orderData.orderId}`,
      );

      if (this.isDev) {
        this.logger.log(
          `[DEV] Order confirmation: ${email} - Order #${orderData.orderId}`,
        );
        return { success: true };
      }

      const result = await this.mailerService.sendMail({
        to: email,
        subject: `Order Confirmation - #${orderData.orderId}`,
        template: 'order-confirmation',
        context: {
          customerName: orderData.customerName,
          orderId: orderData.orderId,
          items: orderData.items,
          total: orderData.total.toFixed(2),
          shippingAddress: orderData.shippingAddress,
          orderDate: new Date().toLocaleDateString(),
          appName: 'E-Commerce Store',
        },
      });

      this.logger.log(`Order confirmation sent to ${email}`);
      return { success: true, messageId: result };
    } catch (error) {
      this.logger.error(
        `Failed to send order confirmation: ${error.message}`,
        error.stack,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Send order confirmation to all admins
   */
  async sendNewOrderNotificationToAdmins(
    adminEmails: string[],
    orderData: {
      orderId: string;
      customerName: string;
      customerEmail: string;
      total: number;
      itemCount: number;
      paymentStatus: string;
      shippingAddress: string;
    },
  ): Promise<SendMailResult> {
    if (!adminEmails || adminEmails.length === 0) {
      this.logger.warn('No admin emails provided for order notification');
      return { success: false, error: 'No admin emails provided' };
    }

    try {
      this.logger.debug(
        `Sending new order notification to ${adminEmails.length} admins`,
      );

      if (this.isDev) {
        this.logger.log(
          `[DEV] New order notification to admins - Order #${orderData.orderId}`,
        );
        return { success: true };
      }

      const result = await this.mailerService.sendMail({
        to: adminEmails,
        subject: `🎉 New Order Received - #${orderData.orderId}`,
        template: 'new-order-admin',
        context: {
          orderId: orderData.orderId,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          total: orderData.total.toFixed(2),
          itemCount: orderData.itemCount,
          paymentStatus: orderData.paymentStatus,
          shippingAddress: orderData.shippingAddress,
          orderDate: new Date().toLocaleDateString(),
          dashboardUrl: `${this.configService.get('FRONTEND_URL')}/admin/dashboard`,
        },
      });

      this.logger.log(
        `New order notification sent to ${adminEmails.length} admins`,
      );
      return { success: true, messageId: result };
    } catch (error) {
      this.logger.error(
        `Failed to send new order notification to admins: ${error.message}`,
        error.stack,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Send order status update to customer and admins
   */
  async sendOrderStatusUpdate(
    customerEmail: string,
    adminEmails: string[],
    orderData: {
      orderId: string;
      customerName: string;
      status: string;
      previousStatus?: string;
      trackingNumber?: string;
      estimatedDelivery?: string;
      notes?: string;
    },
  ): Promise<SendMailResult> {
    if (!customerEmail && (!adminEmails || adminEmails.length === 0)) {
      this.logger.warn('No email recipients provided for status update');
      return { success: false, error: 'No email recipients provided' };
    }

    try {
      this.logger.debug(
        `Sending status update for order ${orderData.orderId} to customer and admins`,
      );

      if (this.isDev) {
        this.logger.log(
          `[DEV] Order status update - Order #${orderData.orderId} status: ${orderData.status}`,
        );
        return { success: true };
      }

      const statusMessages = {
        pending: 'Your order is being processed',
        confirmed: 'Your order has been confirmed and will be packed soon',
        processing: 'Your order is being processed by our team',
        shipped: 'Your order has been shipped! 📦',
        delivered: 'Your order has been delivered! 🎉',
        cancelled: 'Your order has been cancelled',
      };

      const context = {
        orderId: orderData.orderId,
        customerName: orderData.customerName,
        status: orderData.status,
        statusMessage: statusMessages[orderData.status] || orderData.status,
        previousStatus: orderData.previousStatus,
        trackingNumber: orderData.trackingNumber,
        estimatedDelivery: orderData.estimatedDelivery,
        notes: orderData.notes,
        updateDate: new Date().toLocaleDateString(),
        trackingUrl: orderData.trackingNumber
          ? `${this.configService.get('FRONTEND_URL')}/track/${orderData.trackingNumber}`
          : null,
        orderDetailsUrl: `${this.configService.get('FRONTEND_URL')}/orders/${orderData.orderId}`,
      };

      // Send to customer if email provided
      if (customerEmail) {
        await this.mailerService.sendMail({
          to: customerEmail,
          subject: `Order Status Update - #${orderData.orderId} (${orderData.status.toUpperCase()})`,
          template: 'order-status-update',
          context,
        });
      }

      // Send to admins if provided
      if (adminEmails && adminEmails.length > 0) {
        await this.mailerService.sendMail({
          to: adminEmails,
          subject: `Order Status Updated - #${orderData.orderId} (${orderData.status.toUpperCase()})`,
          template: 'order-status-update-admin',
          context: {
            ...context,
            adminNote: 'This is an admin notification',
          },
        });
      }

      this.logger.log(
        `Order status update sent for order ${orderData.orderId}`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to send order status update: ${error.message}`,
        error.stack,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Send payment success email to customer and admins
   */
  async sendPaymentSuccess(
    customerEmail: string,
    adminEmails: string[],
    paymentData: {
      orderId: string;
      customerName: string;
      transactionId: string;
      amount: number;
      paymentMethod: string;
      orderTotal: number;
      itemCount: number;
    },
  ): Promise<SendMailResult> {
    if (!customerEmail && (!adminEmails || adminEmails.length === 0)) {
      this.logger.warn('No email recipients provided for payment success');
      return { success: false, error: 'No email recipients provided' };
    }

    try {
      this.logger.debug(
        `Sending payment success notification for order ${paymentData.orderId}`,
      );

      if (this.isDev) {
        this.logger.log(
          `[DEV] Payment success - Order #${paymentData.orderId} - Amount: ${paymentData.amount}`,
        );
        return { success: true };
      }

      const context = {
        customerName: paymentData.customerName,
        orderId: paymentData.orderId,
        transactionId: paymentData.transactionId,
        amount: paymentData.amount.toFixed(2),
        paymentMethod: paymentData.paymentMethod,
        orderTotal: paymentData.orderTotal.toFixed(2),
        itemCount: paymentData.itemCount,
        paymentDate: new Date().toLocaleDateString(),
        paymentTime: new Date().toLocaleTimeString(),
        viewOrderUrl: `${this.configService.get('FRONTEND_URL')}/orders/${paymentData.orderId}`,
        receiptUrl: `${this.configService.get('FRONTEND_URL')}/receipt/${paymentData.transactionId}`,
      };

      // Send to customer
      if (customerEmail) {
        await this.mailerService.sendMail({
          to: customerEmail,
          subject: `✅ Payment Successful - Order #${paymentData.orderId}`,
          template: 'payment-success',
          context,
        });
      }

      // Send to admins
      if (adminEmails && adminEmails.length > 0) {
        await this.mailerService.sendMail({
          to: adminEmails,
          subject: `💰 Payment Received - Order #${paymentData.orderId}`,
          template: 'payment-success-admin',
          context: {
            ...context,
            adminNote:
              'Payment has been confirmed. Order is ready for processing.',
          },
        });
      }

      this.logger.log(
        `Payment success notification sent for order ${paymentData.orderId}`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to send payment success notification: ${error.message}`,
        error.stack,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Send payment failed email to customer and admins
   */
  async sendPaymentFailed(
    customerEmail: string,
    adminEmails: string[],
    paymentData: {
      orderId: string;
      customerName: string;
      transactionId: string;
      amount: number;
      errorMessage: string;
      attemptNumber?: number;
    },
  ): Promise<SendMailResult> {
    if (!customerEmail && (!adminEmails || adminEmails.length === 0)) {
      this.logger.warn('No email recipients provided for payment failure');
      return { success: false, error: 'No email recipients provided' };
    }

    try {
      this.logger.debug(
        `Sending payment failure notification for order ${paymentData.orderId}`,
      );

      if (this.isDev) {
        this.logger.log(
          `[DEV] Payment failed - Order #${paymentData.orderId} - Error: ${paymentData.errorMessage}`,
        );
        return { success: true };
      }

      const context = {
        customerName: paymentData.customerName,
        orderId: paymentData.orderId,
        transactionId: paymentData.transactionId,
        amount: paymentData.amount.toFixed(2),
        errorMessage: paymentData.errorMessage,
        attemptNumber: paymentData.attemptNumber || 1,
        attemptDate: new Date().toLocaleDateString(),
        retryPaymentUrl: `${this.configService.get('FRONTEND_URL')}/checkout/${paymentData.orderId}`,
        supportEmail: this.configService.get(
          'SUPPORT_EMAIL',
          'support@ecommerce.com',
        ),
      };

      // Send to customer
      if (customerEmail) {
        await this.mailerService.sendMail({
          to: customerEmail,
          subject: `❌ Payment Failed - Order #${paymentData.orderId}`,
          template: 'payment-failed',
          context,
        });
      }

      // Send to admins for monitoring
      if (adminEmails && adminEmails.length > 0) {
        await this.mailerService.sendMail({
          to: adminEmails,
          subject: `⚠️ Payment Failed Alert - Order #${paymentData.orderId}`,
          template: 'payment-failed-admin',
          context: {
            ...context,
            adminNote: `Customer payment attempt failed. Order #${paymentData.orderId} needs attention.`,
            dashboardUrl: `${this.configService.get('FRONTEND_URL')}/admin/dashboard`,
          },
        });
      }

      this.logger.log(
        `Payment failure notification sent for order ${paymentData.orderId}`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to send payment failure notification: ${error.message}`,
        error.stack,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(email: string, name: string): Promise<SendMailResult> {
    if (!email) {
      this.logger.warn('No email provided for welcome message');
      return { success: false, error: 'No email provided' };
    }

    try {
      this.logger.debug(`Sending welcome email to ${email}`);

      if (this.isDev) {
        this.logger.log(`[DEV] Welcome email sent to ${email} - ${name}`);
        return { success: true };
      }

      await this.mailerService.sendMail({
        to: email,
        subject: '🎉 Welcome to E-Commerce Store!',
        template: 'welcome',
        context: {
          name,
          shopUrl: this.configService.get('FRONTEND_URL'),
          supportEmail: this.configService.get(
            'SUPPORT_EMAIL',
            'support@ecommerce.com',
          ),
        },
      });

      this.logger.log(`Welcome email sent to ${email}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email: ${error.message}`,
        error.stack,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(
    email: string,
    resetToken: string,
    userName?: string,
  ): Promise<SendMailResult> {
    if (!email) {
      this.logger.warn('No email provided for password reset');
      return { success: false, error: 'No email provided' };
    }

    try {
      this.logger.debug(`Sending password reset email to ${email}`);

      if (this.isDev) {
        this.logger.log(
          `[DEV] Password reset email - ${email} - Token: ${resetToken.substring(0, 10)}...`,
        );
        return { success: true };
      }

      const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;

      await this.mailerService.sendMail({
        to: email,
        subject: '🔐 Password Reset Request',
        template: 'password-reset',
        context: {
          userName: userName || email.split('@')[0],
          resetUrl,
          expiryTime: '1 hour',
          expiryDate: new Date(Date.now() + 60 * 60 * 1000).toLocaleString(),
          supportEmail: this.configService.get(
            'SUPPORT_EMAIL',
            'support@ecommerce.com',
          ),
        },
      });

      this.logger.log(`Password reset email sent to ${email}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email: ${error.message}`,
        error.stack,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Send low stock alert to admins
   */
  async sendLowStockAlert(
    adminEmails: string[],
    productData: {
      productName: string;
      productId: string;
      sku: string;
      currentStock: number;
      threshold: number;
      lastUpdated: string;
    },
  ): Promise<SendMailResult> {
    if (!adminEmails || adminEmails.length === 0) {
      this.logger.warn('No admin emails provided for low stock alert');
      return { success: false, error: 'No admin emails provided' };
    }

    try {
      this.logger.debug(
        `Sending low stock alert to ${adminEmails.length} admins`,
      );

      if (this.isDev) {
        this.logger.log(
          `[DEV] Low stock alert - ${productData.productName} - Stock: ${productData.currentStock}`,
        );
        return { success: true };
      }

      await this.mailerService.sendMail({
        to: adminEmails,
        subject: `⚠️ Low Stock Alert - ${productData.productName}`,
        template: 'low-stock-alert',
        context: {
          productName: productData.productName,
          productId: productData.productId,
          sku: productData.sku,
          currentStock: productData.currentStock,
          threshold: productData.threshold,
          lastUpdated: productData.lastUpdated,
          urgency: productData.currentStock === 0 ? 'CRITICAL' : 'WARNING',
          reorderUrl: `${this.configService.get('FRONTEND_URL')}/admin/products/${productData.productId}`,
        },
      });

      this.logger.log(`Low stock alert sent to ${adminEmails.length} admins`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to send low stock alert: ${error.message}`,
        error.stack,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Send order cancellation notification
   */
  async sendOrderCancellation(
    customerEmail: string,
    adminEmails: string[],
    orderData: {
      orderId: string;
      customerName: string;
      reason: string;
      refundAmount?: number;
      refundStatus?: string;
    },
  ): Promise<SendMailResult> {
    if (!customerEmail && (!adminEmails || adminEmails.length === 0)) {
      this.logger.warn('No email recipients provided for order cancellation');
      return { success: false, error: 'No email recipients provided' };
    }

    try {
      this.logger.debug(
        `Sending order cancellation notification for order ${orderData.orderId}`,
      );

      if (this.isDev) {
        this.logger.log(
          `[DEV] Order cancellation - Order #${orderData.orderId} - Reason: ${orderData.reason}`,
        );
        return { success: true };
      }

      const context = {
        customerName: orderData.customerName,
        orderId: orderData.orderId,
        reason: orderData.reason,
        refundAmount: orderData.refundAmount?.toFixed(2),
        refundStatus: orderData.refundStatus || 'Processing',
        cancellationDate: new Date().toLocaleDateString(),
        supportEmail: this.configService.get(
          'SUPPORT_EMAIL',
          'support@ecommerce.com',
        ),
        contactUrl: `${this.configService.get('FRONTEND_URL')}/support`,
      };

      // Send to customer
      if (customerEmail) {
        await this.mailerService.sendMail({
          to: customerEmail,
          subject: `Order Cancelled - #${orderData.orderId}`,
          template: 'order-cancelled',
          context,
        });
      }

      // Send to admins
      if (adminEmails && adminEmails.length > 0) {
        await this.mailerService.sendMail({
          to: adminEmails,
          subject: `Order Cancelled Alert - #${orderData.orderId}`,
          template: 'order-cancelled-admin',
          context: {
            ...context,
            adminNote: 'Order has been cancelled. Review refund status.',
          },
        });
      }

      this.logger.log(
        `Order cancellation notification sent for order ${orderData.orderId}`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to send order cancellation notification: ${error.message}`,
        error.stack,
      );
      return { success: false, error: error.message };
    }
  }
  /**
   * Send OTP for password reset
   */
  async sendOtpEmail(email: string, otp: string): Promise<SendMailResult> {
    if (!email) {
      this.logger.warn('No email provided for OTP');
      return { success: false, error: 'No email provided' };
    }

    try {
      this.logger.debug(`Sending OTP to ${email}`);

      if (this.isDev) {
        this.logger.log(`[DEV] OTP for ${email}: ${otp}`);
        // In dev, we still might want to send real email if testing with Ethereal
        // but the log above allows testing without checking email inbox.
      }

      const info = await this.mailerService.sendMail({
        to: email,
        subject: '🔐 Password Reset OTP',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Password Reset Request</h2>
            <p>Your One-Time Password (OTP) for resetting your password is:</p>
            <h1 style="color: #4F46E5; letter-spacing: 5px;">${otp}</h1>
            <p>This OTP is valid for 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        `,
      });

      let previewUrl = null;
      if (this.isDev) {
        // @ts-ignore
        previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          this.logger.log(`[Ethereal] Preview URL: ${previewUrl}`);
        }
      }

      this.logger.log(`OTP sent to ${email}`);
      return { success: true, previewUrl };
    } catch (error) {
      this.logger.error(`Failed to send OTP: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send 2FA Code Email
   */
  async send2FACodeEmail(email: string, code: string): Promise<SendMailResult> {
    if (!email) {
      return { success: false, error: 'No email provided' };
    }

    try {
      const info = await this.mailerService.sendMail({
        to: email,
        subject: '🔐 2FA Login Code',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Two-Factor Authentication</h2>
            <p>Your login verification code is:</p>
            <h1 style="color: #4F46E5; letter-spacing: 5px;">${code}</h1>
            <p>Enter this code to access your account.</p>
          </div>
        `,
      });

      let previewUrl = null;
      if (this.isDev) {
        // @ts-ignore
        previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          this.logger.log(`[Ethereal 2FA] Preview URL: ${previewUrl}`);
        }
      }
      return { success: true, previewUrl };
    } catch (error) {
      this.logger.error(`Failed to send 2FA email: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
