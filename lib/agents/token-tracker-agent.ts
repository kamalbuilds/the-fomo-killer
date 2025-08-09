import axios from 'axios';
import { BaseAgent, AgentContext, AgentResponse } from './base-agent';

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

  constructor() {
    super('TokenTracker', '📊');
    this.cdpApiKey = process.env.COINBASE_CDP_API_KEY || '';
    this.cdpApiSecret = process.env.COINBASE_CDP_API_SECRET || '';
  }

  async processMessage(message: string, context: AgentContext): Promise<AgentResponse> {
    this.logInfo(`Processing message: ${message}`);
    
    try {
      const intent = this.analyzeIntent(message);
      
      switch (intent) {
        case 'track_wallet':
          return await this.trackWalletTokens(context);
        case 'trending_tokens':
          return await this.getTrendingTokens(context);
        case 'token_history':
          return await this.getTokenHistory(message, context);
        case 'portfolio_analysis':
          return await this.analyzePortfolio(context);
        default:
          return await this.handleGeneralQuery(message, context);
      }
    } catch (error) {
      this.logError('Error processing message:', error);
      return {
        message: 'I encountered an error tracking tokens. Please try again.',
        actions: [],
        context: {}
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
          context: {}
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
        context: {
          trackedTokens: tokens,
          analysis: analysis
        }
      };
    } catch (error) {
      this.logError('Error tracking wallet tokens:', error);
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
      this.logError('Error fetching wallet tokens:', error);
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
      this.logError('Error fetching token balances:', error);
      return [];
    }
  }

  private async getTrendingTokens(context: AgentContext): Promise<AgentResponse> {
    try {
      // Analyze multiple data sources for trending tokens
      const trendingTokens = await this.analyzeTrendingTokens();
      
      return {
        message: `Here are the trending tokens on Base:\n\n${this.formatTrendingTokens(trendingTokens)}`,
        actions: this.generateTrendingActions(trendingTokens),
        context: {
          trendingTokens: trendingTokens
        }
      };
    } catch (error) {
      this.logError('Error getting trending tokens:', error);
      throw error;
    }
  }

  private async analyzeTrendingTokens(): Promise<TrendingToken[]> {
    // This would integrate with multiple data sources
    // For now, returning mock data
    return [
      {
        token: {
          address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          symbol: 'USDC',
          name: 'USD Coin',
          priceUSD: 1.00,
          change24h: 0.01,
          volume24h: 1000000,
          marketCap: 1000000000
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
          volume24h: 5000000,
          marketCap: 10000000000
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
          context: {}
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
        context: { tokenHistory: history }
      };
    } catch (error) {
      this.logError('Error getting token history:', error);
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
      this.logError('Error analyzing portfolio:', error);
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
      context: {}
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