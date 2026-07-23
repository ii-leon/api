import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Transaction } from './transaction.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 8,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  balance: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ name: 'is_frozen', type: 'boolean', default: false })
  isFrozen: boolean;

  @Column({ name: 'frozen_reason', type: 'varchar', nullable: true, length: 255 })
  frozenReason: string | null;

  @Column({
    name: 'daily_transfer_limit',
    type: 'decimal',
    precision: 20,
    scale: 8,
    default: 1000,
  })
  dailyTransferLimit: number;

  @Column({
    name: 'daily_transfer_used',
    type: 'decimal',
    precision: 20,
    scale: 8,
    default: 0,
  })
  dailyTransferUsed: number;

  @Column({ name: 'daily_transfer_reset_at', type: 'timestamptz', default: () => 'NOW()' })
  dailyTransferResetAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.wallet)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Transaction, (transaction) => transaction.wallet)
  transactions: Transaction[];
}
