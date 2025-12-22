import { Types } from 'mongoose';

/**
 * Validation and utility helpers for the application
 */

export class ValidationHelper {
  /**
   * Validates MongoDB ObjectId format
   */
  static isValidObjectId(id: string | Types.ObjectId): boolean {
    return Types.ObjectId.isValid(id);
  }

  /**
   * Validates email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates password strength
   */
  static isStrongPassword(password: string): {
    isStrong: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*]/.test(password)) {
      errors.push(
        'Password must contain at least one special character (!@#$%^&*)',
      );
    }

    return {
      isStrong: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates phone number format
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  /**
   * Sanitizes user input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    return input.replace(/[<>]/g, '').trim();
  }
}

export class PaginationHelper {
  /**
   * Validates pagination parameters
   */
  static validatePaginationParams(
    page: number,
    limit: number,
    maxLimit: number = 100,
  ): { page: number; limit: number } {
    const validatedPage = Math.max(1, page || 1);
    const validatedLimit = Math.min(Math.max(1, limit || 10), maxLimit);

    return {
      page: validatedPage,
      limit: validatedLimit,
    };
  }

  /**
   * Calculates skip value for database queries
   */
  static getSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Calculates total pages
   */
  static getTotalPages(total: number, limit: number): number {
    return Math.ceil(total / limit);
  }

  /**
   * Returns pagination metadata
   */
  static getPaginationMeta(
    page: number,
    limit: number,
    total: number,
  ): {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } {
    const totalPages = this.getTotalPages(total, limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }
}

export class DateHelper {
  /**
   * Checks if a date is expired
   */
  static isExpired(expiryDate: Date | string): boolean {
    return new Date(expiryDate) < new Date();
  }

  /**
   * Formats a date to ISO string
   */
  static toISO(date: Date | string = new Date()): string {
    return new Date(date).toISOString();
  }

  /**
   * Adds days to a date
   */
  static addDays(date: Date | string, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Adds hours to a date
   */
  static addHours(date: Date | string, hours: number): Date {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  }

  /**
   * Gets the difference between two dates in seconds
   */
  static getDifferenceInSeconds(
    startDate: Date | string,
    endDate: Date | string,
  ): number {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return Math.floor((end - start) / 1000);
  }
}

export class StringHelper {
  /**
   * Generates a random string of specified length
   */
  static generateRandomString(length: number = 10): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generates a slug from a string
   */
  static generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  /**
   * Truncates a string to a specified length
   */
  static truncate(
    text: string,
    length: number,
    suffix: string = '...',
  ): string {
    if (text.length <= length) return text;
    return text.substring(0, length - suffix.length) + suffix;
  }

  /**
   * Capitalizes the first letter of a string
   */
  static capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
   * Converts a string to title case
   */
  static toTitleCase(text: string): string {
    return text.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
    );
  }
}
