import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async getMe(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'username', 'fullName', 'avatarUrl', 'role', 'isVerified', 'isActive', 'createdAt', 'emailNotifications', 'pushNotifications', 'twoFactorEnabled', 'darkMode', 'language'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateMe(userId: string, data: { fullName?: string; avatarUrl?: string }) {
    await this.userRepo.update(userId, data);
    return this.getMe(userId);
  }

  async updateSettings(userId: string, settings: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    twoFactorEnabled?: boolean;
    darkMode?: boolean;
    language?: string;
  }) {
    await this.userRepo.update(userId, settings);
    return this.getMe(userId);
  }

  async checkUsername(username: string) {
    const user = await this.userRepo.findOne({
      where: { username },
      select: ['id', 'username', 'fullName'],
    });
    return {
      exists: !!user,
      username: user?.username,
      fullName: user?.fullName,
    };
  }
}
