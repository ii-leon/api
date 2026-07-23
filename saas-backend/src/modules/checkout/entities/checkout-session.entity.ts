import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('checkout_sessions')
export class CheckoutSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', unique: true })
  sessionId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'merchant_name' })
  merchantName: string;

  @Column({ name: 'merchant_id', nullable: true })
  merchantId: string;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  amount: number;

  @Column({ length: 3, default: 'IQD' })
  currency: string;

  @Column({ name: 'amount_iqd', type: 'decimal', precision: 20, scale: 2 })
  amountIqd: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'order_id', nullable: true })
  orderId: string;

  @Column({ type: 'jsonb', nullable: true })
  items: any;

  @Column({ type: 'jsonb', nullable: true })
  customer: any;

  @Column({ name: 'callback_url', nullable: true })
  callbackUrl: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed', 'expired'],
    default: 'pending',
  })
  status: string;

  @Column({ name: 'payment_id', nullable: true })
  paymentId: string;

  @Column({ name: 'token_hash', nullable: true })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
