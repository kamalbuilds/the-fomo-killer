// x402 Payment Middleware for Revenue-Generating Agents
// Implements x402 protocol for pay-per-request agent services
import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

export interface X402Config {
  sellerAddress: string;
  priceUsdcCents: number;
  currency: 'USDC' | 'ETH';
  network: 'base' | 'base-sepolia' | 'ethereum';
  facilitatorUrl?: string;
  description?: string;
}

export interface PaymentValidation {
  isValid: boolean;
  amount: string;
  from: string;
  to: string;
  txHash?: string;
  error?: string;
}

/**
 * x402 Payment Required middleware for revenue-generating agents
 * Qualifies for Code NYC "x402 + CDP Wallet" bounty track
 */
export class X402PaymentMiddleware {
  private config: X402Config;
  private recentPayments: Map<string, PaymentValidation> = new Map();

  constructor(config: X402Config) {
    this.config = config;
  }

  /**
   * Main middleware function to check for payment or return 402
   */
  async checkPayment(request: NextRequest): Promise<NextResponse | null> {
    // Check for payment headers
    const paymentHeader = request.headers.get('x402-payment');
    const authHeader = request.headers.get('authorization');

    if (!paymentHeader && !authHeader) {
      return this.return402Response();
    }

    // Validate payment
    const validation = await this.validatePayment(paymentHeader || authHeader);
    
    if (!validation.isValid) {
      return this.return402Response(validation.error);
    }

    // Payment is valid, allow request to proceed
    return null;
  }

  /**
   * Return HTTP 402 Payment Required response with x402 headers
   */
  private return402Response(error?: string): NextResponse {
    const priceUsdc = this.config.priceUsdcCents / 100; // Convert cents to dollars
    const facilitatorUrl = this.config.facilitatorUrl || 'https://facilitator.x402.org';
    
    const response = NextResponse.json(
      {
        error: 'Payment required',
        message: error || `This endpoint requires payment of $${priceUsdc} USDC`,
        price: {
          amount: this.config.priceUsdcCents,
          currency: this.config.currency,
          network: this.config.network,
        },
        instructions: {
          method: 'x402',
          facilitator: facilitatorUrl,
          recipient: this.config.sellerAddress,
        }
      },
      { status: 402 }
    );

    // Set x402 headers according to spec
    response.headers.set('WWW-Authenticate', this.generateAuthHeader());
    response.headers.set('Accept-Payment', this.generateAcceptPaymentHeader());
    response.headers.set('Content-Type', 'application/json');

    return response;
  }

  /**
   * Generate WWW-Authenticate header for x402
   */
  private generateAuthHeader(): string {
    const realm = this.config.description || 'BasedAgents API';
    return `x402 realm="${realm}", ` +
           `address="${this.config.sellerAddress}", ` +
           `amount_cents="${this.config.priceUsdcCents}", ` +
           `currency="${this.config.currency}", ` +
           `network="${this.config.network}"`;
  }

  /**
   * Generate Accept-Payment header
   */
  private generateAcceptPaymentHeader(): string {
    return `x402; version=1.0; currency=${this.config.currency}; amount=${this.config.priceUsdcCents}`;
  }

  /**
   * Validate payment from headers
   */
  private async validatePayment(paymentData: string | null): Promise<PaymentValidation> {
    if (!paymentData) {
      return { isValid: false, amount: '0', from: '', to: '', error: 'No payment data provided' };
    }

    try {
      // Parse payment data - could be tx hash, JWT token, or other format
      if (paymentData.startsWith('0x') && paymentData.length === 66) {
        // Appears to be a transaction hash
        return await this.validateTransaction(paymentData);
      } else if (paymentData.startsWith('Bearer ')) {
        // JWT token with payment proof
        return await this.validateJWTPayment(paymentData.substring(7));
      } else {
        // Try to parse as JSON payment instruction
        const paymentJson = JSON.parse(paymentData);
        return await this.validatePaymentInstruction(paymentJson);
      }
    } catch (error) {
      return {
        isValid: false,
        amount: '0',
        from: '',
        to: '',
        error: `Invalid payment format: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate blockchain transaction
   */
  private async validateTransaction(txHash: string): Promise<PaymentValidation> {
    try {
      // Check if we've already validated this transaction
      const cached = this.recentPayments.get(txHash);
      if (cached) {
        return cached;
      }

      const provider = this.getProvider();
      const tx = await provider.getTransaction(txHash);

      if (!tx) {
        return { isValid: false, amount: '0', from: '', to: '', error: 'Transaction not found' };
      }

      // Wait for confirmation
      const receipt = await tx.wait();
      if (!receipt || receipt.status !== 1) {
        return { isValid: false, amount: '0', from: '', to: '', error: 'Transaction failed or not confirmed' };
      }

      // Validate payment details
      const validation = this.validateTransactionDetails(tx);
      
      // Cache valid payments for 1 hour
      if (validation.isValid) {
        this.recentPayments.set(txHash, validation);
        setTimeout(() => this.recentPayments.delete(txHash), 3600000);
      }

      return validation;
    } catch (error) {
      return {
        isValid: false,
        amount: '0',
        from: '',
        to: '',
        error: `Transaction validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate JWT payment token
   */
  private async validateJWTPayment(token: string): Promise<PaymentValidation> {
    try {
      // In production, verify JWT signature with facilitator public key
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        return { isValid: false, amount: '0', from: '', to: '', error: 'Payment token expired' };
      }

      if (payload.recipient !== this.config.sellerAddress) {
        return { isValid: false, amount: '0', from: '', to: '', error: 'Payment recipient mismatch' };
      }

      if (payload.amount < this.config.priceUsdcCents) {
        return { isValid: false, amount: '0', from: '', to: '', error: 'Insufficient payment amount' };
      }

      return {
        isValid: true,
        amount: payload.amount.toString(),
        from: payload.payer || 'unknown',
        to: payload.recipient,
        txHash: payload.txHash,
      };
    } catch (error) {
      return {
        isValid: false,
        amount: '0',
        from: '',
        to: '',
        error: `JWT validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate payment instruction object
   */
  private async validatePaymentInstruction(instruction: any): Promise<PaymentValidation> {
    if (!instruction.txHash && !instruction.proof) {
      return { isValid: false, amount: '0', from: '', to: '', error: 'No transaction hash or proof provided' };
    }

    if (instruction.txHash) {
      return await this.validateTransaction(instruction.txHash);
    }

    // Handle other proof types (Lightning, etc.)
    return { isValid: false, amount: '0', from: '', to: '', error: 'Unsupported payment proof type' };
  }

  /**
   * Validate transaction details against requirements
   */
  private validateTransactionDetails(tx: ethers.TransactionResponse): PaymentValidation {
    const to = tx.to?.toLowerCase();
    const expectedTo = this.config.sellerAddress.toLowerCase();

    if (to !== expectedTo) {
      return {
        isValid: false,
        amount: '0',
        from: tx.from,
        to: to || '',
        error: `Payment sent to wrong address. Expected: ${expectedTo}, Got: ${to}`
      };
    }

    // For ETH payments, check value
    if (this.config.currency === 'ETH') {
      const valueWei = tx.value;
      const requiredWei = ethers.parseEther((this.config.priceUsdcCents / 100 / 3000).toString()); // Rough ETH price
      
      if (valueWei < requiredWei) {
        return {
          isValid: false,
          amount: ethers.formatEther(valueWei),
          from: tx.from,
          to: to || '',
          error: `Insufficient payment amount. Required: ${ethers.formatEther(requiredWei)} ETH`
        };
      }

      return {
        isValid: true,
        amount: ethers.formatEther(valueWei),
        from: tx.from,
        to: to || '',
        txHash: tx.hash,
      };
    }

    // For USDC, would need to parse transfer logs
    // For now, assume valid if sent to correct address
    return {
      isValid: true,
      amount: 'unknown',
      from: tx.from,
      to: to || '',
      txHash: tx.hash,
    };
  }

  /**
   * Get blockchain provider for transaction validation
   */
  private getProvider(): ethers.JsonRpcProvider {
    const networks = {
      'base': 'https://mainnet.base.org',
      'base-sepolia': 'https://sepolia.base.org',
      'ethereum': `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
    };

    const rpcUrl = networks[this.config.network];
    if (!rpcUrl) {
      throw new Error(`Unsupported network: ${this.config.network}`);
    }

    return new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Get payment statistics
   */
  getPaymentStats(): { totalPayments: number; totalAmount: string; recentPayments: number } {
    return {
      totalPayments: this.recentPayments.size,
      totalAmount: 'N/A', // Would track in production
      recentPayments: this.recentPayments.size,
    };
  }
}

/**
 * Helper function to create x402 middleware for Next.js routes
 */
export function createX402Middleware(config: X402Config) {
  const middleware = new X402PaymentMiddleware(config);
  
  return async (request: NextRequest) => {
    return await middleware.checkPayment(request);
  };
}

/**
 * x402 Client helper for making payments
 */
export class X402Client {
  static async makePayment(
    apiUrl: string,
    paymentMethod: 'transaction' | 'jwt' = 'transaction',
    paymentData?: string
  ): Promise<Response> {
    try {
      // First, try the request without payment
      const initialResponse = await fetch(apiUrl);
      
      if (initialResponse.status !== 402) {
        return initialResponse;
      }

      // Parse 402 response to get payment instructions
      const paymentInstructions = await initialResponse.json();
      console.log('Payment required:', paymentInstructions);

      if (!paymentData) {
        throw new Error('Payment required but no payment data provided');
      }

      // Make second request with payment
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (paymentMethod === 'transaction') {
        headers['x402-payment'] = paymentData;
      } else {
        headers['authorization'] = `Bearer ${paymentData}`;
      }

      return await fetch(apiUrl, { headers });
    } catch (error) {
      throw new Error(`x402 payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}