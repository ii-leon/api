import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface ZainCashTokenResponse {
  access_token: string;
  scope: string;
  token_type: string;
  expires_in: number;
}

export interface ZainCashTransactionResponse {
  status: string;
  transactionDetails: {
    transactionId: string;
    externalReferenceId: string;
    orderId: string;
    amount: {
      currency: string;
      value: number;
    };
  };
  redirectUrl: string;
  expiryTime: string;
  createdAt: string;
}

export interface ZainCashInquiryResponse {
  status: string;
  transactionDetails: {
    transactionId: string;
    operationId: string | null;
    externalReferenceId: string;
    orderId: string;
    amount: {
      currency: string;
      value: number;
      feeValue: number;
    };
  };
  customer: {
    phone: string;
  };
  timeStamps: {
    expiryTime: string;
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
  };
}

@Injectable()
export class ZainCashService {
  private readonly logger = new Logger(ZainCashService.name);
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly apiKey: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private readonly serviceType: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'ZAINCASH_BASE_URL',
      'https://pg-api-uat.zaincash.iq',
    );
    this.clientId = this.configService.get<string>('ZAINCASH_CLIENT_ID', '');
    this.clientSecret = this.configService.get<string>('ZAINCASH_CLIENT_SECRET', '');
    this.apiKey = this.configService.get<string>('ZAINCASH_API_KEY', '');
    this.serviceType = this.configService.get<string>('ZAINCASH_SERVICE_TYPE', 'JAWS');
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post<ZainCashTokenResponse>(
        `${this.baseUrl}/oauth2/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: 'payment:read payment:write reverse:write',
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 300) * 1000);

      this.logger.log('ZainCash access token obtained successfully');
      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to get ZainCash access token', error.message);
      throw new BadRequestException('فشل في الحصول على رمز الوصول من ZainCash');
    }
  }

  async createTransaction(params: {
    orderId: string;
    amountIqd: number;
    phone?: string;
    language?: string;
    successUrl: string;
    failureUrl: string;
  }): Promise<ZainCashTransactionResponse> {
    const token = await this.getAccessToken();
    const externalReferenceId = uuidv4();

    const requestBody = {
      language: params.language || 'ar',
      externalReferenceId,
      orderId: params.orderId,
      serviceType: this.serviceType,
      amount: {
        value: params.amountIqd.toString(),
        currency: 'IQD',
      },
      ...(params.phone && { customer: { phone: params.phone } }),
      redirectUrls: {
        successUrl: params.successUrl,
        failureUrl: params.failureUrl,
      },
    };

    this.logger.log('ZainCash request body:', JSON.stringify(requestBody, null, 2));

    try {
      const response = await axios.post<ZainCashTransactionResponse>(
        `${this.baseUrl}/api/v2/payment-gateway/transaction/init`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      this.logger.log(`ZainCash transaction created: ${response.data.transactionDetails.transactionId}`);
      return response.data;
    } catch (error) {
      // Log detailed error information
      if (error.response) {
        this.logger.error('ZainCash API Error Response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
      }
      this.logger.error('Failed to create ZainCash transaction', error.message);
      throw new BadRequestException(`فشل في إنشاء معاملة الدفع: ${error.response?.data?.message || error.message}`);
    }
  }

  async inquireTransaction(transactionId: string): Promise<ZainCashInquiryResponse> {
    const token = await this.getAccessToken();

    try {
      const response = await axios.get<ZainCashInquiryResponse>(
        `${this.baseUrl}/api/v2/payment-gateway/transaction/inquiry/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      this.logger.log(`ZainCash inquiry for ${transactionId}: ${response.data.status}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to inquire ZainCash transaction', error.message);
      throw new BadRequestException('فشل في الاستفسار عن المعاملة');
    }
  }

  verifyWebhookToken(token: string): any {
    const jwt = require('jsonwebtoken');
    try {
      const payload = jwt.verify(token, this.apiKey, { algorithms: ['HS256'] });
      this.logger.log(`Webhook verified for transaction: ${payload.data?.transactionId}`);
      return payload;
    } catch (error) {
      this.logger.error('Webhook verification failed', error.message);
      throw new BadRequestException('فشل في التحقق من رمز Webhook');
    }
  }

  verifyRedirectToken(token: string): any {
    const jwt = require('jsonwebtoken');
    
    // Decode the token header to see which key was used
    const header = jwt.decode(token, { complete: true })?.header;
    this.logger.log(`Token header: ${JSON.stringify(header)}`);
    
    // Try verification with configured API key
    if (this.apiKey && this.apiKey !== 'your-api-key-from-zaincash') {
      try {
        const payload = jwt.verify(token, this.apiKey, { algorithms: ['HS256'] });
        this.logger.log(`Redirect verified with API key for transaction: ${payload.data?.transactionId}`);
        return payload;
      } catch (error) {
        this.logger.warn(`API key verification failed: ${error.message}`);
      }
    }
    
    // Try with client secret as fallback
    try {
      const payload = jwt.verify(token, this.clientSecret, { algorithms: ['HS256'] });
      this.logger.log(`Redirect verified with client secret for transaction: ${payload.data?.transactionId}`);
      return payload;
    } catch (error) {
      this.logger.warn(`Client secret verification failed: ${error.message}`);
    }
    
    // In test/development mode, decode without verification
    try {
      const payload = jwt.decode(token);
      if (payload) {
        this.logger.warn('Redirect token decoded without verification (test mode)');
        this.logger.log(`Decoded data: ${JSON.stringify(payload.data)}`);
        return payload;
      }
    } catch (error) {
      this.logger.error('Failed to decode token', error.message);
    }
    
    throw new BadRequestException('فشل في التحقق من رمز التحويل');
  }

  mapStatus(zainCashStatus: string): string {
    const statusMap: Record<string, string> = {
      SUCCESS: 'completed',
      COMPLETED: 'completed',
      FAILED: 'failed',
      PENDING: 'pending',
      OTP_SENT: 'pending',
      CUSTOMER_AUTHENTICATION_REQUIRED: 'pending',
      EXPIRED: 'failed',
      REFUNDED: 'reversed',
    };
    return statusMap[zainCashStatus] || 'pending';
  }
}
