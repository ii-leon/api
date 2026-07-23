import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  TRANSFER_SENT = 'transfer_sent',
  TRANSFER_RECEIVED = 'transfer_received',
  TOPUP = 'topup',
  TOPUP_SUCCESS = 'topup_success',
  TOPUP_FAILED = 'topup_failed',
  WITHDRAWAL = 'withdrawal',
  PAYMENT = 'payment',
  SECURITY = 'security',
  SYSTEM = 'system',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    ip?: string;
    userAgent?: string;
    country?: string;
    city?: string;
    amount?: number;
    currency?: string;
    recipientUsername?: string;
    senderUsername?: string;
    transactionId?: string;
    paymentMethod?: string;
    status?: string;
    browser?: string;
    os?: string;
    device?: string;
    [key: string]: any;
  };

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
