import axios from 'axios';
import { BaseAgent } from './base-agent';
import { AgentContext, AgentResponse } from '../types';
import { DecodedMessage } from '@xmtp/browser-sdk';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

interface MarketMetrics {
  totalValueLocked: number;
  volume24h: number;
  dominance: { [protocol: string]: number };
  gasPrice: number;
  activeUsers24h: number;
  transactionCount24h: number;
}

interface YieldOpportunity {
  protocol: string;
  pool: string;
  apy: number;
  tvl: number;
  risk: 'low' | 'medium' | 'high';
  tokens: string[];
  rewards: string[];
  impermanentLossRisk: number;
}

interface LiquidityPool {
  protocol: string;
  pair: string;
  tvl: number;
  volume24h: number;
  fees24h: number;
  apy: number;
  utilization: number;
}

interface MarketTrend {
  trend: 'bullish' | 'bearish' | 'neutral';
  strength: number;
  indicators: {
    name: string;
    value: number;
    signal: string;
  }[];
  support: number;
  resistance: number;
}

interface DeFiProtocol {
  name: string;
  tvl: number;
  marketShare: number;
  users: number;
  change24h: number;
  category: string;
}

export class DeFiAnalyticsAgent extends BaseAgent {
  private x402PaymentRequired: boolean = true;
  private x402PricePerRequest: number = 0.001; // Price in ETH
  private cdpApiKey: string;
  private cdpApiSecret: string;
  private baseApiUrl = 'https://api.cdp.coinbase.com/platform';
  private defiApiUrl = 'https://api.cdp.coinbase.com/v2/defi';

  constructor() {
    super({
      name: 'DeFiAnalytics',
      description: 'DeFi analytics and market insights agent with premium features',
      version: '1.0.0',
      capabilities: ['market-analysis', 'yield-optimization', 'liquidity-analysis', 'impermanent-loss'],
      isActive: true
    });
    this.cdpApiKey = process.env.COINBASE_CDP_API_KEY || '';
    this.cdpApiSecret = process.env.COINBASE_CDP_API_SECRET || '';
  }

  protected async handleMessage(message: DecodedMessage, context: AgentContext): Promise<AgentResponse> {
    const messageContent = typeof message.content === 'string' ? message.content : '';
    
    // Check for x402 payment if required
    if (this.x402PaymentRequired && !await this.verifyX402Payment(context)) {
      return this.createPaymentRequiredResponse();
    }
    
    this.logger.info(`Processing DeFi analytics request: ${messageContent}`);
    
    try {
      const intent = this.analyzeAnalyticsIntent(messageContent);
      
      switch (intent.action) {
        case 'market_overview':
          return await this.getMarketOverview(context);
        case 'yield_opportunities':
          return await this.findYieldOpportunities(context);
        case 'liquidity_analysis':
          return await this.analyzeLiquidity(intent, context);
        case 'protocol_comparison':
          return await this.compareProtocols(intent, context);
        case 'trend_analysis':
          return await this.analyzeTrends(intent, context);
        case 'gas_optimization':
          return await this.optimizeGas(context);
        case 'impermanent_loss':
          return await this.calculateImpermanentLoss(intent, context);
        default:
          return await this.handleGeneralAnalyticsQuery(messageContent, context);
      }
    } catch (error) {
      this.logger.error('Error processing analytics request:', error);
      return {
        message: 'I encountered an error analyzing DeFi metrics. Please try again.',
        actions: [],
        context: {}
      };
    }
  }

  private analyzeAnalyticsIntent(message: string): any {
    const lower = message.toLowerCase();
    
    if (lower.includes('market') || lower.includes('overview') || lower.includes('tvl')) {
      return { action: 'market_overview' };
    }
    
    if (lower.includes('yield') || lower.includes('apy') || lower.includes('farm')) {
      return { action: 'yield_opportunities' };
    }
    
    if (lower.includes('liquidity') || lower.includes('pool')) {
      return { action: 'liquidity_analysis', pools: this.extractPools(message) };
    }
    
    if (lower.includes('protocol') || lower.includes('compare')) {
      return { action: 'protocol_comparison', protocols: this.extractProtocols(message) };
    }
    
    if (lower.includes('trend') || lower.includes('technical') || lower.includes('analysis')) {
      return { action: 'trend_analysis', tokens: this.extractTokens(message) };
    }
    
    if (lower.includes('gas') || lower.includes('fee')) {
      return { action: 'gas_optimization' };
    }
    
    if (lower.includes('impermanent') || lower.includes('il')) {
      return { action: 'impermanent_loss', pair: this.extractPair(message) };
    }
    
    return { action: 'general' };
  }

  private async getMarketOverview(context: AgentContext): Promise<AgentResponse> {
    try {
      const metrics = await this.fetchMarketMetrics();
      const topProtocols = await this.fetchTopProtocols();
      const marketHealth = this.assessMarketHealth(metrics);
      
      return {
        message: this.formatMarketOverview(metrics, topProtocols, marketHealth),
        actions: [
          {
            type: 'view_detailed_metrics',
            label: 'View Details',
            data: { metrics, protocols: topProtocols }
          },
          {
            type: 'set_market_alerts',
            label: 'Set Alerts',
            data: {}
          },
          {
            type: 'export_report',
            label: 'Export Report',
            data: {}
          }
        ],
        context: { marketOverview: { metrics, topProtocols, marketHealth } }
      };
    } catch (error) {
      this.logger.error('Error getting market overview:', error);
      throw error;
    }
  }

  private async fetchMarketMetrics(): Promise<MarketMetrics> {
    try {
      // In production, fetch from CDP API
      // Mock data for now
      return {
        totalValueLocked: 45000000000,
        volume24h: 2500000000,
        dominance: {
          'Uniswap': 35,
          'Curve': 20,
          'Aave': 15,
          'Compound': 10,
          'Other': 20
        },
        gasPrice: 30,
        activeUsers24h: 125000,
        transactionCount24h: 1500000
      };
    } catch (error) {
      this.logger.error('Error fetching market metrics:', error);
      throw error;
    }
  }

  private async fetchTopProtocols(): Promise<DeFiProtocol[]> {
    // Mock implementation
    return [
      {
        name: 'Uniswap',
        tvl: 5000000000,
        marketShare: 35,
        users: 50000,
        change24h: 2.5,
        category: 'DEX'
      },
      {
        name: 'Aave',
        tvl: 3000000000,
        marketShare: 20,
        users: 25000,
        change24h: -1.2,
        category: 'Lending'
      },
      {
        name: 'Curve',
        tvl: 2500000000,
        marketShare: 15,
        users: 15000,
        change24h: 3.8,
        category: 'DEX'
      }
    ];
  }

  private assessMarketHealth(metrics: MarketMetrics): any {
    const tvlChange = 2.5; // Mock
    const volumeChange = 5.2; // Mock
    const userGrowth = 3.1; // Mock
    
    const health = {
      score: 75,
      status: 'healthy' as const,
      trends: {
        tvl: tvlChange > 0 ? 'growing' : 'declining',
        volume: volumeChange > 0 ? 'increasing' : 'decreasing',
        users: userGrowth > 0 ? 'expanding' : 'contracting'
      },
      risks: [] as string[],
      opportunities: [] as string[]
    };
    
    if (metrics.gasPrice > 50) {
      health.risks.push('High gas prices may limit user activity');
    }
    
    if (volumeChange > 10) {
      health.opportunities.push('Strong volume growth indicates market confidence');
    }
    
    return health;
  }

  private async findYieldOpportunities(context: AgentContext): Promise<AgentResponse> {
    try {
      const opportunities = await this.scanYieldOpportunities();
      const filtered = this.filterByRiskProfile(opportunities, context.riskProfile || 'medium');
      const optimized = this.optimizeYieldStrategy(filtered);
      
      return {
        message: this.formatYieldOpportunities(optimized),
        actions: optimized.slice(0, 3).map(opp => ({
          type: 'provide_liquidity',
          label: `Farm ${opp.protocol} (${opp.apy.toFixed(2)}% APY)`,
          data: { opportunity: opp }
        })),
        context: { yieldOpportunities: optimized }
      };
    } catch (error) {
      this.logger.error('Error finding yield opportunities:', error);
      throw error;
    }
  }

  private async scanYieldOpportunities(): Promise<YieldOpportunity[]> {
    // Mock implementation - would scan multiple protocols
    return [
      {
        protocol: 'Uniswap V3',
        pool: 'WETH/USDC',
        apy: 25.5,
        tvl: 10000000,
        risk: 'medium',
        tokens: ['WETH', 'USDC'],
        rewards: ['UNI'],
        impermanentLossRisk: 0.15
      },
      {
        protocol: 'Curve',
        pool: '3pool',
        apy: 8.2,
        tvl: 50000000,
        risk: 'low',
        tokens: ['USDC', 'USDT', 'DAI'],
        rewards: ['CRV'],
        impermanentLossRisk: 0.02
      },
      {
        protocol: 'Aave',
        pool: 'USDC Supply',
        apy: 5.5,
        tvl: 100000000,
        risk: 'low',
        tokens: ['USDC'],
        rewards: ['AAVE'],
        impermanentLossRisk: 0
      },
      {
        protocol: 'Yearn',
        pool: 'yvUSDC',
        apy: 12.3,
        tvl: 25000000,
        risk: 'medium',
        tokens: ['USDC'],
        rewards: ['YFI'],
        impermanentLossRisk: 0
      }
    ];
  }

  private filterByRiskProfile(opportunities: YieldOpportunity[], riskProfile: string): YieldOpportunity[] {
    const riskMap: { [key: string]: ('low' | 'medium' | 'high')[] } = {
      'conservative': ['low'],
      'moderate': ['low', 'medium'],
      'aggressive': ['low', 'medium', 'high']
    };
    
    const acceptableRisks = riskMap[riskProfile] || riskMap['moderate'];
    return opportunities.filter(opp => acceptableRisks.includes(opp.risk));
  }

  private optimizeYieldStrategy(opportunities: YieldOpportunity[]): YieldOpportunity[] {
    // Sort by risk-adjusted returns
    return opportunities.sort((a, b) => {
      const aScore = a.apy / (a.risk === 'low' ? 1 : a.risk === 'medium' ? 1.5 : 2);
      const bScore = b.apy / (b.risk === 'low' ? 1 : b.risk === 'medium' ? 1.5 : 2);
      return bScore - aScore;
    });
  }

  private async analyzeLiquidity(intent: any, context: AgentContext): Promise<AgentResponse> {
    try {
      const pools = await this.fetchLiquidityPools(intent.pools);
      const analysis = this.performLiquidityAnalysis(pools);
      
      return {
        message: this.formatLiquidityAnalysis(analysis),
        actions: [
          {
            type: 'add_liquidity',
            label: 'Add Liquidity',
            data: { bestPool: analysis.bestPool }
          },
          {
            type: 'liquidity_calculator',
            label: 'Calculate Returns',
            data: {}
          }
        ],
        context: { liquidityAnalysis: analysis }
      };
    } catch (error) {
      this.logger.error('Error analyzing liquidity:', error);
      throw error;
    }
  }

  private async fetchLiquidityPools(poolNames?: string[]): Promise<LiquidityPool[]> {
    // Mock implementation
    return [
      {
        protocol: 'Uniswap V3',
        pair: 'WETH/USDC',
        tvl: 50000000,
        volume24h: 10000000,
        fees24h: 30000,
        apy: 15.5,
        utilization: 65
      },
      {
        protocol: 'SushiSwap',
        pair: 'WETH/USDC',
        tvl: 20000000,
        volume24h: 5000000,
        fees24h: 15000,
        apy: 18.2,
        utilization: 75
      }
    ];
  }

  private performLiquidityAnalysis(pools: LiquidityPool[]): any {
    const totalTVL = pools.reduce((sum, p) => sum + p.tvl, 0);
    const avgAPY = pools.reduce((sum, p) => sum + p.apy, 0) / pools.length;
    const bestPool = pools.reduce((best, p) => p.apy > best.apy ? p : best);
    const mostEfficient = pools.reduce((best, p) => {
      const efficiency = (p.fees24h / p.tvl) * 365 * 100;
      const bestEfficiency = (best.fees24h / best.tvl) * 365 * 100;
      return efficiency > bestEfficiency ? p : best;
    });
    
    return {
      pools,
      totalTVL,
      avgAPY,
      bestPool,
      mostEfficient,
      recommendations: this.generateLiquidityRecommendations(pools)
    };
  }

  private generateLiquidityRecommendations(pools: LiquidityPool[]): string[] {
    const recommendations: string[] = [];
    
    const highUtilization = pools.filter(p => p.utilization > 80);
    if (highUtilization.length > 0) {
      recommendations.push('High utilization pools may offer better returns but higher risk');
    }
    
    const lowTVL = pools.filter(p => p.tvl < 1000000);
    if (lowTVL.length > 0) {
      recommendations.push('Consider pools with higher TVL for better stability');
    }
    
    return recommendations;
  }

  private async compareProtocols(intent: any, context: AgentContext): Promise<AgentResponse> {
    try {
      const protocols = await this.fetchProtocolData(intent.protocols);
      const comparison = this.performProtocolComparison(protocols);
      
      return {
        message: this.formatProtocolComparison(comparison),
        actions: [
          {
            type: 'view_protocol_details',
            label: 'View Details',
            data: { comparison }
          },
          {
            type: 'protocol_alerts',
            label: 'Set Protocol Alerts',
            data: {}
          }
        ],
        context: { protocolComparison: comparison }
      };
    } catch (error) {
      this.logger.error('Error comparing protocols:', error);
      throw error;
    }
  }

  private async fetchProtocolData(protocolNames?: string[]): Promise<DeFiProtocol[]> {
    // Mock implementation
    return [
      {
        name: 'Uniswap',
        tvl: 5000000000,
        marketShare: 35,
        users: 50000,
        change24h: 2.5,
        category: 'DEX'
      },
      {
        name: 'SushiSwap',
        tvl: 1000000000,
        marketShare: 8,
        users: 15000,
        change24h: -0.5,
        category: 'DEX'
      }
    ];
  }

  private performProtocolComparison(protocols: DeFiProtocol[]): any {
    const leader = protocols.reduce((best, p) => p.tvl > best.tvl ? p : best);
    const fastestGrowing = protocols.reduce((best, p) => p.change24h > best.change24h ? p : best);
    const mostUsers = protocols.reduce((best, p) => p.users > best.users ? p : best);
    
    return {
      protocols,
      leader,
      fastestGrowing,
      mostUsers,
      analysis: {
        competitiveness: this.assessCompetitiveness(protocols),
        trends: this.identifyProtocolTrends(protocols)
      }
    };
  }

  private assessCompetitiveness(protocols: DeFiProtocol[]): string {
    const tvlRange = Math.max(...protocols.map(p => p.tvl)) - Math.min(...protocols.map(p => p.tvl));
    if (tvlRange > 1000000000) {
      return 'Highly competitive with significant TVL disparity';
    }
    return 'Moderately competitive market';
  }

  private identifyProtocolTrends(protocols: DeFiProtocol[]): string[] {
    const trends: string[] = [];
    
    const growingProtocols = protocols.filter(p => p.change24h > 0);
    if (growingProtocols.length > protocols.length / 2) {
      trends.push('Overall positive growth trend across protocols');
    }
    
    const dexProtocols = protocols.filter(p => p.category === 'DEX');
    if (dexProtocols.length > protocols.length / 2) {
      trends.push('DEX protocols dominating the market');
    }
    
    return trends;
  }

  private async analyzeTrends(intent: any, context: AgentContext): Promise<AgentResponse> {
    try {
      const trends = await this.performTrendAnalysis(intent.tokens);
      
      return {
        message: this.formatTrendAnalysis(trends),
        actions: [
          {
            type: 'view_charts',
            label: 'View Charts',
            data: { trends }
          },
          {
            type: 'set_trend_alerts',
            label: 'Set Trend Alerts',
            data: {}
          }
        ],
        context: { trendAnalysis: trends }
      };
    } catch (error) {
      this.logger.error('Error analyzing trends:', error);
      throw error;
    }
  }

  private async performTrendAnalysis(tokens: string[]): Promise<MarketTrend[]> {
    // Mock implementation
    return tokens.map(token => ({
      trend: 'bullish' as const,
      strength: 0.7,
      indicators: [
        { name: 'RSI', value: 65, signal: 'Bullish' },
        { name: 'MACD', value: 0.5, signal: 'Buy' },
        { name: 'Volume', value: 150, signal: 'Increasing' }
      ],
      support: 2800,
      resistance: 3200
    }));
  }

  private async optimizeGas(context: AgentContext): Promise<AgentResponse> {
    try {
      const gasData = await this.fetchGasData();
      const optimization = this.generateGasOptimization(gasData);
      
      return {
        message: this.formatGasOptimization(gasData, optimization),
        actions: [
          {
            type: 'set_gas_alerts',
            label: 'Set Gas Alerts',
            data: { threshold: optimization.recommendedMaxGas }
          },
          {
            type: 'schedule_transaction',
            label: 'Schedule Transaction',
            data: { bestTime: optimization.bestTime }
          }
        ],
        context: { gasOptimization: optimization }
      };
    } catch (error) {
      this.logger.error('Error optimizing gas:', error);
      throw error;
    }
  }

  private async fetchGasData(): Promise<any> {
    // Mock implementation
    return {
      current: 30,
      fast: 45,
      standard: 30,
      slow: 20,
      history: {
        '1h': 35,
        '6h': 40,
        '24h': 32
      },
      prediction: {
        '1h': 28,
        '6h': 25,
        '24h': 30
      }
    };
  }

  private generateGasOptimization(gasData: any): any {
    return {
      currentOptimal: gasData.standard,
      recommendedMaxGas: gasData.standard * 1.2,
      bestTime: 'In 6 hours (predicted: 25 Gwei)',
      savings: {
        vsfast: ((gasData.fast - gasData.standard) / gasData.fast * 100).toFixed(1),
        potential: '15-30%'
      },
      strategy: gasData.current > 40 ? 'Wait for lower gas' : 'Good time to transact'
    };
  }

  private async calculateImpermanentLoss(intent: any, context: AgentContext): Promise<AgentResponse> {
    try {
      const { pair } = intent;
      const ilCalculation = await this.performILCalculation(pair);
      
      return {
        message: this.formatImpermanentLoss(ilCalculation),
        actions: [
          {
            type: 'il_calculator',
            label: 'Advanced Calculator',
            data: {}
          },
          {
            type: 'hedge_strategies',
            label: 'View Hedge Strategies',
            data: {}
          }
        ],
        context: { impermanentLoss: ilCalculation }
      };
    } catch (error) {
      this.logger.error('Error calculating impermanent loss:', error);
      throw error;
    }
  }

  private async performILCalculation(pair: string): Promise<any> {
    // Mock calculation
    const priceRatio = 1.5; // 50% price change
    const il = this.calculateIL(priceRatio);
    
    return {
      pair: pair || 'WETH/USDC',
      priceChange: 50,
      impermanentLoss: il,
      scenarios: [
        { change: 10, loss: this.calculateIL(1.1) },
        { change: 25, loss: this.calculateIL(1.25) },
        { change: 50, loss: this.calculateIL(1.5) },
        { change: 100, loss: this.calculateIL(2) }
      ],
      breakeven: this.calculateBreakeven(il),
      hedgeStrategies: ['Use options to hedge', 'Provide liquidity in stable pairs', 'Use concentrated liquidity']
    };
  }

  private calculateIL(priceRatio: number): number {
    // IL = 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
    return (2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1) * 100;
  }

  private calculateBreakeven(il: number): string {
    // Simplified calculation
    const daysToBreakeven = Math.abs(il) / 0.1; // Assuming 0.1% daily fees
    return `${daysToBreakeven.toFixed(0)} days at current fee rate`;
  }

  private async handleGeneralAnalyticsQuery(message: string, context: AgentContext): Promise<AgentResponse> {
    return {
      message: `I provide comprehensive DeFi analytics and insights. Here's what I can analyze:
      • Market overview and TVL metrics
      • Yield farming opportunities
      • Liquidity pool analysis
      • Protocol comparisons
      • Trend analysis and technical indicators
      • Gas optimization strategies
      • Impermanent loss calculations`,
      actions: [
        {
          type: 'market_overview',
          label: 'Market Overview',
          data: {}
        },
        {
          type: 'find_yields',
          label: 'Find Yield Opportunities',
          data: {}
        },
        {
          type: 'analyze_trends',
          label: 'Analyze Trends',
          data: {}
        }
      ],
      context: {}
    };
  }

  private extractPools(message: string): string[] {
    // Extract pool names from message
    const pools: string[] = [];
    const commonPools = ['WETH/USDC', 'WBTC/WETH', 'USDC/USDT'];
    
    commonPools.forEach(pool => {
      if (message.toUpperCase().includes(pool.split('/')[0]) && 
          message.toUpperCase().includes(pool.split('/')[1])) {
        pools.push(pool);
      }
    });
    
    return pools;
  }

  private extractProtocols(message: string): string[] {
    const protocols: string[] = [];
    const commonProtocols = ['Uniswap', 'Aave', 'Compound', 'Curve', 'SushiSwap', 'Yearn'];
    
    commonProtocols.forEach(protocol => {
      if (message.toLowerCase().includes(protocol.toLowerCase())) {
        protocols.push(protocol);
      }
    });
    
    return protocols;
  }

  private extractTokens(message: string): string[] {
    const tokens: string[] = [];
    const commonTokens = ['WETH', 'USDC', 'USDT', 'WBTC', 'DAI'];
    
    commonTokens.forEach(token => {
      if (message.toUpperCase().includes(token)) {
        tokens.push(token);
      }
    });
    
    return tokens;
  }

  private extractPair(message: string): string {
    const match = message.match(/(\w+)\/(\w+)/);
    return match ? `${match[1]}/${match[2]}` : 'WETH/USDC';
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

  private formatMarketOverview(metrics: MarketMetrics, protocols: DeFiProtocol[], health: any): string {
    return `📊 DeFi Market Overview

🏦 Total Value Locked: $${(metrics.totalValueLocked / 1e9).toFixed(2)}B
📈 24h Volume: $${(metrics.volume24h / 1e9).toFixed(2)}B
👥 Active Users (24h): ${metrics.activeUsers24h.toLocaleString()}
🔥 Transactions (24h): ${metrics.transactionCount24h.toLocaleString()}
⛽ Gas Price: ${metrics.gasPrice} Gwei

🏆 Top Protocols:
${protocols.slice(0, 5).map(p => 
  `• ${p.name}: $${(p.tvl / 1e9).toFixed(2)}B TVL (${p.change24h >= 0 ? '+' : ''}${p.change24h.toFixed(2)}%)`
).join('\n')}

💡 Market Health: ${health.status.toUpperCase()} (${health.score}/100)
• TVL Trend: ${health.trends.tvl}
• Volume Trend: ${health.trends.volume}
• User Growth: ${health.trends.users}

${health.risks.length > 0 ? `⚠️ Risks:\n${health.risks.map(r => `• ${r}`).join('\n')}` : ''}
${health.opportunities.length > 0 ? `✅ Opportunities:\n${health.opportunities.map(o => `• ${o}`).join('\n')}` : ''}`;
  }

  private formatYieldOpportunities(opportunities: YieldOpportunity[]): string {
    if (opportunities.length === 0) {
      return 'No yield opportunities found matching your criteria.';
    }
    
    return `🌾 Top Yield Opportunities

${opportunities.slice(0, 5).map((opp, i) => 
  `${i + 1}. ${opp.protocol} - ${opp.pool}
   • APY: ${opp.apy.toFixed(2)}%
   • TVL: $${(opp.tvl / 1e6).toFixed(2)}M
   • Risk: ${opp.risk.toUpperCase()}
   • Tokens: ${opp.tokens.join('/')}
   • Rewards: ${opp.rewards.join(', ')}
   • IL Risk: ${(opp.impermanentLossRisk * 100).toFixed(1)}%`
).join('\n\n')}

💡 Strategy: Diversify across multiple pools to balance risk and returns`;
  }

  private formatLiquidityAnalysis(analysis: any): string {
    return `💧 Liquidity Analysis

📊 Overview:
• Total TVL: $${(analysis.totalTVL / 1e6).toFixed(2)}M
• Average APY: ${analysis.avgAPY.toFixed(2)}%

🏆 Best APY Pool:
• ${analysis.bestPool.protocol} ${analysis.bestPool.pair}
• APY: ${analysis.bestPool.apy.toFixed(2)}%
• TVL: $${(analysis.bestPool.tvl / 1e6).toFixed(2)}M

⚡ Most Efficient:
• ${analysis.mostEfficient.protocol} ${analysis.mostEfficient.pair}
• Fee Efficiency: ${((analysis.mostEfficient.fees24h / analysis.mostEfficient.tvl) * 365 * 100).toFixed(2)}% annualized

📈 Pool Comparison:
${analysis.pools.map((p: LiquidityPool) => 
  `• ${p.protocol} ${p.pair}: ${p.apy.toFixed(2)}% APY, ${p.utilization}% utilized`
).join('\n')}

${analysis.recommendations.length > 0 ? `\n💡 Recommendations:\n${analysis.recommendations.map((r: string) => `• ${r}`).join('\n')}` : ''}`;
  }

  private formatProtocolComparison(comparison: any): string {
    return `🔬 Protocol Comparison

🏆 Market Leader: ${comparison.leader.name}
• TVL: $${(comparison.leader.tvl / 1e9).toFixed(2)}B
• Market Share: ${comparison.leader.marketShare}%

📈 Fastest Growing: ${comparison.fastestGrowing.name}
• 24h Change: +${comparison.fastestGrowing.change24h.toFixed(2)}%

👥 Most Users: ${comparison.mostUsers.name}
• Active Users: ${comparison.mostUsers.users.toLocaleString()}

📊 Detailed Comparison:
${comparison.protocols.map((p: DeFiProtocol) => 
  `\n${p.name} (${p.category}):
  • TVL: $${(p.tvl / 1e9).toFixed(2)}B
  • Market Share: ${p.marketShare}%
  • Users: ${p.users.toLocaleString()}
  • 24h Change: ${p.change24h >= 0 ? '+' : ''}${p.change24h.toFixed(2)}%`
).join('\n')}

💡 Market Analysis:
• ${comparison.analysis.competitiveness}
${comparison.analysis.trends.map((t: string) => `• ${t}`).join('\n')}`;
  }

  private formatTrendAnalysis(trends: MarketTrend[]): string {
    return trends.map(trend => `
📈 Trend Analysis

Direction: ${trend.trend.toUpperCase()}
Strength: ${(trend.strength * 100).toFixed(0)}%

📊 Technical Indicators:
${trend.indicators.map(i => `• ${i.name}: ${i.value} (${i.signal})`).join('\n')}

📍 Key Levels:
• Support: $${trend.support}
• Resistance: $${trend.resistance}
    `).join('\n---\n');
  }

  private formatGasOptimization(gasData: any, optimization: any): string {
    return `⛽ Gas Optimization

Current Gas Prices:
• Fast: ${gasData.fast} Gwei
• Standard: ${gasData.standard} Gwei
• Slow: ${gasData.slow} Gwei

📊 Historical (Last 24h):
• Average: ${gasData.history['24h']} Gwei
• 6h ago: ${gasData.history['6h']} Gwei
• 1h ago: ${gasData.history['1h']} Gwei

🔮 Predictions:
• 1 hour: ${gasData.prediction['1h']} Gwei
• 6 hours: ${gasData.prediction['6h']} Gwei
• 24 hours: ${gasData.prediction['24h']} Gwei

💡 Recommendations:
• Optimal Gas: ${optimization.currentOptimal} Gwei
• Max Recommended: ${optimization.recommendedMaxGas} Gwei
• Best Time: ${optimization.bestTime}
• Strategy: ${optimization.strategy}

💰 Potential Savings:
• vs Fast: ${optimization.savings.vsfast}%
• Overall: ${optimization.savings.potential}`;
  }

  private formatImpermanentLoss(calculation: any): string {
    return `📉 Impermanent Loss Calculator

Pair: ${calculation.pair}
Price Change: ${calculation.priceChange}%
Impermanent Loss: ${calculation.impermanentLoss.toFixed(2)}%

📊 IL Scenarios:
${calculation.scenarios.map((s: any) => 
  `• ${s.change}% price change: ${s.loss.toFixed(2)}% IL`
).join('\n')}

⏱️ Breakeven: ${calculation.breakeven}

🛡️ Hedge Strategies:
${calculation.hedgeStrategies.map((s: string) => `• ${s}`).join('\n')}

💡 Remember: IL is only realized when you withdraw liquidity. Trading fees may compensate for IL over time.`;
  }

  // Required abstract methods implementation
  protected async shouldHandleMessage(message: DecodedMessage, context: AgentContext): Promise<boolean> {
    const content = typeof message.content === 'string' ? message.content.toLowerCase() : '';
    const keywords = ['defi', 'analytics', 'yield', 'apy', 'tvl', 'liquidity', 'market', 'protocol', 'gas', 'impermanent'];
    return keywords.some(keyword => content.includes(keyword));
  }

  protected async suggestNextAgent(message: DecodedMessage, context: AgentContext): Promise<string> {
    const content = typeof message.content === 'string' ? message.content.toLowerCase() : '';
    if (content.includes('swap') || content.includes('trade')) return 'swap-agent';
    if (content.includes('sentiment') || content.includes('news')) return 'sentiment-agent';
    if (content.includes('portfolio')) return 'portfolio-agent';
    return 'master';
  }

  protected initializeTools(): void {
    // Tools are initialized inline in the analytics methods
    this.tools = [];
  }

  // x402 Payment Protocol Integration
  private async verifyX402Payment(context: AgentContext): Promise<boolean> {
    // Check if user has made payment via x402 protocol
    // This would integrate with the actual x402 payment verification
    const paymentHeader = context.messageHistory?.[0]?.headers?.['x-402-payment'];
    if (paymentHeader) {
      // Verify payment signature and amount
      return this.validateX402PaymentSignature(paymentHeader);
    }
    return false;
  }

  private validateX402PaymentSignature(paymentHeader: any): boolean {
    // Implement x402 payment signature validation
    // This would verify the cryptographic signature of the payment
    return true; // Placeholder - implement actual validation
  }

  private createPaymentRequiredResponse(): AgentResponse {
    return {
      message: `🔒 Premium Feature Required

This advanced DeFi analytics feature requires a micro-payment of ${this.x402PricePerRequest} ETH.

To access:
1. Send payment via x402 protocol
2. Include payment receipt in request header
3. Enjoy unlimited analytics for 24 hours

Payment Address: ${process.env.X402_PAYMENT_ADDRESS || '0x...'}

Benefits:
• Real-time market analytics
• Advanced yield optimization
• Professional trading insights
• Priority API access`,
      metadata: {
        paymentRequired: true,
        price: this.x402PricePerRequest,
        protocol: 'x402',
        agentName: 'DeFiAnalytics'
      },
      actions: [
        {
          type: 'payment',
          payload: {
            amount: this.x402PricePerRequest,
            currency: 'ETH',
            protocol: 'x402'
          }
        }
      ]
    };
  }
}