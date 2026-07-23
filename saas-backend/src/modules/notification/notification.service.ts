import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
  ) {}

  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: any;
  }) {
    try {
      const notification = this.notificationRepo.create({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata || {},
      });
      await this.notificationRepo.save(notification);
      this.logger.log(`Notification created: ${data.type} for user ${data.userId}`);
      return notification;
    } catch (error) {
      this.logger.error('Failed to create notification', error.message);
    }
  }

  async findByUser(userId: string, limit = 50) {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getUnreadCount(userId: string) {
    return this.notificationRepo.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: string) {
    await this.notificationRepo.update(id, { isRead: true });
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true }
    );
  }

  async delete(id: string) {
    await this.notificationRepo.delete(id);
  }
}
