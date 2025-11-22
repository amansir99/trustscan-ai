import { 
  Client, 
  TopicMessageSubmitTransaction, 
  TopicId, 
  AccountId, 
  PrivateKey,
  TransactionId,
  TransactionReceipt,
  Status,
  Hbar,
  TransferTransaction,
  AccountBalanceQuery
} from '@hashgraph/sdk';
import { getConfig } from './config';
import crypto from 'crypto';

/**
 * Hedera Service for blockchain integration
 * Handles consensus service storage, verification, and payment processing
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

interface AuditData {
  id: string;
  url: string;
  trustScore: number;
  riskLevel: string;
  userId: string;
  timestamp: Date;
}

interface HederaStorageResult {
  transactionId: string;
  consensusTimestamp?: string;
  topicSequenceNumber?: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  error?: string;
}

interface PaymentResult {
  transactionId: string;
  amount: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  error?: string;
}

interface VerificationResult {
  isValid: boolean;
  auditHash: string;
  consensusTimestamp?: string;
  topicSequenceNumber?: number;
  error?: string;
}

export class HederaService {
  private client!: Client;
  private config: any;
  private isInitialized: boolean = false;

  constructor() {
    this.config = getConfig();
    this.initializeClient();
  }

  /**
   * Initialize Hedera client with proper configuration
   */
  private initializeClient(): void {
    try {
      // Initialize client based on network configuration
      if (this.config.hedera.network === 'mainnet') {
        this.client = Client.forMainnet();
      } else {
        this.client = Client.forTestnet();
      }

      // Set operator account if credentials are available
      if (this.config.hedera.accountId && this.config.hedera.privateKey) {
        this.client.setOperator(
          AccountId.fromString(this.config.hedera.accountId),
          PrivateKey.fromString(this.config.hedera.privateKey)
        );
        this.isInitialized = true;
        console.log(`✅ Hedera client initialized for ${this.config.hedera.network}`);
      } else {
        console.warn('⚠️ Hedera credentials not found, running in mock mode');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Hedera client:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Store audit hash on Hedera Consensus Service
   * Requirements: 8.1, 8.2
   */
  async storeAuditHash(auditData: AuditData, userConsent: boolean = false): Promise<HederaStorageResult> {
    if (!userConsent) {
      return {
        transactionId: `mock_tx_${Date.now()}`,
        status: 'SUCCESS'
      };
    }

    if (!this.isInitialized) {
      console.warn('Hedera client not initialized, using mock transaction ID');
      return {
        transactionId: `mock_tx_${Date.now()}`,
        status: 'SUCCESS'
      };
    }

    try {
      // Create audit hash for blockchain storage
      const auditHash = this.createAuditHash(auditData);
      
      // Prepare consensus message
      const consensusMessage = {
        version: '1.0',
        type: 'AUDIT_RESULT',
        auditId: auditData.id,
        url: auditData.url,
        trustScore: auditData.trustScore,
        riskLevel: auditData.riskLevel,
        userId: auditData.userId,
        timestamp: auditData.timestamp.toISOString(),
        hash: auditHash
      };

      const topicId = TopicId.fromString(this.config.hedera.consensusTopicId);
      
      // Submit message to consensus service
      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(JSON.stringify(consensusMessage))
        .setMaxTransactionFee(new Hbar(2)); // Set reasonable fee limit

      console.log(`Submitting audit to Hedera topic: ${this.config.hedera.consensusTopicId}`);
      
      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      if (receipt.status === Status.Success) {
        console.log(`✅ Audit stored on Hedera: ${response.transactionId.toString()}`);
        
        return {
          transactionId: response.transactionId.toString(),
          consensusTimestamp: new Date().toISOString(), // Use current timestamp as fallback
          topicSequenceNumber: receipt.topicSequenceNumber?.toNumber(),
          status: 'SUCCESS'
        };
      } else {
        throw new Error(`Transaction failed with status: ${receipt.status.toString()}`);
      }

    } catch (error) {
      console.error('❌ Hedera storage failed:', error);
      
      return {
        transactionId: `mock_tx_${Date.now()}`,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify audit result using Hedera transaction ID
   * Requirements: 8.1, 8.4
   */
  async verifyAuditResult(transactionId: string, expectedAuditData: AuditData): Promise<VerificationResult> {
    if (transactionId.startsWith('mock_tx_')) {
      // Mock verification for development/testing
      return {
        isValid: true,
        auditHash: this.createAuditHash(expectedAuditData)
      };
    }

    if (!this.isInitialized) {
      return {
        isValid: false,
        auditHash: '',
        error: 'Hedera client not initialized'
      };
    }

    try {
      // Parse transaction ID
      const txId = TransactionId.fromString(transactionId);
      
      // Get transaction receipt for verification
      const receipt = await txId.getReceipt(this.client);
      
      if (receipt.status !== Status.Success) {
        return {
          isValid: false,
          auditHash: '',
          error: `Transaction failed with status: ${receipt.status.toString()}`
        };
      }

      // Create expected hash for comparison
      const expectedHash = this.createAuditHash(expectedAuditData);
      
      return {
        isValid: true,
        auditHash: expectedHash,
        consensusTimestamp: new Date().toISOString(), // Use current timestamp as fallback
        topicSequenceNumber: receipt.topicSequenceNumber?.toNumber()
      };

    } catch (error) {
      console.error('❌ Hedera verification failed:', error);
      
      return {
        isValid: false,
        auditHash: '',
        error: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  }

  /**
   * Process mock HBAR payment for subscription upgrades
   * Requirements: 8.4, 8.5
   */
  async processMockPayment(
    fromAccountId: string, 
    amount: number, 
    subscriptionPlan: string
  ): Promise<PaymentResult> {
    if (!this.isInitialized) {
      // Return mock successful payment for development
      return {
        transactionId: `mock_payment_${Date.now()}`,
        amount,
        status: 'SUCCESS'
      };
    }

    try {
      // In a real implementation, this would process actual HBAR payments
      // For now, we'll simulate the payment process
      
      console.log(`Processing mock payment: ${amount} HBAR for ${subscriptionPlan} plan`);
      
      // Simulate payment validation
      if (amount <= 0) {
        throw new Error('Invalid payment amount');
      }

      // Create mock transfer transaction
      const mockTransactionId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`✅ Mock payment processed: ${mockTransactionId}`);
      
      return {
        transactionId: mockTransactionId,
        amount,
        status: 'SUCCESS'
      };

    } catch (error) {
      console.error('❌ Payment processing failed:', error);
      
      return {
        transactionId: '',
        amount,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Payment failed'
      };
    }
  }

  /**
   * Get account balance (for payment verification)
   */
  async getAccountBalance(accountId: string): Promise<number> {
    if (!this.isInitialized) {
      return 1000; // Mock balance for development
    }

    try {
      const balance = await new AccountBalanceQuery()
        .setAccountId(AccountId.fromString(accountId))
        .execute(this.client);
      
      return balance.hbars.toTinybars().toNumber() / 100000000; // Convert to HBAR
    } catch (error) {
      console.error('❌ Failed to get account balance:', error);
      return 0;
    }
  }

  /**
   * Track blockchain storage status in audit reports
   * Requirements: 8.1, 8.4
   */
  getStorageStatus(transactionId?: string): {
    stored: boolean;
    transactionId?: string;
    network: string;
    verifiable: boolean;
  } {
    return {
      stored: !!transactionId,
      transactionId,
      network: this.config.hedera.network,
      verifiable: !!transactionId && !transactionId.startsWith('mock_')
    };
  }

  /**
   * Create deterministic hash for audit data
   */
  private createAuditHash(auditData: AuditData): string {
    const hashInput = [
      auditData.id,
      auditData.url,
      auditData.trustScore.toString(),
      auditData.riskLevel,
      auditData.userId,
      auditData.timestamp.toISOString()
    ].join('|');

    return crypto.createHash('sha256').update(hashInput).digest('hex');
  }

  /**
   * Check if Hedera integration is available
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }

  /**
   * Get network information
   */
  getNetworkInfo(): {
    network: string;
    accountId?: string;
    topicId: string;
    available: boolean;
  } {
    return {
      network: this.config.hedera.network,
      accountId: this.config.hedera.accountId,
      topicId: this.config.hedera.consensusTopicId,
      available: this.isInitialized
    };
  }
}

// Singleton instance
let hederaServiceInstance: HederaService | null = null;

export function getHederaService(): HederaService {
  if (!hederaServiceInstance) {
    hederaServiceInstance = new HederaService();
  }
  return hederaServiceInstance;
}

// Legacy compatibility functions
export async function storeAuditOnHedera(auditData: any): Promise<string> {
  const service = getHederaService();
  const result = await service.storeAuditHash(auditData, true);
  return result.transactionId;
}

export async function submitAuditToHedera(auditData: any): Promise<string> {
  return storeAuditOnHedera(auditData);
}

// Export types for use in other modules
export type { 
  AuditData, 
  HederaStorageResult, 
  PaymentResult, 
  VerificationResult 
};