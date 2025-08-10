import axios from 'axios';
import { BaseAgent, AgentContext, AgentResponse } from './base-agent';

interface Asset {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  priceUSD: number;
  valueUSD: number;
  allocation: number;
  change24h: number;
  change7d: number;
}

interface PortfolioMetrics {
  totalValue: number;
  totalAssets: number;
  profitLoss: number;
  profitLossPercentage: number;
  riskScore: number;
  diversificationScore: number;
  volatility: number;
  sharpeRatio: number;
}

interface RebalanceRecommendation {
  action: 'buy' | 'sell' | 'hold';
  token: string;
  amount: number;
  reason: string;
  impact: string;
}

interface RiskAnalysis {
  overallRisk: 'low' | 'medium' | 'high';
  riskFactors: string[];
  recommendations: string[];
  exposures: {
    type: string;
    percentage: number;
    risk: string;
  }[];
}

export class PortfolioAgent extends BaseAgent {
  private cdpApiKey: string;
  private cdpApiSecret: string;
  private baseApiUrl = 'https://api.cdp.coinbase.com/platform';

  constructor() {
    super({
      name: 'portfolio',
      isActive: true,
      description: 'Manages cryptocurrency portfolios',
      config: {}
    });
    this.cdpApiKey = process.env.COINBASE_CDP_API_KEY || '';
    this.cdpApiSecret = process.env.COINBASE_CDP_API_SECRET || '';
  }

  protected initializeTools(): void {
    // Tools are initialized in the processMessage() method for this agent
  }

  async processMessage(message: string, context: AgentContext): Promise<AgentResponse> {
    this.logger.info(`Processing portfolio management request: ${message}`);
    
    try {
      const intent = this.analyzePortfolioIntent(message);
      
      switch (intent.action) {
        case 'overview':
          return await this.getPortfolioOverview(context);
        case 'performance':
          return await this.analyzePerformance(context);
        case 'risk_analysis':
          return await this.analyzeRisk(context);
        case 'rebalance':
          return await this.getRebalanceRecommendations(context);
        case 'allocation':
          return await this.analyzeAllocation(context);
        case 'tracking':
          return await this.setupPortfolioTracking(intent, context);
        case 'export':
          return await this.exportPortfolioReport(context);
        default:
          return await this.handleGeneralPortfolioQuery(message, context);
      }
    } catch (error) {
      this.logger.error('Error processing portfolio request:', error);
      return {
        message: 'I encountered an error analyzing your portfolio. Please try again.',
        actions: [],
        context: {}
      };
    }
  }

  private analyzePortfolioIntent(message: string): any {
    const lower = message.toLowerCase();
    
    if (lower.includes('overview') || lower.includes('summary') || lower.includes('portfolio')) {
      return { action: 'overview' };
    }
    
    if (lower.includes('performance') || lower.includes('profit') || lower.includes('loss') || lower.includes('pnl')) {
      return { action: 'performance' };
    }
    
    if (lower.includes('risk') || lower.includes('exposure')) {
      return { action: 'risk_analysis' };
    }
    
    if (lower.includes('rebalance') || lower.includes('optimize')) {
      return { action: 'rebalance' };
    }
    
    if (lower.includes('allocation') || lower.includes('distribution')) {
      return { action: 'allocation' };
    }
    
    if (lower.includes('track') || lower.includes('monitor')) {
      return { action: 'tracking' };
    }
    
    if (lower.includes('export') || lower.includes('report')) {
      return { action: 'export' };
    }
    
    return { action: 'general' };
  }

  private async getPortfolioOverview(context: AgentContext): Promise<AgentResponse> {
    try {
      if (!context.wallet?.address) {
        return {
          message: 'Please connect your wallet to view your portfolio.',
          actions: [{
            type: 'connect_wallet',
            label: 'Connect Wallet',
            data: {}
          }],
          context: {}
        };
      }

      // Fetch portfolio data
      const assets = await this.fetchPortfolioAssets(context.wallet.address);
      const metrics = await this.calculatePortfolioMetrics(assets);
      const topMovers = this.getTopMovers(assets);
      
      return {
        message: this.formatPortfolioOverview(assets, metrics, topMovers),
        actions: [
          {
            type: 'view_detailed_breakdown',
            label: 'View Details',
            data: { assets, metrics }
          },
          {
            type: 'analyze_performance',
            label: 'Performance Analysis',
            data: {}
          },
          {
            type: 'rebalance_portfolio',
            label: 'Rebalance',
            data: {}
          }
        ],
        context: { portfolio: { assets, metrics, topMovers } }
      };
    } catch (error) {
      this.logger.error('Error getting portfolio overview:', error);
      throw error;
    }
  }

  private async fetchPortfolioAssets(address: string): Promise<Asset[]> {
    try {
      const headers = this.getAuthHeaders();
      
      // Fetch token balances from CDP API
      const response = await axios.get(
        `${this.baseApiUrl}/v2/data/evm/token-balances/base/${address}`,
        { headers }
      );
      
      const balances = response.data.balances || [];
      
      // Enrich with price data
      const assets = await Promise.all(
        balances.map(async (balance: any) => {
          const priceData = await this.fetchTokenPrice(balance.token.address);
          const amount = parseFloat(balance.amount.amount) / Math.pow(10, balance.token.decimals);
          const valueUSD = amount * priceData.price;
          
          return {
            address: balance.token.address,
            symbol: balance.token.symbol,
            name: balance.token.name,
            balance: amount.toString(),
            decimals: balance.token.decimals,
            priceUSD: priceData.price,
            valueUSD: valueUSD,
            allocation: 0, // Will be calculated later
            change24h: priceData.change24h,
            change7d: priceData.change7d
          };
        })
      );
      
      // Calculate allocations
      const totalValue = assets.reduce((sum, asset) => sum + asset.valueUSD, 0);
      assets.forEach(asset => {
        asset.allocation = (asset.valueUSD / totalValue) * 100;
      });
      
      return assets.sort((a, b) => b.valueUSD - a.valueUSD);
    } catch (error) {
      this.logger.error('Error fetching portfolio assets:', error);
      // Return mock data for demonstration
      return this.getMockPortfolioAssets();
    }
  }

  private getMockPortfolioAssets(): Asset[] {
    return [
      {
        address: '0x4200000000000000000000000000000000000006',
        symbol: 'WETH',
        name: 'Wrapped Ether',
        balance: '2.5',
        decimals: 18,
        priceUSD: 3000,
        valueUSD: 7500,
        allocation: 50,
        change24h: 2.5,
        change7d: 5.2
      },
      {
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        symbol: 'USDC',
        name: 'USD Coin',
        balance: '5000',
        decimals: 6,
        priceUSD: 1,
        valueUSD: 5000,
        allocation: 33.33,
        change24h: 0.01,
        change7d: 0.02
      },
      {
        address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        balance: '2500',
        decimals: 18,
        priceUSD: 1,
        valueUSD: 2500,
        allocation: 16.67,
        change24h: 0.02,
        change7d: 0.01
      }
    ];
  }

  private async fetchTokenPrice(address: string): Promise<any> {
    // Mock implementation - would fetch from price oracle
    return {
      price: Math.random() * 3000,
      change24h: (Math.random() - 0.5) * 10,
      change7d: (Math.random() - 0.5) * 20
    };
  }

  private async calculatePortfolioMetrics(assets: Asset[]): Promise<PortfolioMetrics> {
    const totalValue = assets.reduce((sum, asset) => sum + asset.valueUSD, 0);
    const totalAssets = assets.length;
    
    // Calculate profit/loss (mock for now)
    const costBasis = totalValue * 0.9; // Assume 10% profit
    const profitLoss = totalValue - costBasis;
    const profitLossPercentage = (profitLoss / costBasis) * 100;
    
    // Calculate risk metrics
    const riskScore = this.calculateRiskScore(assets);
    const diversificationScore = this.calculateDiversificationScore(assets);
    const volatility = this.calculateVolatility(assets);
    const sharpeRatio = this.calculateSharpeRatio(profitLossPercentage, volatility);
    
    return {
      totalValue,
      totalAssets,
      profitLoss,
      profitLossPercentage,
      riskScore,
      diversificationScore,
      volatility,
      sharpeRatio
    };
  }

  private calculateRiskScore(assets: Asset[]): number {
    // Simple risk calculation based on allocation and volatility
    let riskScore = 0;
    
    assets.forEach(asset => {
      const volatility = Math.abs(asset.change7d);
      const allocationRisk = asset.allocation > 40 ? 2 : asset.allocation > 25 ? 1 : 0;
      riskScore += (volatility * asset.allocation / 100) + allocationRisk;
    });
    
    return Math.min(10, riskScore);
  }

  private calculateDiversificationScore(assets: Asset[]): number {
    // Score based on number of assets and allocation distribution
    const assetCount = assets.length;
    const maxAllocation = Math.max(...assets.map(a => a.allocation));
    
    let score = 0;
    
    if (assetCount >= 10) score += 3;
    else if (assetCount >= 5) score += 2;
    else if (assetCount >= 3) score += 1;
    
    if (maxAllocation < 30) score += 3;
    else if (maxAllocation < 50) score += 2;
    else if (maxAllocation < 70) score += 1;
    
    // Check for stablecoin allocation
    const stablecoinAllocation = assets
      .filter(a => ['USDC', 'USDT', 'DAI'].includes(a.symbol))
      .reduce((sum, a) => sum + a.allocation, 0);
    
    if (stablecoinAllocation > 10 && stablecoinAllocation < 40) score += 1;
    
    return Math.min(10, score);
  }

  private calculateVolatility(assets: Asset[]): number {
    // Weighted average volatility
    return assets.reduce((vol, asset) => {
      const assetVol = Math.abs(asset.change7d);
      return vol + (assetVol * asset.allocation / 100);
    }, 0);
  }

  private calculateSharpeRatio(returns: number, volatility: number): number {
    const riskFreeRate = 2; // 2% risk-free rate
    return volatility > 0 ? (returns - riskFreeRate) / volatility : 0;
  }

  private getTopMovers(assets: Asset[]): any {
    const gainers = assets
      .filter(a => a.change24h > 0)
      .sort((a, b) => b.change24h - a.change24h)
      .slice(0, 3);
    
    const losers = assets
      .filter(a => a.change24h < 0)
      .sort((a, b) => a.change24h - b.change24h)
      .slice(0, 3);
    
    return { gainers, losers };
  }

  private async analyzePerformance(context: AgentContext): Promise<AgentResponse> {
    try {
      if (!context.wallet?.address) {
        return {
          message: 'Please connect your wallet to analyze performance.',
          actions: [{
            type: 'connect_wallet',
            label: 'Connect Wallet',
            data: {}
          }],
          context: {}
        };
      }

      const performance = await this.calculatePerformanceMetrics(context.wallet.address);
      
      return {
        message: this.formatPerformanceAnalysis(performance),
        actions: [
          {
            type: 'view_performance_chart',
            label: 'View Chart',
            data: { performance }
          },
          {
            type: 'export_performance',
            label: 'Export Report',
            data: {}
          }
        ],
        context: { performanceAnalysis: performance }
      };
    } catch (error) {
      this.logger.error('Error analyzing performance:', error);
      throw error;
    }
  }

  private async calculatePerformanceMetrics(address: string): Promise<any> {
    // Mock performance data
    return {
      daily: { value: 150, percentage: 2.5 },
      weekly: { value: 500, percentage: 5.2 },
      monthly: { value: 1200, percentage: 12.5 },
      yearly: { value: 5000, percentage: 45.2 },
      allTime: { value: 7500, percentage: 75.0 },
      bestDay: { date: '2024-01-15', gain: 8.5 },
      worstDay: { date: '2024-01-22', loss: -5.2 },
      winRate: 65,
      averageHoldTime: '15 days'
    };
  }

  private async analyzeRisk(context: AgentContext): Promise<AgentResponse> {
    try {
      if (!context.wallet?.address) {
        return {
          message: 'Please connect your wallet for risk analysis.',
          actions: [{
            type: 'connect_wallet',
            label: 'Connect Wallet',
            data: {}
          }],
          context: {}
        };
      }

      const assets = await this.fetchPortfolioAssets(context.wallet.address);
      const riskAnalysis = await this.performRiskAnalysis(assets);
      
      return {
        message: this.formatRiskAnalysis(riskAnalysis),
        actions: [
          {
            type: 'mitigate_risks',
            label: 'Mitigate Risks',
            data: { riskAnalysis }
          },
          {
            type: 'set_risk_alerts',
            label: 'Set Risk Alerts',
            data: {}
          }
        ],
        context: { riskAnalysis }
      };
    } catch (error) {
      this.logger.error('Error analyzing risk:', error);
      throw error;
    }
  }

  private async performRiskAnalysis(assets: Asset[]): Promise<RiskAnalysis> {
    const riskFactors: string[] = [];
    const recommendations: string[] = [];
    const exposures: any[] = [];
    
    // Analyze concentration risk
    const maxAllocation = Math.max(...assets.map(a => a.allocation));
    if (maxAllocation > 50) {
      riskFactors.push(`High concentration risk: ${maxAllocation.toFixed(1)}% in single asset`);
      recommendations.push('Consider diversifying to reduce concentration risk');
    }
    
    // Analyze volatility risk
    const avgVolatility = this.calculateVolatility(assets);
    if (avgVolatility > 15) {
      riskFactors.push(`High volatility: ${avgVolatility.toFixed(1)}%`);
      recommendations.push('Add stablecoins to reduce portfolio volatility');
    }
    
    // Analyze stablecoin allocation
    const stablecoinAllocation = assets
      .filter(a => ['USDC', 'USDT', 'DAI'].includes(a.symbol))
      .reduce((sum, a) => sum + a.allocation, 0);
    
    if (stablecoinAllocation < 10) {
      riskFactors.push('Low stablecoin allocation');
      recommendations.push('Consider holding 10-20% in stablecoins for stability');
    }
    
    // Calculate exposures
    exposures.push({
      type: 'Volatile Assets',
      percentage: 100 - stablecoinAllocation,
      risk: stablecoinAllocation < 20 ? 'high' : 'medium'
    });
    
    exposures.push({
      type: 'DeFi Protocols',
      percentage: 75, // Mock value
      risk: 'medium'
    });
    
    const overallRisk = riskFactors.length > 2 ? 'high' : riskFactors.length > 0 ? 'medium' : 'low';
    
    return {
      overallRisk,
      riskFactors,
      recommendations,
      exposures
    };
  }

  private async getRebalanceRecommendations(context: AgentContext): Promise<AgentResponse> {
    try {
      if (!context.wallet?.address) {
        return {
          message: 'Please connect your wallet for rebalancing recommendations.',
          actions: [{
            type: 'connect_wallet',
            label: 'Connect Wallet',
            data: {}
          }],
          context: {}
        };
      }

      const assets = await this.fetchPortfolioAssets(context.wallet.address);
      const recommendations = await this.generateRebalanceRecommendations(assets);
      
      return {
        message: this.formatRebalanceRecommendations(recommendations),
        actions: recommendations.slice(0, 3).map(rec => ({
          type: 'execute_rebalance',
          label: `${rec.action.toUpperCase()} ${rec.token}`,
          data: { recommendation: rec }
        })),
        context: { rebalanceRecommendations: recommendations }
      };
    } catch (error) {
      this.logger.error('Error generating rebalance recommendations:', error);
      throw error;
    }
  }

  private async generateRebalanceRecommendations(assets: Asset[]): Promise<RebalanceRecommendation[]> {
    const recommendations: RebalanceRecommendation[] = [];
    const targetAllocations = this.calculateTargetAllocations(assets);
    
    assets.forEach(asset => {
      const target = targetAllocations[asset.symbol] || 0;
      const diff = asset.allocation - target;
      
      if (Math.abs(diff) > 5) { // Only recommend if difference > 5%
        if (diff > 0) {
          recommendations.push({
            action: 'sell',
            token: asset.symbol,
            amount: (diff / 100) * asset.valueUSD,
            reason: `Over-allocated by ${diff.toFixed(1)}%`,
            impact: 'Reduce concentration risk'
          });
        } else {
          recommendations.push({
            action: 'buy',
            token: asset.symbol,
            amount: Math.abs((diff / 100) * asset.valueUSD),
            reason: `Under-allocated by ${Math.abs(diff).toFixed(1)}%`,
            impact: 'Improve diversification'
          });
        }
      }
    });
    
    return recommendations;
  }

  private calculateTargetAllocations(assets: Asset[]): { [symbol: string]: number } {
    // Simple equal-weight strategy with stablecoin buffer
    const stablecoins = ['USDC', 'USDT', 'DAI'];
    const stablecoinTarget = 20; // 20% in stablecoins
    const remainingAllocation = 80;
    
    const nonStableAssets = assets.filter(a => !stablecoins.includes(a.symbol));
    const stableAssets = assets.filter(a => stablecoins.includes(a.symbol));
    
    const targets: { [symbol: string]: number } = {};
    
    // Allocate to stablecoins
    stableAssets.forEach(asset => {
      targets[asset.symbol] = stablecoinTarget / stableAssets.length;
    });
    
    // Allocate to non-stable assets
    nonStableAssets.forEach(asset => {
      targets[asset.symbol] = remainingAllocation / nonStableAssets.length;
    });
    
    return targets;
  }

  private async analyzeAllocation(context: AgentContext): Promise<AgentResponse> {
    try {
      if (!context.wallet?.address) {
        return {
          message: 'Please connect your wallet to analyze allocation.',
          actions: [{
            type: 'connect_wallet',
            label: 'Connect Wallet',
            data: {}
          }],
          context: {}
        };
      }

      const assets = await this.fetchPortfolioAssets(context.wallet.address);
      const allocation = this.analyzeAssetAllocation(assets);
      
      return {
        message: this.formatAllocationAnalysis(allocation),
        actions: [
          {
            type: 'view_allocation_chart',
            label: 'View Pie Chart',
            data: { allocation }
          },
          {
            type: 'optimize_allocation',
            label: 'Optimize',
            data: {}
          }
        ],
        context: { allocationAnalysis: allocation }
      };
    } catch (error) {
      this.logger.error('Error analyzing allocation:', error);
      throw error;
    }
  }

  private analyzeAssetAllocation(assets: Asset[]): any {
    const byCategory = {
      stablecoins: 0,
      defi: 0,
      ethereum: 0,
      other: 0
    };
    
    assets.forEach(asset => {
      if (['USDC', 'USDT', 'DAI'].includes(asset.symbol)) {
        byCategory.stablecoins += asset.allocation;
      } else if (asset.symbol === 'WETH' || asset.symbol === 'ETH') {
        byCategory.ethereum += asset.allocation;
      } else if (['UNI', 'AAVE', 'COMP', 'SUSHI'].includes(asset.symbol)) {
        byCategory.defi += asset.allocation;
      } else {
        byCategory.other += asset.allocation;
      }
    });
    
    return {
      byAsset: assets.map(a => ({ symbol: a.symbol, allocation: a.allocation })),
      byCategory,
      concentration: this.calculateConcentrationMetrics(assets)
    };
  }

  private calculateConcentrationMetrics(assets: Asset[]): any {
    const herfindahlIndex = assets.reduce((sum, asset) => {
      return sum + Math.pow(asset.allocation / 100, 2);
    }, 0);
    
    return {
      herfindahlIndex: herfindahlIndex,
      topAssetConcentration: Math.max(...assets.map(a => a.allocation)),
      top3Concentration: assets.slice(0, 3).reduce((sum, a) => sum + a.allocation, 0)
    };
  }

  private async setupPortfolioTracking(intent: any, context: AgentContext): Promise<AgentResponse> {
    try {
      const trackingConfig = {
        metrics: ['totalValue', 'profitLoss', 'riskScore'],
        frequency: 'daily',
        alerts: {
          valueChange: 10, // Alert on 10% change
          riskIncrease: 2, // Alert if risk score increases by 2
          rebalanceNeeded: true
        }
      };
      
      return {
        message: `Portfolio tracking configured:\n\n${this.formatTrackingConfig(trackingConfig)}`,
        actions: [
          {
            type: 'save_tracking',
            label: 'Save Configuration',
            data: { trackingConfig }
          },
          {
            type: 'test_alerts',
            label: 'Test Alerts',
            data: {}
          }
        ],
        context: { trackingConfig }
      };
    } catch (error) {
      this.logger.error('Error setting up tracking:', error);
      throw error;
    }
  }

  private async exportPortfolioReport(context: AgentContext): Promise<AgentResponse> {
    try {
      if (!context.wallet?.address) {
        return {
          message: 'Please connect your wallet to export report.',
          actions: [{
            type: 'connect_wallet',
            label: 'Connect Wallet',
            data: {}
          }],
          context: {}
        };
      }

      // Generate comprehensive report
      const report = await this.generatePortfolioReport(context.wallet.address);
      
      return {
        message: 'Portfolio report generated successfully. Choose export format:',
        actions: [
          {
            type: 'export_pdf',
            label: 'Export as PDF',
            data: { report }
          },
          {
            type: 'export_csv',
            label: 'Export as CSV',
            data: { report }
          },
          {
            type: 'email_report',
            label: 'Email Report',
            data: { report }
          }
        ],
        context: { portfolioReport: report }
      };
    } catch (error) {
      this.logger.error('Error exporting report:', error);
      throw error;
    }
  }

  private async generatePortfolioReport(address: string): Promise<any> {
    const assets = await this.fetchPortfolioAssets(address);
    const metrics = await this.calculatePortfolioMetrics(assets);
    const performance = await this.calculatePerformanceMetrics(address);
    const riskAnalysis = await this.performRiskAnalysis(assets);
    
    return {
      generatedAt: new Date().toISOString(),
      walletAddress: address,
      assets,
      metrics,
      performance,
      riskAnalysis,
      recommendations: await this.generateRebalanceRecommendations(assets)
    };
  }

  private async handleGeneralPortfolioQuery(message: string, context: AgentContext): Promise<AgentResponse> {
    return {
      message: `I can help you manage and analyze your portfolio. Here's what I can do:
      • Portfolio overview and valuation
      • Performance tracking and analysis
      • Risk assessment and management
      • Rebalancing recommendations
      • Asset allocation analysis
      • Portfolio tracking and alerts
      • Export detailed reports`,
      actions: [
        {
          type: 'portfolio_overview',
          label: 'View Portfolio',
          data: {}
        },
        {
          type: 'analyze_risk',
          label: 'Risk Analysis',
          data: {}
        },
        {
          type: 'get_recommendations',
          label: 'Get Recommendations',
          data: {}
        }
      ],
      context: {}
    };
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

  private formatPortfolioOverview(assets: Asset[], metrics: PortfolioMetrics, topMovers: any): string {
    return `💼 Portfolio Overview

📊 Total Value: $${metrics.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
📈 P&L: ${metrics.profitLoss >= 0 ? '+' : ''}$${metrics.profitLoss.toFixed(2)} (${metrics.profitLossPercentage >= 0 ? '+' : ''}${metrics.profitLossPercentage.toFixed(2)}%)

📋 Holdings (${metrics.totalAssets} assets):
${assets.slice(0, 5).map(a => 
  `• ${a.symbol}: $${a.valueUSD.toFixed(2)} (${a.allocation.toFixed(1)}%) ${a.change24h >= 0 ? '↑' : '↓'} ${Math.abs(a.change24h).toFixed(2)}%`
).join('\n')}

🎯 Risk Metrics:
• Risk Score: ${metrics.riskScore.toFixed(1)}/10
• Diversification: ${metrics.diversificationScore.toFixed(1)}/10
• Volatility: ${metrics.volatility.toFixed(2)}%
• Sharpe Ratio: ${metrics.sharpeRatio.toFixed(2)}

📈 Top Gainers:
${topMovers.gainers.map((g: Asset) => `• ${g.symbol}: +${g.change24h.toFixed(2)}%`).join('\n') || 'None'}

📉 Top Losers:
${topMovers.losers.map((l: Asset) => `• ${l.symbol}: ${l.change24h.toFixed(2)}%`).join('\n') || 'None'}`;
  }

  private formatPerformanceAnalysis(performance: any): string {
    return `📊 Performance Analysis

📈 Returns:
• 24h: ${performance.daily.percentage >= 0 ? '+' : ''}${performance.daily.percentage.toFixed(2)}% ($${performance.daily.value.toFixed(2)})
• 7d: ${performance.weekly.percentage >= 0 ? '+' : ''}${performance.weekly.percentage.toFixed(2)}% ($${performance.weekly.value.toFixed(2)})
• 30d: ${performance.monthly.percentage >= 0 ? '+' : ''}${performance.monthly.percentage.toFixed(2)}% ($${performance.monthly.value.toFixed(2)})
• 1y: ${performance.yearly.percentage >= 0 ? '+' : ''}${performance.yearly.percentage.toFixed(2)}% ($${performance.yearly.value.toFixed(2)})
• All-time: ${performance.allTime.percentage >= 0 ? '+' : ''}${performance.allTime.percentage.toFixed(2)}% ($${performance.allTime.value.toFixed(2)})

📊 Statistics:
• Win Rate: ${performance.winRate}%
• Average Hold Time: ${performance.averageHoldTime}
• Best Day: ${performance.bestDay.date} (+${performance.bestDay.gain}%)
• Worst Day: ${performance.worstDay.date} (${performance.worstDay.loss}%)`;
  }

  private formatRiskAnalysis(analysis: RiskAnalysis): string {
    return `⚠️ Risk Analysis

Overall Risk Level: ${analysis.overallRisk.toUpperCase()}

🚨 Risk Factors:
${analysis.riskFactors.map(f => `• ${f}`).join('\n') || '• Portfolio is well-balanced'}

💡 Recommendations:
${analysis.recommendations.map(r => `• ${r}`).join('\n') || '• Continue current strategy'}

📊 Exposures:
${analysis.exposures.map(e => 
  `• ${e.type}: ${e.percentage.toFixed(1)}% (Risk: ${e.risk})`
).join('\n')}`;
  }

  private formatRebalanceRecommendations(recommendations: RebalanceRecommendation[]): string {
    if (recommendations.length === 0) {
      return '✅ Your portfolio is well-balanced. No rebalancing needed at this time.';
    }
    
    return `🔄 Rebalancing Recommendations

${recommendations.map((rec, i) => 
  `${i + 1}. ${rec.action.toUpperCase()} ${rec.token}
   • Amount: $${rec.amount.toFixed(2)}
   • Reason: ${rec.reason}
   • Impact: ${rec.impact}`
).join('\n\n')}

💡 Executing these recommendations will optimize your portfolio allocation and reduce risk.`;
  }

  private formatAllocationAnalysis(allocation: any): string {
    return `📊 Asset Allocation Analysis

By Asset:
${allocation.byAsset.slice(0, 10).map((a: any) => 
  `• ${a.symbol}: ${a.allocation.toFixed(1)}%`
).join('\n')}

By Category:
• Stablecoins: ${allocation.byCategory.stablecoins.toFixed(1)}%
• Ethereum: ${allocation.byCategory.ethereum.toFixed(1)}%
• DeFi Tokens: ${allocation.byCategory.defi.toFixed(1)}%
• Other: ${allocation.byCategory.other.toFixed(1)}%

Concentration Metrics:
• Herfindahl Index: ${allocation.concentration.herfindahlIndex.toFixed(4)}
• Top Asset: ${allocation.concentration.topAssetConcentration.toFixed(1)}%
• Top 3 Assets: ${allocation.concentration.top3Concentration.toFixed(1)}%`;
  }

  private formatTrackingConfig(config: any): string {
    return `📊 Tracking Configuration

Metrics: ${config.metrics.join(', ')}
Frequency: ${config.frequency}

🔔 Alert Thresholds:
• Value Change: ±${config.alerts.valueChange}%
• Risk Increase: +${config.alerts.riskIncrease} points
• Rebalance Alerts: ${config.alerts.rebalanceNeeded ? 'Enabled' : 'Disabled'}`;
  }
}