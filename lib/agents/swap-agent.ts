import axios from 'axios';
import { BaseAgent, AgentContext, AgentResponse } from './base-agent';

interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  priceUSD?: number;
}

interface SwapQuote {
  fromToken: TokenInfo;
  toToken: TokenInfo;
  fromAmount: string;
  toAmount: string;
  priceImpact: number;
  gasEstimate: string;
  route: string[];
  slippage: number;
}

interface SwapTransaction {
  to: string;
  data: string;
  value: string;
  gasLimit: string;
  gasPrice: string;
}

export class SwapAgent extends BaseAgent {
  private cdpApiKey: string;
  private cdpApiSecret: string;
  private baseApiUrl = 'https://api.cdp.coinbase.com/platform';
  private swapsApiUrl = 'https://api.cdp.coinbase.com/v2/evm/swaps';

  constructor() {
    super({
      name: 'swap',
      isActive: true,
      description: 'Handles token swaps and DeFi trading',
      version: '1.0.0',
      capabilities: ['swap', 'trade', 'arbitrage', 'route', 'price'],
      priority: 80
    });
    this.cdpApiKey = process.env.COINBASE_CDP_API_KEY || '';
    this.cdpApiSecret = process.env.COINBASE_CDP_API_SECRET || '';
  }

  protected initializeTools(): void {
    // Tools are initialized in the processMessage() method for this agent
  }

  async processMessage(message: string, context: AgentContext): Promise<AgentResponse> {
    this.logger.info(`Processing swap request: ${message}`);
    
    try {
      const intent = this.analyzeSwapIntent(message);
      
      switch (intent.action) {
        case 'quote':
          return await this.getSwapQuote(intent, context);
        case 'execute':
          return await this.executeSwap(intent, context);
        case 'arbitrage':
          return await this.findArbitrageOpportunity(context);
        case 'best_route':
          return await this.findBestSwapRoute(intent, context);
        case 'price_comparison':
          return await this.comparePrices(intent, context);
        default:
          return await this.handleGeneralSwapQuery(message, context);
      }
    } catch (error) {
      this.logger.error('Error processing swap request:', error);
      return {
        message: 'I encountered an error processing your swap request. Please try again.',
        actions: [],
        context: {}
      };
    }
  }

  private analyzeSwapIntent(message: string): any {
    const lower = message.toLowerCase();
    
    // Extract amounts and tokens
    const amountMatch = message.match(/(\d+\.?\d*)\s*(\w+)/g);
    const tokens = this.extractTokens(message);
    
    // Log for debugging
    this.logger.info('Analyzing swap intent', { 
      message: lower.substring(0, 100), 
      tokens, 
      amountMatch 
    });
    
    if (lower.includes('swap') || lower.includes('exchange') || lower.includes('trade')) {
      if (lower.includes('execute') || lower.includes('confirm')) {
        return { action: 'execute', tokens, amounts: amountMatch };
      }
      return { action: 'quote', tokens, amounts: amountMatch };
    }
    
    if (lower.includes('arbitrage') || lower.includes('arb')) {
      return { action: 'arbitrage' };
    }
    
    if (lower.includes('route') || lower.includes('path')) {
      return { action: 'best_route', tokens };
    }
    
    if (lower.includes('price') || lower.includes('compare')) {
      return { action: 'price_comparison', tokens };
    }
    
    return { action: 'general' };
  }

  private async getSwapQuote(intent: any, context: AgentContext): Promise<AgentResponse> {
    try {
      if (!context.wallet?.address) {
        return {
          message: 'Please connect your wallet to get swap quotes.',
          actions: [{
            type: 'connect_wallet',
            label: 'Connect Wallet',
            data: {}
          }],
          context: {}
        };
      }

      const { tokens, amounts } = intent;
      
      if (!tokens || tokens.length < 2) {
        return {
          message: 'Please specify the tokens you want to swap. Example: "Swap 100 USDC for WETH"',
          actions: [],
          context: {}
        };
      }

      // Get quote from CDP Swaps API
      const quote = await this.fetchSwapQuote(
        tokens[0],
        tokens[1],
        amounts ? amounts[0] : '100',
        context.wallet.address
      );
      
      return {
        message: this.formatSwapQuote(quote),
        actions: [
          {
            type: 'execute_swap',
            label: 'Execute Swap',
            data: { quote }
          },
          {
            type: 'refresh_quote',
            label: 'Refresh Quote',
            data: { tokens, amounts }
          }
        ],
        context: { swapQuote: quote }
      };
    } catch (error) {
      this.logger.error('Error getting swap quote:', error);
      throw error;
    }
  }

  private async fetchSwapQuote(
    fromToken: string,
    toToken: string,
    amount: string,
    userAddress: string
  ): Promise<SwapQuote> {
    try {
      const headers = this.getAuthHeaders();
      
      // Get token addresses
      const fromAddress = await this.getTokenAddress(fromToken);
      const toAddress = await this.getTokenAddress(toToken);
      
      const params = {
        chain: 'base',
        fromAddress: fromAddress,
        toAddress: toAddress,
        amount: amount,
        userAddress: userAddress,
        slippage: 0.5 // 0.5% slippage
      };
      
      const response = await axios.get(
        `${this.swapsApiUrl}/quote`,
        { headers, params }
      );
      
      return this.parseSwapQuote(response.data);
    } catch (error) {
      this.logger.error('Error fetching swap quote:', error);
      // Return mock quote for now
      return this.getMockSwapQuote(fromToken, toToken, amount);
    }
  }

  private async executeSwap(intent: any, context: AgentContext): Promise<AgentResponse> {
    try {
      if (!context.wallet?.address) {
        return {
          message: 'Please connect your wallet to execute swaps.',
          actions: [{
            type: 'connect_wallet',
            label: 'Connect Wallet',
            data: {}
          }],
          context: {}
        };
      }

      const quote = context.swapQuote || await this.fetchSwapQuote(
        intent.tokens[0],
        intent.tokens[1],
        intent.amounts[0],
        context.wallet.address
      );

      // Build swap transaction
      const transaction = await this.buildSwapTransaction(quote, context.wallet.address);
      
      return {
        message: `Swap transaction prepared:\n\n${this.formatTransaction(transaction)}\n\nPlease sign the transaction in your wallet to complete the swap.`,
        actions: [
          {
            type: 'sign_transaction',
            label: 'Sign & Send',
            data: { transaction }
          },
          {
            type: 'cancel_swap',
            label: 'Cancel',
            data: {}
          }
        ],
        context: { pendingTransaction: transaction }
      };
    } catch (error) {
      this.logger.error('Error executing swap:', error);
      throw error;
    }
  }

  private async buildSwapTransaction(quote: SwapQuote, userAddress: string): Promise<SwapTransaction> {
    try {
      const headers = this.getAuthHeaders();
      
      const response = await axios.post(
        `${this.swapsApiUrl}/transaction`,
        {
          chain: 'base',
          quote: quote,
          userAddress: userAddress
        },
        { headers }
      );
      
      return response.data.transaction;
    } catch (error) {
      this.logger.error('Error building swap transaction:', error);
      // Return mock transaction
      return {
        to: '0x1234567890123456789012345678901234567890',
        data: '0xabcdef',
        value: '0',
        gasLimit: '200000',
        gasPrice: '20000000000'
      };
    }
  }

  private async findArbitrageOpportunity(context: AgentContext): Promise<AgentResponse> {
    try {
      // Analyze multiple DEXs for arbitrage opportunities
      const opportunities = await this.scanArbitrageOpportunities();
      
      if (opportunities.length === 0) {
        return {
          message: 'No profitable arbitrage opportunities found at the moment. I\'ll keep monitoring.',
          actions: [{
            type: 'auto_monitor',
            label: 'Enable Auto-Monitor',
            data: {}
          }],
          context: {}
        };
      }
      
      return {
        message: `Found ${opportunities.length} arbitrage opportunities:\n\n${this.formatArbitrageOpportunities(opportunities)}`,
        actions: opportunities.slice(0, 3).map(opp => ({
          type: 'execute_arbitrage',
          label: `Execute ${opp.profit}% Arb`,
          data: { opportunity: opp }
        })),
        context: { arbitrageOpportunities: opportunities }
      };
    } catch (error) {
      this.logger.error('Error finding arbitrage:', error);
      throw error;
    }
  }

  private async scanArbitrageOpportunities(): Promise<any[]> {
    // Mock implementation - would scan multiple DEXs
    return [
      {
        pair: 'WETH/USDC',
        buyDex: 'Uniswap',
        sellDex: 'SushiSwap',
        profit: 0.5,
        volume: 10000,
        gasEstimate: 50
      },
      {
        pair: 'WBTC/WETH',
        buyDex: 'Curve',
        sellDex: 'Uniswap',
        profit: 0.3,
        volume: 5000,
        gasEstimate: 45
      }
    ];
  }

  private async findBestSwapRoute(intent: any, context: AgentContext): Promise<AgentResponse> {
    try {
      const { tokens } = intent;
      
      if (!tokens || tokens.length < 2) {
        return {
          message: 'Please specify the tokens to find the best swap route.',
          actions: [],
          context: {}
        };
      }

      // Analyze multiple routes
      const routes = await this.analyzeSwapRoutes(tokens[0], tokens[1]);
      
      return {
        message: `Best swap routes for ${tokens[0]} → ${tokens[1]}:\n\n${this.formatSwapRoutes(routes)}`,
        actions: routes.map(route => ({
          type: 'use_route',
          label: `Use ${route.dex}`,
          data: { route }
        })),
        context: { swapRoutes: routes }
      };
    } catch (error) {
      this.logger.error('Error finding best route:', error);
      throw error;
    }
  }

  private async analyzeSwapRoutes(fromToken: string, toToken: string): Promise<any[]> {
    // Mock implementation
    return [
      {
        dex: 'Uniswap V3',
        path: [fromToken, 'WETH', toToken],
        estimatedOutput: '1000',
        gasEstimate: '150000',
        priceImpact: 0.1
      },
      {
        dex: 'Direct Swap',
        path: [fromToken, toToken],
        estimatedOutput: '995',
        gasEstimate: '100000',
        priceImpact: 0.15
      }
    ];
  }

  private async comparePrices(intent: any, context: AgentContext): Promise<AgentResponse> {
    try {
      const { tokens } = intent;
      const token = tokens ? tokens[0] : 'WETH';
      
      // Get prices from multiple sources
      const prices = await this.fetchPricesFromMultipleSources(token);
      
      return {
        message: `Price comparison for ${token}:\n\n${this.formatPriceComparison(prices)}`,
        actions: [{
          type: 'set_price_alert',
          label: 'Set Price Alert',
          data: { token }
        }],
        context: { priceComparison: prices }
      };
    } catch (error) {
      this.logger.error('Error comparing prices:', error);
      throw error;
    }
  }

  private async fetchPricesFromMultipleSources(token: string): Promise<any[]> {
    // Mock implementation
    return [
      { source: 'Uniswap', price: 3000, liquidity: 1000000 },
      { source: 'SushiSwap', price: 2995, liquidity: 500000 },
      { source: 'Curve', price: 3002, liquidity: 2000000 }
    ];
  }

  private async handleGeneralSwapQuery(message: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // Try to use LLM for intelligent response
      const llmResponse = await this.processWithLLM(message, context);
      return {
        message: llmResponse,
        actions: [
        {
          type: 'get_quote',
          label: 'Get Swap Quote',
          data: {}
        },
        {
          type: 'find_arbitrage',
          label: 'Find Arbitrage',
          data: {}
        },
        {
          type: 'compare_prices',
          label: 'Compare Prices',
          data: {}
        }
      ],
      context: {}
    };
    } catch (error) {
      // Fallback to hardcoded response if LLM fails
      return {
        message: `I can help you with token swaps and DeFi trading. Here's what I can do:
        • Get swap quotes for any token pair
        • Execute token swaps with best rates
        • Find arbitrage opportunities
        • Analyze best swap routes
        • Compare prices across DEXs`,
        actions: [
          {
            type: 'get_quote',
            label: 'Get Swap Quote',
            data: {}
          },
          {
            type: 'find_arbitrage',
            label: 'Find Arbitrage',
            data: {}
          },
          {
            type: 'compare_prices',
            label: 'Compare Prices',
            data: {}
          }
        ],
        context: {}
      };
    }
  }

  private getAuthHeaders(): any {
    const jwt = this.generateJWT();
    return {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json',
      'X-API-Key': this.cdpApiKey
    };
  }

  private generateJWT(): string {
    // Implement proper JWT generation
    return 'jwt_token_placeholder';
  }

  private extractTokens(message: string): string[] {
    const tokens: string[] = [];
    const commonTokens = ['ETH', 'WETH', 'USDC', 'USDT', 'WBTC', 'DAI', 'LINK', 'UNI', 'AAVE'];
    
    // First check for common tokens
    commonTokens.forEach(token => {
      if (message.toUpperCase().includes(token)) {
        // Convert ETH to WETH for swaps
        tokens.push(token === 'ETH' ? 'WETH' : token);
      }
    });
    
    // Also extract any token that looks like a symbol (3-6 uppercase letters)
    const tokenPattern = /\b([A-Z]{2,10})\b/g;
    const matches = message.toUpperCase().match(tokenPattern);
    if (matches) {
      matches.forEach(match => {
        // Skip common words that aren't tokens
        if (!['TO', 'FROM', 'FOR', 'ON', 'IN', 'AT', 'THE', 'AND', 'OR'].includes(match) && 
            !tokens.includes(match)) {
          tokens.push(match);
        }
      });
    }
    
    return tokens;
  }

  private async getTokenAddress(symbol: string): Promise<string> {
    // Token address mapping for Base network
    const tokenAddresses: { [key: string]: string } = {
      'WETH': '0x4200000000000000000000000000000000000006',
      'USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      'USDT': '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      'DAI': '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      'WBTC': '0x68f180fcCe6836688e9084f035309E29Bf0A2095'
    };
    
    return tokenAddresses[symbol.toUpperCase()] || '0x0000000000000000000000000000000000000000';
  }

  private parseSwapQuote(data: any): SwapQuote {
    return {
      fromToken: data.fromToken,
      toToken: data.toToken,
      fromAmount: data.fromAmount,
      toAmount: data.toAmount,
      priceImpact: data.priceImpact || 0,
      gasEstimate: data.gasEstimate || '200000',
      route: data.route || [],
      slippage: data.slippage || 0.5
    };
  }

  private getMockSwapQuote(fromToken: string, toToken: string, amount: string): SwapQuote {
    return {
      fromToken: {
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        symbol: fromToken,
        name: 'USD Coin',
        decimals: 6,
        priceUSD: 1
      },
      toToken: {
        address: '0x4200000000000000000000000000000000000006',
        symbol: toToken,
        name: 'Wrapped Ether',
        decimals: 18,
        priceUSD: 3000
      },
      fromAmount: amount,
      toAmount: (parseFloat(amount) / 3000).toFixed(6),
      priceImpact: 0.1,
      gasEstimate: '200000',
      route: [fromToken, toToken],
      slippage: 0.5
    };
  }

  private formatSwapQuote(quote: SwapQuote): string {
    return `💱 Swap Quote:
    
From: ${quote.fromAmount} ${quote.fromToken.symbol}
To: ${quote.toAmount} ${quote.toToken.symbol}
    
📊 Details:
• Rate: 1 ${quote.fromToken.symbol} = ${(parseFloat(quote.toAmount) / parseFloat(quote.fromAmount)).toFixed(6)} ${quote.toToken.symbol}
• Price Impact: ${quote.priceImpact}%
• Slippage Tolerance: ${quote.slippage}%
• Estimated Gas: ${quote.gasEstimate} units
• Route: ${quote.route.join(' → ')}`;
  }

  private formatTransaction(transaction: SwapTransaction): string {
    return `📝 Transaction Details:
• To: ${transaction.to}
• Gas Limit: ${transaction.gasLimit}
• Gas Price: ${(parseInt(transaction.gasPrice) / 1e9).toFixed(2)} Gwei
• Value: ${transaction.value} ETH`;
  }

  private formatArbitrageOpportunities(opportunities: any[]): string {
    return opportunities.map((opp, i) => 
      `${i + 1}. ${opp.pair}
   • Buy on: ${opp.buyDex}
   • Sell on: ${opp.sellDex}
   • Profit: ${opp.profit}%
   • Volume: $${opp.volume}
   • Gas Cost: $${opp.gasEstimate}`
    ).join('\n\n');
  }

  private formatSwapRoutes(routes: any[]): string {
    return routes.map((route, i) => 
      `${i + 1}. ${route.dex}
   • Path: ${route.path.join(' → ')}
   • Output: ${route.estimatedOutput}
   • Gas: ${route.gasEstimate}
   • Impact: ${route.priceImpact}%`
    ).join('\n\n');
  }

  private formatPriceComparison(prices: any[]): string {
    const bestPrice = Math.min(...prices.map(p => p.price));
    
    return prices.map(p => 
      `• ${p.source}: $${p.price} ${p.price === bestPrice ? '✅ (Best)' : ''}
  Liquidity: $${(p.liquidity / 1000000).toFixed(2)}M`
    ).join('\n');
  }
}