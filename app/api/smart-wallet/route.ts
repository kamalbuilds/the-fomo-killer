// Smart Wallet API endpoint for frictionless onboarding
// Demonstrates wallet-native user experiences
import { NextRequest, NextResponse } from 'next/server';
import { SmartWalletIntegration } from '../../../lib/wallet/smart-wallet-integration';

// Initialize Smart Wallet integration
const smartWallet = new SmartWalletIntegration({
  apiKeyId: process.env.CDP_API_KEY_ID!,
  apiKeySecret: process.env.CDP_API_KEY_SECRET!,
  walletSecret: process.env.CDP_WALLET_SECRET!,
  networkId: process.env.NETWORK_ID || 'base-sepolia',
  enableGasSponsorship: true,
  enableBatching: true,
});

/**
 * POST /api/smart-wallet - Create or manage smart wallet
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, ...params } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'create':
        const newUser = await smartWallet.createSmartWallet(userId);
        return NextResponse.json({
          success: true,
          user: newUser,
          message: 'Smart wallet created successfully',
        });

      case 'get_or_create':
        const user = await smartWallet.getOrCreateWallet(userId);
        return NextResponse.json({
          success: true,
          user,
          message: user.createdAt.getTime() === user.lastActive.getTime() 
            ? 'New smart wallet created' 
            : 'Existing wallet retrieved',
        });

      case 'send_transaction':
        const { to, value, data } = params;
        if (!to) {
          return NextResponse.json(
            { error: 'Recipient address (to) is required' },
            { status: 400 }
          );
        }

        const txResult = await smartWallet.executeSponsoredTransaction(
          userId,
          to,
          value,
          data
        );

        return NextResponse.json({
          success: true,
          transaction: txResult,
          message: `Transaction ${txResult.sponsored ? 'sponsored' : 'executed'} successfully`,
        });

      case 'batch_transactions':
        const { transactions } = params;
        if (!transactions || !Array.isArray(transactions)) {
          return NextResponse.json(
            { error: 'transactions array is required' },
            { status: 400 }
          );
        }

        const batchResult = await smartWallet.executeBatchTransactions(userId, transactions);
        
        return NextResponse.json({
          success: true,
          batch: batchResult,
          message: `Batch of ${batchResult.batchSize} transactions executed`,
        });

      case 'set_permissions':
        const { spender, token, amount, duration } = params;
        if (!spender || !token || !amount) {
          return NextResponse.json(
            { error: 'spender, token, and amount are required for permissions' },
            { status: 400 }
          );
        }

        const permissionResult = await smartWallet.setSpendingPermissions(userId, {
          spender,
          token,
          amount,
          duration,
        });

        return NextResponse.json({
          success: true,
          permission: permissionResult,
          message: 'Spending permissions set successfully',
        });

      case 'process_payment':
        const { toUserId, paymentAmount, paymentToken } = params;
        if (!toUserId || !paymentAmount || !paymentToken) {
          return NextResponse.json(
            { error: 'toUserId, paymentAmount, and paymentToken are required' },
            { status: 400 }
          );
        }

        const paymentResult = await smartWallet.processPayment(
          userId,
          toUserId,
          paymentAmount,
          paymentToken
        );

        return NextResponse.json({
          success: true,
          payment: paymentResult,
          message: 'Payment processed successfully',
        });

      case 'update_gas_sponsorship':
        const { enabled } = params;
        await smartWallet.updateGasSponsorship(userId, enabled);
        
        return NextResponse.json({
          success: true,
          message: `Gas sponsorship ${enabled ? 'enabled' : 'disabled'}`,
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Smart wallet API error:', error);
    return NextResponse.json(
      {
        error: 'Smart wallet operation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/smart-wallet - Get wallet details and stats
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const action = url.searchParams.get('action') || 'details';

    switch (action) {
      case 'details':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId parameter is required for wallet details' },
            { status: 400 }
          );
        }

        const walletDetails = await smartWallet.getWalletDetails(userId);
        return NextResponse.json({
          success: true,
          wallet: walletDetails,
        });

      case 'stats':
        const stats = smartWallet.getUserStats();
        return NextResponse.json({
          success: true,
          stats,
        });

      case 'payment_link':
        const amount = url.searchParams.get('amount');
        const token = url.searchParams.get('token');
        const description = url.searchParams.get('description');
        const recipientUserId = url.searchParams.get('recipientUserId');

        if (!amount || !token || !description) {
          return NextResponse.json(
            { error: 'amount, token, and description parameters are required' },
            { status: 400 }
          );
        }

        const paymentLink = smartWallet.createPaymentLink(
          amount,
          token,
          description,
          recipientUserId || undefined
        );

        return NextResponse.json({
          success: true,
          paymentLink,
        });

      case 'capabilities':
        return NextResponse.json({
          success: true,
          capabilities: {
            gasSponsorship: 'Eliminate gas fees for users',
            batchTransactions: 'Execute multiple operations in one transaction',
            spendPermissions: 'Set automated spending limits and permissions',
            smartContract: 'Advanced smart contract account features',
            crossChain: 'Multi-network support (Base, Ethereum)',
            faucet: 'Automatic testnet funding',
          },
          features: {
            frictionlessOnboarding: 'Create wallets without seed phrases',
            walletNativeUX: 'Embedded wallet experiences',
            gasAbstraction: 'Users never worry about gas fees',
            batchOptimization: 'Optimize multiple operations',
            programmableSecurity: 'Custom access controls and permissions',
          },
          networks: [
            { name: 'Base Mainnet', id: 'base-mainnet', sponsored: true },
            { name: 'Base Sepolia', id: 'base-sepolia', sponsored: true },
            { name: 'Ethereum', id: 'ethereum', sponsored: false },
          ],
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Smart wallet GET error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get wallet information',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/smart-wallet - Update wallet settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, settings } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const walletDetails = await smartWallet.getWalletDetails(userId);
    
    // Update gas sponsorship if specified
    if (typeof settings.gasSponsorship === 'boolean') {
      await smartWallet.updateGasSponsorship(userId, settings.gasSponsorship);
    }

    const updatedDetails = await smartWallet.getWalletDetails(userId);
    
    return NextResponse.json({
      success: true,
      wallet: updatedDetails,
      message: 'Wallet settings updated successfully',
    });
  } catch (error) {
    console.error('Smart wallet PUT error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update wallet settings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}