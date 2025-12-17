/* eslint-disable @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common';
// Import models as needed

import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class AdminService {
  constructor(private readonly analyticsService: AnalyticsService) { }

  async getDashboard() {
    return this.analyticsService.getDashboardStats()
  }
}
