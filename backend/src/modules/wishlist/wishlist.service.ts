import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wishlist, WishlistDocument } from './schemas/wishlist.schema';

import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name) private wishlistModel: Model<WishlistDocument>,
  ) { }

  async findAll(userId: string): Promise<WishlistDocument[]> {
    return this.wishlistModel.find({ userId: new Types.ObjectId(userId) })
      .populate('items.productId')
      .exec();
  }

  async create(userId: string, name: string): Promise<WishlistDocument> {
    const wishlist = new this.wishlistModel({
      userId: new Types.ObjectId(userId),
      name,
      shareToken: uuidv4(),
    });
    return wishlist.save();
  }

  async findOne(id: string, userId: string): Promise<WishlistDocument> {
    const wishlist = await this.wishlistModel.findOne({ _id: id, userId: new Types.ObjectId(userId) }).populate('items.productId').exec();
    if (!wishlist) throw new NotFoundException('Wishlist not found');
    return wishlist;
  }

  async findByToken(token: string): Promise<WishlistDocument> {
    const wishlist = await this.wishlistModel.findOne({ shareToken: token, privacy: 'public' }).populate('items.productId').exec();
    if (!wishlist) throw new NotFoundException('Wishlist not found or is private');
    return wishlist;
  }

  async updatePrivacy(id: string, userId: string, privacy: string): Promise<WishlistDocument> {
    const wishlist = await this.wishlistModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      { privacy },
      { new: true }
    );
    if (!wishlist) throw new NotFoundException('Wishlist not found');
    return wishlist;
  }

  // Add Item to specific wishlist (or create default if none exists and no ID provided)
  async add(userId: string, productId: string, wishlistId?: string): Promise<WishlistDocument> {
    console.log(`[WishlistService.add] Request - User: ${userId}, Product: ${productId}, TargetList: ${wishlistId}`);
    let targetId = wishlistId;

    if (!targetId) {
      // Find default or first wishlist
      let def: WishlistDocument | null = await this.wishlistModel.findOne({ userId: new Types.ObjectId(userId) }).sort({ createdAt: 1 });
      if (!def) {
        def = await this.create(userId, 'My Wishlist');
      }
      targetId = def._id.toString();
      console.log(`[WishlistService.add] Defaulting to wishlist: ${targetId}`);
    }

    const updatedWishlist = await this.wishlistModel
      .findOneAndUpdate(
        { _id: targetId, userId: new Types.ObjectId(userId) },
        {
          $addToSet: {
            items: {
              productId: new Types.ObjectId(productId),
              isBought: false,
              boughtBy: null,
              addedAt: new Date()
            }
          },
        },
        { new: true }
      )
      .populate('items.productId')
      .exec();

    if (!updatedWishlist) {
      console.error(`[WishlistService.add] Wishlist not found for ID: ${targetId}`);
      throw new NotFoundException('Wishlist not found');
    }

    console.log(`[WishlistService.add] Success. Product count: ${updatedWishlist.items.length}`);
    return updatedWishlist;
  }

  async remove(userId: string, productId: string, wishlistId?: string): Promise<WishlistDocument> {
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (wishlistId) filter._id = wishlistId;

    const updatedWishlist = await this.wishlistModel
      .findOneAndUpdate(
        filter,
        { $pull: { items: { productId: new Types.ObjectId(productId) } } },
        { new: true }
      )
      .populate('items.productId')
      .exec();

    if (!updatedWishlist) {
      throw new NotFoundException('Wishlist not found');
    }

    return updatedWishlist;
  }

  async delete(id: string, userId: string): Promise<WishlistDocument> {
    const wishlist = await this.wishlistModel.findOneAndDelete({ _id: id, userId: new Types.ObjectId(userId) }).exec();
    if (!wishlist) throw new NotFoundException('Wishlist not found');
    return wishlist;
  }

  async update(id: string, userId: string, updateData: { name?: string }): Promise<WishlistDocument> {
    const wishlist = await this.wishlistModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      updateData,
      { new: true }
    ).exec();
    if (!wishlist) throw new NotFoundException('Wishlist not found');
    return wishlist;
  }

  async toggleBoughtStatus(shareToken: string, productId: string, boughtBy: string): Promise<WishlistDocument> {
    const wishlist = await this.wishlistModel.findOne({ shareToken, privacy: 'public' }).exec();
    if (!wishlist) throw new NotFoundException('Wishlist not found or not public');

    const itemIndex = wishlist.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex === -1) throw new NotFoundException('Product not found in wishlist');

    // Toggle
    const currentStatus = wishlist.items[itemIndex].isBought;
    wishlist.items[itemIndex].isBought = !currentStatus;
    wishlist.items[itemIndex].boughtBy = !currentStatus ? boughtBy : null;

    await wishlist.save();
    return this.wishlistModel.findById(wishlist._id).populate('items.productId').exec();
  }
}
