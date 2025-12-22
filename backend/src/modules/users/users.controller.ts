import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { FilesService } from '../files/files.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../common/interfaces/user.interface'; // Interface for current user
import { User as UserDocument } from '../auth/schemas/user.schema'; // For full user
import * as bcrypt from 'bcrypt';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private filesService: FilesService,
  ) {}

  @Get()
  @Roles('admin')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  findOne(@Param('id') id: string): Promise<UserDocument> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'user', 'seller')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: User,
  ) {
    // Self-update check
    if (user.role !== 'admin' && user.id !== id) {
      throw new Error('Unauthorized to update this user');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Post(':id/delete')
  @Roles('admin', 'user', 'seller')
  async verifyAndDelete(
    @Param('id') id: string,
    @Body('password') password: string,
    @CurrentUser() user: User,
  ) {
    if (user.role !== 'admin' && user.id !== id) {
      throw new Error('Unauthorized to delete this user');
    }

    if (user.role !== 'admin') {
      if (!password) {
        throw new Error('Password is required for account deletion');
      }
      // Fetch user with password
      const userDoc = await this.usersService.findByIdWithPassword(id);
      if (!userDoc) {
        throw new Error('User not found');
      }
      const isPasswordValid = await bcrypt.compare(password, userDoc.password);
      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }
    }

    // If admin is deleting someone else, password might not be required or verified?
    // Requirement says "user can delete his password to enter the password for confirmation".
    // I will enforce it for self-deletion.

    return this.usersService.remove(id);
  }

  @Post(':id/avatar')
  @Roles('admin', 'user', 'seller')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    // Self-update check
    if (user.role !== 'admin' && user.id !== id) {
      throw new Error('Unauthorized to update this user');
    }

    const uploadResult = (await this.filesService.uploadFile(file)) as {
      secure_url: string;
    };
    return this.usersService.update(id, {
      avatar: uploadResult.secure_url,
    } as UpdateUserDto);
  }
  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
