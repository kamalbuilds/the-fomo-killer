import { CdpV2EvmWalletProvider } from '@coinbase/agentkit';
import winston from 'winston';

export interface CDPConfig {
  apiKeyId: string;
  apiKeySecret: string;
  walletSecret: string;
  networkId?: string;
}

/**
 * Attempts to initialize CDP wallet provider with graceful fallback
 */
export async function initializeCDPWallet(
  config: CDPConfig,
  logger: winston.Logger
): Promise<{ provider: CdpV2EvmWalletProvider | null; address: string | null }> {
  try {
    const cdpWalletConfig = {
      apiKeyId: config.apiKeyId,
      apiKeySecret: config.apiKeySecret,
      walletSecret: config.walletSecret,
      idempotencyKey: '',
      address: undefined as string | undefined,
      networkId: config.networkId || 'base-mainnet',
    };

    logger.info('Attempting CDP wallet initialization...');
    const provider = await CdpV2EvmWalletProvider.configureWithWallet(cdpWalletConfig);
    const address = provider.getAddress();
    
    logger.info('CDP wallet initialized successfully', { address });
    return { provider, address };
  } catch (error: any) {
    logger.warn('CDP wallet initialization failed, continuing without blockchain functionality', {
      error: error?.message || 'Unknown error',
      errorType: error?.errorType,
      statusCode: error?.statusCode,
    });
    
    // Return null to indicate CDP is not available
    return { provider: null, address: null };
  }
}

/**
 * Check if CDP credentials are configured
 */
export function hasCDPCredentials(): boolean {
  return !!(
    process.env.CDP_API_KEY_ID &&
    process.env.CDP_API_KEY_SECRET &&
    process.env.CDP_WALLET_SECRET
  );
}