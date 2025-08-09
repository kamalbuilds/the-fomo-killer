// Smart Wallet Integration for frictionless onboarding
// Supports wallet-native user experiences for Code NYC
import { CdpClient } from '@coinbase/cdp-sdk';
import { createPublicClient, http, parseEther, Address } from 'viem';
import { base, baseSepolia } from 'viem/chains';

export interface SmartWalletConfig {
  apiKeyId: string;
  apiKeySecret: string;
  walletSecret: string;
  networkId: string;
  enableGasSponsorship?: boolean;
  enableBatching?: boolean;
}

export interface WalletUser {
  id: string;
  address: string;
  accountType: 'smart' | 'eoa';
  isGasSponsored: boolean;
  createdAt: Date;
  lastActive: Date;
}

export interface BatchTransaction {
  to: string;
  value?: string;
  data?: string;
  operation?: 'call' | 'delegatecall';
}

/**
 * Smart Wallet Integration for BasedAgents
 * Provides frictionless onboarding and wallet-native UX
 */
export class SmartWalletIntegration {
  private cdp: CdpClient;
  private config: SmartWalletConfig;
  private users: Map<string, WalletUser> = new Map();
  private publicClient: any;

  constructor(config: SmartWalletConfig) {
    this.config = config;
    this.cdp = new CdpClient();
    
    // Initialize viem public client for network operations
    const chain = config.networkId.includes('sepolia') ? baseSepolia : base;
    this.publicClient = createPublicClient({
      chain,
      transport: http(),
    });
  }

  /**
   * Create a new smart wallet for frictionless user onboarding
   */
  async createSmartWallet(userId: string): Promise<WalletUser> {
    try {
      console.log(`Creating smart wallet for user: ${userId}`);

      // Create EVM smart account using CDP SDK v2
      const account = await this.cdp.evm.createAccount({
        name: `based-agent-user-${userId}`,
        type: 'smart', // Request smart account
      });

      const user: WalletUser = {
        id: userId,
        address: account.address,
        accountType: 'smart',
        isGasSponsored: this.config.enableGasSponsorship || false,
        createdAt: new Date(),
        lastActive: new Date(),
      };

      this.users.set(userId, user);

      // Fund with testnet tokens if on testnet
      if (this.config.networkId.includes('sepolia')) {
        await this.fundTestnetWallet(account.address);
      }

      console.log(`Smart wallet created: ${account.address}`);
      return user;
    } catch (error) {
      console.error('Error creating smart wallet:', error);
      throw new Error(`Failed to create smart wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get or create user wallet (frictionless onboarding)
   */
  async getOrCreateWallet(userId: string): Promise<WalletUser> {
    const existingUser = this.users.get(userId);
    if (existingUser) {
      existingUser.lastActive = new Date();
      return existingUser;
    }

    return await this.createSmartWallet(userId);
  }

  /**
   * Execute a sponsored transaction (no gas fees for user)
   */
  async executeSponsoredTransaction(
    userId: string,
    to: string,
    value?: string,
    data?: string
  ): Promise<{ txHash: string; sponsored: boolean }> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User wallet not found');
    }

    try {
      // Use CDP smart account for sponsored transaction
      const account = await this.cdp.evm.getAccount({ name: `based-agent-user-${userId}` });
      
      const transaction = {
        to: to as Address,
        value: value ? parseEther(value) : undefined,
        data: data as `0x${string}` | undefined,
      };

      // CDP v2 Smart Accounts support gas sponsorship
      const result = await this.cdp.evm.sendTransaction({
        address: account.address,
        transaction,
        network: this.config.networkId,
        sponsored: this.config.enableGasSponsorship, // Enable gas sponsorship
      });

      user.lastActive = new Date();
      
      return {
        txHash: result.transactionHash,
        sponsored: this.config.enableGasSponsorship || false,
      };
    } catch (error) {
      console.error('Error executing sponsored transaction:', error);
      throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute batch transactions for gas optimization
   */
  async executeBatchTransactions(
    userId: string,
    transactions: BatchTransaction[]
  ): Promise<{ txHash: string; batchSize: number }> {
    const user = this.users.get(userId);
    if (!user || user.accountType !== 'smart') {
      throw new Error('Smart wallet required for batch transactions');
    }

    if (!this.config.enableBatching) {
      throw new Error('Batch transactions not enabled');
    }

    try {
      // CDP v2 Smart Accounts support transaction batching
      const account = await this.cdp.evm.getAccount({ name: `based-agent-user-${userId}` });
      
      // Convert to CDP batch format
      const batchOps = transactions.map(tx => ({
        to: tx.to as Address,
        value: tx.value ? parseEther(tx.value) : 0n,
        data: tx.data as `0x${string}` || '0x',
        operation: tx.operation === 'delegatecall' ? 1 : 0, // 0 = call, 1 = delegatecall
      }));

      // Execute as batch transaction
      const result = await this.cdp.evm.sendBatchTransaction({
        address: account.address,
        operations: batchOps,
        network: this.config.networkId,
        sponsored: this.config.enableGasSponsorship,
      });

      user.lastActive = new Date();

      return {
        txHash: result.transactionHash,
        batchSize: transactions.length,
      };
    } catch (error) {
      console.error('Error executing batch transactions:', error);
      throw new Error(`Batch transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set spending permissions for smart wallet
   */
  async setSpendingPermissions(
    userId: string,
    permissions: {
      spender: string;
      token: string;
      amount: string;
      duration?: number; // seconds
    }
  ): Promise<{ success: boolean; permissionId: string }> {
    const user = this.users.get(userId);
    if (!user || user.accountType !== 'smart') {
      throw new Error('Smart wallet required for spending permissions');
    }

    try {
      // CDP Smart Accounts support spend permissions
      // This would implement EIP-4337 spend permissions
      const permissionId = `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // In production, this would call the actual spend permission contract
      console.log(`Setting spend permission: ${permissions.spender} can spend ${permissions.amount} ${permissions.token}`);
      
      return {
        success: true,
        permissionId,
      };
    } catch (error) {
      console.error('Error setting spending permissions:', error);
      throw new Error(`Failed to set permissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get wallet balance and details
   */
  async getWalletDetails(userId: string): Promise<{
    address: string;
    balance: string;
    accountType: string;
    isGasSponsored: boolean;
    capabilities: string[];
  }> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User wallet not found');
    }

    try {
      // Get balance using public client
      const balance = await this.publicClient.getBalance({
        address: user.address as Address,
      });

      const capabilities = ['transfer', 'smart_contract_interaction'];
      
      if (user.accountType === 'smart') {
        capabilities.push('gas_sponsorship', 'batch_transactions', 'spend_permissions');
      }

      return {
        address: user.address,
        balance: (Number(balance) / 1e18).toString(),
        accountType: user.accountType,
        isGasSponsored: user.isGasSponsored,
        capabilities,
      };
    } catch (error) {
      console.error('Error getting wallet details:', error);
      throw new Error(`Failed to get wallet details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fund testnet wallet for development
   */
  private async fundTestnetWallet(address: string): Promise<void> {
    if (!this.config.networkId.includes('sepolia')) {
      return; // Only fund testnet wallets
    }

    try {
      const faucetResponse = await this.cdp.evm.requestFaucet({
        address,
        network: this.config.networkId,
        token: 'eth',
      });

      console.log(`Funded testnet wallet ${address}: ${faucetResponse.transactionHash}`);
    } catch (error) {
      console.warn('Failed to fund testnet wallet:', error);
      // Don't throw error, as faucet might be rate limited
    }
  }

  /**
   * Get user statistics
   */
  getUserStats(): {
    totalUsers: number;
    smartWallets: number;
    gasSponsored: number;
    activeToday: number;
  } {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const stats = {
      totalUsers: this.users.size,
      smartWallets: 0,
      gasSponsored: 0,
      activeToday: 0,
    };

    for (const user of this.users.values()) {
      if (user.accountType === 'smart') stats.smartWallets++;
      if (user.isGasSponsored) stats.gasSponsored++;
      if (user.lastActive >= dayStart) stats.activeToday++;
    }

    return stats;
  }

  /**
   * Enable/disable gas sponsorship for user
   */
  async updateGasSponsorship(userId: string, enabled: boolean): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User wallet not found');
    }

    user.isGasSponsored = enabled;
    user.lastActive = new Date();
    
    console.log(`Gas sponsorship ${enabled ? 'enabled' : 'disabled'} for user ${userId}`);
  }

  /**
   * Create a payment link for easy onboarding
   */
  createPaymentLink(
    amount: string,
    token: string,
    description: string,
    recipientUserId?: string
  ): string {
    const params = new URLSearchParams({
      amount,
      token,
      description,
      network: this.config.networkId,
    });

    if (recipientUserId) {
      const recipient = this.users.get(recipientUserId);
      if (recipient) {
        params.set('to', recipient.address);
      }
    }

    return `https://basedagents.xyz/pay?${params.toString()}`;
  }

  /**
   * Process incoming payment with smart wallet
   */
  async processPayment(
    fromUserId: string,
    toUserId: string,
    amount: string,
    token: string
  ): Promise<{ txHash: string; fromAddress: string; toAddress: string }> {
    const fromUser = this.users.get(fromUserId);
    const toUser = this.users.get(toUserId);

    if (!fromUser || !toUser) {
      throw new Error('User wallet(s) not found');
    }

    // Use smart wallet for sponsored payment
    const result = await this.executeSponsoredTransaction(
      fromUserId,
      toUser.address,
      amount
    );

    return {
      txHash: result.txHash,
      fromAddress: fromUser.address,
      toAddress: toUser.address,
    };
  }
}