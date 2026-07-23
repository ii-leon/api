export interface JwtPayload {
  sub: string;
  email: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserFromJwt {
  id: string;
  email: string;
  username: string;
  role: string;
}

export interface TransferResult {
  senderBalance: number;
  recipientBalance: number;
  transactionId: string;
}

export interface DeductionResult {
  transactionId: string;
  remainingBalance: number;
  success: boolean;
}

export interface WalletBalance {
  balance: number;
  currency: string;
}

export interface TransactionHistory {
  transactions: any[];
  total: number;
}
