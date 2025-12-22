import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  revenueGrowth: number;
  ordersGrowth: number;
  averageOrderValue: number;
  topSellingProducts: any[];
  recentOrders: any[];
  revenueByMonth: any[];
  ordersByStatus: any[];
  customersByMonth: any[];
}

export interface SalesReport {
  period: string;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: any[];
  topCategories: any[];
}

export interface CustomerInsights {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerLifetimeValue: number;
  topCustomers: any[];
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total revenue (all time)
    const revenueResult = await this.orderModel.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Revenue this month
    const currentMonthRevenue = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: currentMonth },
          orderStatus: { $ne: 'cancelled' },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const thisMonthRevenue = currentMonthRevenue[0]?.total || 0;

    // Revenue last month
    const lastMonthRevenue = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: lastMonth, $lt: currentMonth },
          orderStatus: { $ne: 'cancelled' },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const prevMonthRevenue = lastMonthRevenue[0]?.total || 1;

    // Calculate growth
    const revenueGrowth =
      ((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100;

    // Total orders
    const totalOrders = await this.orderModel.countDocuments({
      orderStatus: { $ne: 'cancelled' },
    });

    // Orders this month
    const ordersThisMonth = await this.orderModel.countDocuments({
      createdAt: { $gte: currentMonth },
      orderStatus: { $ne: 'cancelled' },
    });

    // Orders last month
    const ordersLastMonth = await this.orderModel.countDocuments({
      createdAt: { $gte: lastMonth, $lt: currentMonth },
      orderStatus: { $ne: 'cancelled' },
    });

    const ordersGrowth =
      ordersLastMonth > 0
        ? ((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100
        : 0;

    // Total products
    const totalProducts = await this.productModel.countDocuments({
      isActive: true,
    });

    // Total customers
    const totalCustomers = await this.userModel.countDocuments({
      role: 'customer',
    });

    // Average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Top selling products
    const topSellingProducts = await this.productModel
      .find({ isActive: true })
      .sort({ soldCount: -1 })
      .limit(5)
      .select('title soldCount price thumbnail')
      .exec();

    // Recent orders
    const recentOrders = await this.orderModel
      .find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email')
      .select('_id totalAmount orderStatus paymentStatus createdAt')
      .exec();

    // Revenue by month (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const revenueByMonth = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          orderStatus: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Orders by status
    const ordersByStatus = await this.orderModel.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    // Customers by month (last 6 months)
    const customersByMonth = await this.userModel.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          role: 'customer',
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      totalProducts,
      totalCustomers,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      ordersGrowth: Math.round(ordersGrowth * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      topSellingProducts,
      recentOrders,
      revenueByMonth,
      ordersByStatus,
      customersByMonth,
    };
  }

  async getSalesReport(startDate: Date, endDate: Date): Promise<SalesReport> {
    const orders = await this.orderModel
      .find({
        createdAt: { $gte: startDate, $lte: endDate },
        orderStatus: { $ne: 'cancelled' },
      })
      .populate({
        path: 'items.productId',
        select: 'title categoryId',
        populate: { path: 'categoryId', select: 'name' },
      })
      .exec();

    const totalSales = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Calculate top products
    const productSales = new Map();
    orders.forEach((order) => {
      order.items.forEach((item: any) => {
        const productId = item.productId?._id?.toString();
        if (productId) {
          const existing = productSales.get(productId) || {
            product: item.productId,
            quantity: 0,
            revenue: 0,
          };
          existing.quantity += item.quantity;
          existing.revenue += item.price * item.quantity;
          productSales.set(productId, existing);
        }
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((item) => ({
        product: item.product.title,
        quantity: item.quantity,
        revenue: Math.round(item.revenue * 100) / 100,
      }));

    // Calculate top categories
    const categorySales = new Map();
    orders.forEach((order) => {
      order.items.forEach((item: any) => {
        const categoryId = item.productId?.categoryId?._id?.toString();
        const categoryName = item.productId?.categoryId?.name;
        if (categoryId && categoryName) {
          const existing = categorySales.get(categoryId) || {
            category: categoryName,
            revenue: 0,
          };
          existing.revenue += item.price * item.quantity;
          categorySales.set(categoryId, existing);
        }
      });
    });

    const topCategories = Array.from(categorySales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((item) => ({
        category: item.category,
        revenue: Math.round(item.revenue * 100) / 100,
      }));

    return {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      totalSales: Math.round(totalSales * 100) / 100,
      totalOrders,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      topProducts,
      topCategories,
    };
  }

  async getCustomerInsights(): Promise<CustomerInsights> {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const totalCustomers = await this.userModel.countDocuments({
      role: 'customer',
    });
    const newCustomers = await this.userModel.countDocuments({
      role: 'customer',
      createdAt: { $gte: lastMonth },
    });

    // Calculate returning customers (customers with more than one order)
    const customerOrders = await this.orderModel.aggregate([
      { $group: { _id: '$userId', orderCount: { $sum: 1 } } },
      { $match: { orderCount: { $gt: 1 } } },
      { $count: 'returningCustomers' },
    ]);
    const returningCustomers = customerOrders[0]?.returningCustomers || 0;

    // Calculate average customer lifetime value
    const lifetimeValueResult = await this.orderModel.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: '$userId', totalSpent: { $sum: '$totalAmount' } } },
      { $group: { _id: null, avgLifetimeValue: { $avg: '$totalSpent' } } },
    ]);
    const customerLifetimeValue = lifetimeValueResult[0]?.avgLifetimeValue || 0;

    // Top customers by spending
    const topCustomersData = await this.orderModel.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$userId',
          totalSpent: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
    ]);

    const topCustomers = await Promise.all(
      topCustomersData.map(async (data) => {
        const user = await this.userModel
          .findById(data._id)
          .select('name email');
        return {
          customer: user?.name || 'Unknown',
          email: user?.email || '',
          totalSpent: Math.round(data.totalSpent * 100) / 100,
          orderCount: data.orderCount,
        };
      }),
    );

    return {
      totalCustomers,
      newCustomers,
      returningCustomers,
      customerLifetimeValue: Math.round(customerLifetimeValue * 100) / 100,
      topCustomers,
    };
  }

  async getProductAnalytics(productId: string) {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Get orders containing this product
    const orders = await this.orderModel.find({
      'items.productId': productId,
      orderStatus: { $ne: 'cancelled' },
    });

    const totalSold = orders.reduce((sum, order) => {
      const item = order.items.find(
        (i: any) => i.productId.toString() === productId,
      );
      return sum + (item?.quantity || 0);
    }, 0);

    const totalRevenue = orders.reduce((sum, order) => {
      const item = order.items.find(
        (i: any) => i.productId.toString() === productId,
      );
      return sum + (item ? item.price * item.quantity : 0);
    }, 0);

    return {
      productId,
      productName: product.title,
      totalSold,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      viewCount: product.viewCount,
      conversionRate:
        product.viewCount > 0
          ? Math.round((totalSold / product.viewCount) * 10000) / 100
          : 0,
      currentStock: product.stock,
      rating: product.rating,
    };
  }
}
