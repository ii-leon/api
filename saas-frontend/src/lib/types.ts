export interface User {
  id: string
  email: string
  username: string
  fullName: string | null
  avatarUrl: string | null
  role: 'user' | 'admin' | 'super_admin'
  isVerified: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  twoFactorEnabled: boolean
  darkMode: boolean
  language: string
}

export interface Wallet {
  id: string
  userId: string
  balance: number
  currency: string
  isFrozen: boolean
  dailyTransferLimit: number
  dailyTransferUsed: number
}

export interface Transaction {
  id: string
  walletId: string
  type: TransactionType
  amount: number
  balanceBefore: number
  balanceAfter: number
  description: string | null
  referenceId: string | null
  relatedUserId: string | null
  status: 'pending' | 'completed' | 'failed' | 'reversed'
  createdAt: string
}

export type TransactionType =
  | 'topup'
  | 'transfer_in'
  | 'transfer_out'
  | 'ai_deduction'
  | 'refund'
  | 'withdrawal'
  | 'admin_adjustment'
  | 'p2p_debit'
  | 'p2p_credit'

export interface PayoutRequest {
  id: string
  userId: string
  amount: number
  amountIqd: number
  exchangeRate: number
  paymentMethod: string
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  referenceNumber: string | null
  adminNotes: string | null
  createdAt: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface WalletBalance {
  balance: number
  currency: string
}

export interface TransactionHistory {
  transactions: Transaction[]
  total: number
}
