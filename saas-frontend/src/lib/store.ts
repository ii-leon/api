import { create } from 'zustand'
import type { User, Wallet, Transaction, PayoutRequest } from './types'
import api from './api'

interface AppState {
  user: User | null
  wallet: Wallet | null
  transactions: Transaction[]
  transactionTotal: number
  payouts: PayoutRequest[]
  loading: boolean

  fetchMe: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; username: string; password: string; fullName?: string }) => Promise<void>
  logout: () => void
  fetchWallet: () => Promise<void>
  fetchTransactions: (page?: number, limit?: number) => Promise<void>
  fetchPayouts: () => Promise<void>
  transfer: (recipientUsername: string, amount: number) => Promise<void>
  requestTopUp: (amountIqd: number, referenceNumber: string) => Promise<void>
  requestPayout: (amount: number, paymentMethod: string, paymentDetails: Record<string, string>) => Promise<void>
  updateSettings: (settings: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    twoFactorEnabled?: boolean;
    darkMode?: boolean;
    language?: string;
  }) => Promise<void>
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  wallet: null,
  transactions: [],
  transactionTotal: 0,
  payouts: [],
  loading: false,

  fetchMe: async () => {
    try {
      const { data } = await api.get('/users/me')
      set({ user: data })
    } catch {
      set({ user: null })
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    set({ user: data.user })
  },

  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    set({ user: data.user })
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({ user: null, wallet: null, transactions: [] })
  },

  fetchWallet: async () => {
    try {
      const { data } = await api.get('/wallet/balance')
      set({ wallet: data })
    } catch { /* empty */ }
  },

  fetchTransactions: async (page = 1, limit = 20) => {
    try {
      const { data } = await api.get(`/wallet/transactions?page=${page}&limit=${limit}`)
      set({ transactions: data.transactions, transactionTotal: data.total })
    } catch { /* empty */ }
  },

  fetchPayouts: async () => {
    try {
      const { data } = await api.get('/payout/my-requests')
      set({ payouts: data })
    } catch { /* empty */ }
  },

  transfer: async (recipientUsername, amount) => {
    await api.post('/wallet/transfer', { recipientUsername, amount })
    get().fetchWallet()
    get().fetchTransactions()
  },

  requestTopUp: async (amountIqd, referenceNumber) => {
    await api.post('/wallet/topup', { amountIqd, referenceNumber })
  },

  requestPayout: async (amount, paymentMethod, paymentDetails) => {
    await api.post('/payout/request', { amount, paymentMethod, paymentDetails })
    get().fetchPayouts()
  },

  updateSettings: async (settings) => {
    const { data } = await api.patch('/users/me/settings', settings)
    set({ user: data })
  },
}))
