import axios from 'axios';
import { DecodedMessage } from '@xmtp/browser-sdk';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { BaseAgent } from './base-agent';
import {
  AgentContext,
  AgentResponse,
} from '../types';

interface TokenData {
  address: string;
  symbol: string;
  name: string;
  balance?: string;
  decimals?: number;
  priceUSD?: number;
  change24h?: number;
  volume24h?: number;
  marketCap?: number;
  historicalActivity?: any[];
}

interface TrendingToken {
  token: TokenData;
  score: number;
  reason: string;
}

export class TokenTrackerAgent extends BaseAgent {
  private cdpApiKey: string;
  private cdpApiSecret: string;
  private baseApiUrl = 'https://api.cdp.coinbase.com/platform';

  constructor(config?: any) {
    super(config || {
      name: 'token-tracker',
      description: 'Tracks trending tokens based on historical activity',
      isActive: true,
      config: {},
    });
    this.cdpApiKey = process.env.CDP_API_KEY_ID || '';
    this.cdpApiSecret = process.env.CDP_API_KEY_SECRET || '';
  }

  protected initializeTools(): void {
    this.tools.push(
      new DynamicStructuredTool({
        name: 'track_trending_tokens',
        description: 'Track trending tokens on Base network',
        schema: z.object({
          network: z.string().optional().default('base'),
          limit: z.number().optional().default(10),
        }),
        func: async ({ network, limit }) => {
          try {
            const trending = await this.analyzeTrendingTokens();
            return `Trending tokens on ${network}:\n${this.formatTrendingTokens(trending.slice(0, limit))}`;
          } catch (error) {
            return `Error fetching trending tokens: ${error instanceof Error ? error.message : 'Unknown error'}`;
          }
        },
      }),

      new DynamicStructuredTool({
        name: 'analyze_wallet_tokens',
        description: 'Analyze token holdings for a specific wallet',
        schema: z.object({
          address: z.string().describe('Wallet address to analyze'),
        }),
        func: async ({ address }) => {
          try {
            const tokens = await this.getWalletTokens(address);
            const balances = await this.getTokenBalances(address);
            const analysis = await this.analyzeTokenActivity(tokens, balances);
            return `Token analysis for ${address}:\n${this.formatTokenAnalysis(analysis)}`;
          } catch (error) {
            return `Error analyzing wallet tokens: ${error instanceof Error ? error.message : 'Unknown error'}`;
          }
        },
      }),
    );
  }

  protected async handleMessage(message: DecodedMessage, context: AgentContext): Promise<AgentResponse> {
    const messageContent = typeof message.content === 'string' ? message.content : '';
    return await this.processMessage(messageContent, context);
  }

  protected async shouldHandleMessage(message: DecodedMessage, context: AgentContext): Promise<boolean> {
    const content = typeof message.content === 'string' ? message.content.toLowerCase() : '';
    const tokenKeywords = ['track', 'trending', 'tokens', 'holdings', 'portfolio', 'wallet', 'balance'];
    return tokenKeywords.some(keyword => content.includes(keyword));
  }

  protected async suggestNextAgent(message: DecodedMessage, context: AgentContext): Promise<string> {
    const content = typeof message.content === 'string' ? message.content.toLowerCase() : '';
    
    if (content.includes('swap') || content.includes('trade')) return 'trading';
    if (content.includes('analyze') || content.includes('data')) return 'data-driven';
    if (content.includes('defi') || content.includes('yield')) return 'defi-analytics';
    
    return 'master';
  }

  async processMessage(message: string, context: AgentContext): Promise<AgentResponse> {
    this.logger.info(`Processing message: ${message}`);
    
    try {
      const intent = this.analyzeIntent(message);
      
      switch (intent) {
        case 'track_wallet':
          return await this.trackWalletTokens(context);
        case 'trending_tokens':
          return await this.getTrendingTokens(message, context);
        case 'token_history':
          return await this.getTokenHistory(message, context);
        case 'portfolio_analysis':
          return await this.analyzePortfolio(context);
        default:
          return await this.handleGeneralQuery(message, context);
      }
    } catch (error) {
      this.logger.error('Error processing message:', error);
      return {
        message: 'I encountered an error tracking tokens. Please try again.',
        actions: [],
        metadata: { handledBy: 'token-tracker', error: true }
      };
    }
  }

  private analyzeIntent(message: string): string {
    const lower = message.toLowerCase();
    
    if (lower.includes('track') || lower.includes('wallet')) {
      return 'track_wallet';
    }
    if (lower.includes('trending') || lower.includes('hot') || lower.includes('popular')) {
      return 'trending_tokens';
    }
    if (lower.includes('history') || lower.includes('past')) {
      return 'token_history';
    }
    if (lower.includes('portfolio') || lower.includes('holdings')) {
      return 'portfolio_analysis';
    }
    
    return 'general';
  }

  private async trackWalletTokens(context: AgentContext): Promise<AgentResponse> {
    try {
      if (!context.wallet?.address) {
        return {
          message: 'Please connect your wallet first to track tokens.',
          actions: [{
            type: 'connect_wallet',
            label: 'Connect Wallet',
            data: {}
          }],
          metadata: { handledBy: 'token-tracker', requiresWallet: true }
        };
      }

      // Get token ownership data from CDP API
      const tokens = await this.getWalletTokens(context.wallet.address);
      const balances = await this.getTokenBalances(context.wallet.address);
      
      // Analyze historical activity
      const analysis = await this.analyzeTokenActivity(tokens, balances);
      
      return {
        message: `I've analyzed your wallet's token activity:\n\n${this.formatTokenAnalysis(analysis)}`,
        actions: this.generateTokenActions(analysis),
        metadata: { 
          handledBy: 'token-tracker',
          trackedTokens: tokens,
          analysis: analysis
        }
      };
    } catch (error) {
      this.logger.error('Error tracking wallet tokens:', error);
      throw error;
    }
  }

  private async getWalletTokens(address: string): Promise<string[]> {
    try {
      const headers = this.getAuthHeaders();
      const response = await axios.get(
        `${this.baseApiUrl}/v2/data/evm/token-ownership/base/${address}`,
        { headers }
      );
      
      return response.data.tokenAddresses || [];
    } catch (error) {
      this.logger.error('Error fetching wallet tokens:', error);
      return [];
    }
  }

  private async getTokenBalances(address: string): Promise<any[]> {
    try {
      const headers = this.getAuthHeaders();
      const response = await axios.get(
        `${this.baseApiUrl}/v2/data/evm/token-balances/base/${address}`,
        { headers }
      );
      
      return response.data.balances || [];
    } catch (error) {
      this.logger.error('Error fetching token balances:', error);
      return [];
    }
  }

  private async getTrendingTokens(message: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // Extract the number of tokens requested from the message
      const requestedCount = this.extractRequestedTokenCount(message);
      
      // Check if user is requesting more than 5 tokens (premium feature)
      if (requestedCount > 5) {
        return this.createPremiumPaymentResponse(requestedCount, context);
      }
      
      // Analyze multiple data sources for trending tokens
      const allTrendingTokens = await this.analyzeTrendingTokens();
      
      // Limit to requested count or 5 for free tier
      const trendingTokens = allTrendingTokens.slice(0, Math.min(requestedCount, 5));
      
      return {
        message: `Here are the top ${trendingTokens.length} trending tokens on Base:\n\n${this.formatTrendingTokens(trendingTokens)}\n\n${requestedCount > 5 ? '' : '💡 *Want to see more? Upgrade to premium for access to top 20+ tokens with alpha signals!*'}`,
        actions: this.generateTrendingActions(trendingTokens),
        metadata: { 
          handledBy: 'token-tracker',
          trendingTokens: trendingTokens,
          totalAvailable: allTrendingTokens.length,
          premiumRequired: requestedCount > 5
        }
      };
    } catch (error) {
      this.logger.error('Error getting trending tokens:', error);
      throw error;
    }
  }
  
  private extractRequestedTokenCount(message: string): number {
    // Look for patterns like "top 10", "20 tokens", "show me 15", etc.
    const patterns = [
      /top\s+(\d+)/i,
      /show\s+(?:me\s+)?(\d+)/i,
      /(\d+)\s+(?:trending\s+)?tokens?/i,
      /(?:first|best)\s+(\d+)/i
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }
    
    // Default to 10 if no specific number mentioned
    return 10;
  }
  
  private createPremiumPaymentResponse(requestedCount: number, context: AgentContext): AgentResponse {
    const x402Address = process.env.X402_SELLER_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7';
    const priceUSDC = requestedCount <= 10 ? 5 : requestedCount <= 20 ? 10 : 25; // Tiered pricing
    
    return {
      message: `🔒 **Premium Feature Required**\n\nYou've requested the top ${requestedCount} trending tokens, which is a premium feature.\n\n**What you get with premium:**\n• Access to top 20+ trending tokens\n• Alpha signals and early trend detection\n• Whale movement tracking\n• Custom alert thresholds\n• Real-time price updates\n• Sentiment analysis integration\n\n**Pricing:** ${priceUSDC} USDC for this request\n\n**Payment Address:** \`${x402Address}\`\n\nOnce payment is confirmed, you'll receive:\n1. Top ${requestedCount} trending tokens with detailed metrics\n2. 24-hour access to premium features\n3. Personalized trading signals\n\n*Free tier includes top 5 tokens. Would you like to see those instead?*`,
      actions: [
        {
          type: 'pay_x402',
          label: `Pay ${priceUSDC} USDC for Premium`,
          data: {
            amount: priceUSDC,
            currency: 'USDC',
            recipient: x402Address,
            purpose: `Premium trending tokens (top ${requestedCount})`,
            tokenCount: requestedCount
          }
        },
        {
          type: 'show_free_tier',
          label: 'Show Top 5 (Free)',
          data: {
            limit: 5
          }
        },
        {
          type: 'view_premium_features',
          label: 'Learn More About Premium',
          data: {
            url: '/premium'
          }
        }
      ],
      metadata: {
        handledBy: 'token-tracker',
        premiumRequired: true,
        requestedCount: requestedCount,
        priceUSDC: priceUSDC,
        x402Address: x402Address
      }
    };
  }
  private async analyzeTrendingTokens(): Promise<TrendingToken[]> {
    try {
      // Try to fetch from CoinGecko API (free tier)
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets',
        {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 10,
            page: 1,
            sparkline: false
          }
        }
      );

      console.log('CoinGecko response received:', response.data?.length, 'tokens');
      console.log('First token:', response.data?.[0]?.name, response.data?.[0]?.symbol);

      // Check if response is an array (CoinGecko format)
      if (!Array.isArray(response.data) || response.data.length === 0) {
        this.logger.warn('No trending token data received from CoinGecko API');
        return this.getMockTrendingTokens();
      }

      // Map CoinGecko response to our format
      return response.data.map((token: any, index: number) => ({
        token: {
          address: token.id, // CoinGecko uses id instead of address
          symbol: token.symbol.toUpperCase(),
          name: token.name,
          priceUSD: token.current_price || 0,
          change24h: token.price_change_percentage_24h || 0,
          volume24h: token.total_volume || 0,
          marketCap: token.market_cap || 0
        },
        score: 100 - (index * 10), // Higher rank = higher score
        reason: token.price_change_percentage_24h > 0 
          ? `Up ${token.price_change_percentage_24h.toFixed(2)}% in 24h` 
          : 'High market cap and volume'
      }));

    } catch (error: any) {
      this.logger.error('Error fetching trending tokens:', error.message || error);
      console.error('CoinGecko API error:', error.response?.status, error.response?.data || error.message);
      return this.getMockTrendingTokens();
    }
  }

  private getMockTrendingTokens(): TrendingToken[] {
    return [
      {
        token: {
          address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          symbol: 'USDC',
          name: 'USD Coin',
          priceUSD: 1,
          change24h: 0.01,
          volume24h: 1000000000,
          marketCap: 5000000000
        },
        score: 95,
        reason: 'High volume and stable price'
      },
      {
        token: {
          address: '0x4200000000000000000000000000000000000006',
          symbol: 'WETH',
          name: 'Wrapped Ether',
          priceUSD: 3000,
          change24h: 2.5,
          volume24h: 500000000,
          marketCap: 350000000000
        },
        score: 88,
        reason: 'Strong upward momentum'
      }
    ];
  }

  private async getTokenHistory(message: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // Extract token from message
      const tokenSymbol = this.extractTokenSymbol(message);
      
      if (!tokenSymbol) {
        return {
          message: 'Please specify which token you want historical data for.',
          actions: [],
          metadata: { handledBy: 'token-tracker' }
        };
      }

      // Get historical data
      const history = await this.fetchTokenHistory(tokenSymbol);
      
      return {
        message: `Historical analysis for ${tokenSymbol}:\n\n${this.formatTokenHistory(history)}`,
        actions: [{
          type: 'view_chart',
          label: 'View Chart',
          data: { token: tokenSymbol, history }
        }],
        metadata: { handledBy: 'token-tracker', tokenHistory: history }
      };
    } catch (error) {
      this.logger.error('Error getting token history:', error);
      throw error;
    }
  }

  private async analyzePortfolio(context: AgentContext): Promise<AgentResponse> {
    try {
      if (!context.wallet?.address) {
        return {
          message: 'Please connect your wallet for portfolio analysis.',
          actions: [{
            type: 'connect_wallet',
            label: 'Connect Wallet',
            data: {}
          }],
          context: {}
        };
      }

      const balances = await this.getTokenBalances(context.wallet.address);
      const analysis = await this.performPortfolioAnalysis(balances);
      
      return {
        message: `Portfolio Analysis:\n\n${this.formatPortfolioAnalysis(analysis)}`,
        actions: this.generatePortfolioActions(analysis),
        context: { portfolioAnalysis: analysis }
      };
    } catch (error) {
      this.logger.error('Error analyzing portfolio:', error);
      throw error;
    }
  }

  private async handleGeneralQuery(message: string, context: AgentContext): Promise<AgentResponse> {
    return {
      message: `I can help you track tokens and analyze market trends. Try asking me to:
      • Track your wallet's token activity
      • Show trending tokens
      • Analyze token history
      • Review your portfolio`,
      actions: [
        {
          type: 'track_wallet',
          label: 'Track My Wallet',
          data: {}
        },
        {
          type: 'show_trending',
          label: 'Show Trending',
          data: {}
        }
      ],
      metadata: { handledBy: 'token-tracker' }
    };
  }

  private getAuthHeaders(): any {
    // Generate JWT token for CDP API authentication
    const jwt = this.generateJWT();
    return {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json'
    };
  }

  private generateJWT(): string {
    // This would implement proper JWT generation with CDP API credentials
    // For now, returning a placeholder
    return 'jwt_token_placeholder';
  }

  private async analyzeTokenActivity(tokens: string[], balances: any[]): Promise<any> {
    return {
      totalTokens: tokens.length,
      activeTokens: balances.length,
      topHoldings: balances.slice(0, 5),
      recommendations: this.generateRecommendations(balances)
    };
  }

  private generateRecommendations(balances: any[]): string[] {
    const recommendations = [];
    
    // Analyze balance distribution
    if (balances.length > 10) {
      recommendations.push('Consider consolidating smaller positions');
    }
    
    // Check for stablecoins
    const hasStablecoin = balances.some(b => 
      b.token?.symbol === 'USDC' || b.token?.symbol === 'USDT'
    );
    if (!hasStablecoin) {
      recommendations.push('Consider holding some stablecoins for stability');
    }
    
    return recommendations;
  }

  private formatTokenAnalysis(analysis: any): string {
    return `📊 Token Analysis:
    • Total tokens tracked: ${analysis.totalTokens}
    • Active holdings: ${analysis.activeTokens}
    • Top holdings: ${analysis.topHoldings.map((h: any) => h.token?.symbol).join(', ')}
    
    Recommendations:
    ${analysis.recommendations.map((r: string) => `• ${r}`).join('\n')}`;
  }

  private formatTrendingTokens(tokens: TrendingToken[]): string {
    return tokens.map((t, i) => 
      `${i + 1}. ${t.token.symbol} (${t.token.name})
      • Price: $${t.token.priceUSD}
      • 24h Change: ${t.token.change24h}%
      • Score: ${t.score}/100
      • Reason: ${t.reason}`
    ).join('\n\n');
  }

  private formatTokenHistory(history: any): string {
    return `📈 Price History:
    • 24h: ${history.change24h}%
    • 7d: ${history.change7d}%
    • 30d: ${history.change30d}%
    • Volume: $${history.volume24h}`;
  }

  private formatPortfolioAnalysis(analysis: any): string {
    return `💼 Portfolio Overview:
    • Total Value: $${analysis.totalValue}
    • Number of Assets: ${analysis.assetCount}
    • Top Asset: ${analysis.topAsset}
    • Risk Score: ${analysis.riskScore}/10`;
  }

  private extractTokenSymbol(message: string): string | null {
    const match = message.match(/\b([A-Z]{2,10})\b/);
    return match ? match[1] : null;
  }

  private async fetchTokenHistory(symbol: string): Promise<any> {
    // Mock implementation - would fetch real data
    return {
      symbol,
      change24h: 5.2,
      change7d: 12.3,
      change30d: -3.5,
      volume24h: 1000000
    };
  }

  private async performPortfolioAnalysis(balances: any[]): Promise<any> {
    const totalValue = balances.reduce((sum, b) => {
      const amount = parseFloat(b.amount?.amount || '0');
      const price = b.token?.priceUSD || 0;
      return sum + (amount * price);
    }, 0);

    return {
      totalValue,
      assetCount: balances.length,
      topAsset: balances[0]?.token?.symbol || 'None',
      riskScore: this.calculateRiskScore(balances)
    };
  }

  private calculateRiskScore(balances: any[]): number {
    // Simple risk calculation based on diversification
    if (balances.length === 0) return 10;
    if (balances.length === 1) return 8;
    if (balances.length < 3) return 6;
    if (balances.length < 5) return 4;
    return 3;
  }

  private generateTokenActions(analysis: any): any[] {
    return [
      {
        type: 'view_details',
        label: 'View Details',
        data: { analysis }
      },
      {
        type: 'optimize_holdings',
        label: 'Optimize Holdings',
        data: {}
      }
    ];
  }

  private generateTrendingActions(tokens: TrendingToken[]): any[] {
    return tokens.slice(0, 3).map(t => ({
      type: 'swap_to_token',
      label: `Buy ${t.token.symbol}`,
      data: { token: t.token }
    }));
  }

  private generatePortfolioActions(analysis: any): any[] {
    return [
      {
        type: 'rebalance',
        label: 'Rebalance Portfolio',
        data: { analysis }
      },
      {
        type: 'export_report',
        label: 'Export Report',
        data: {}
      }
    ];
  }
}