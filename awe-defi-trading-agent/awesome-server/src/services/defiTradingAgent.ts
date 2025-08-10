import { MCPToolAdapter } from './mcpToolAdapter.js';
import { logger } from '../utils/logger.js';
import { ethers } from 'ethers';
import axios from 'axios';

interface TradingStrategy {
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  minBalance: number;
  targetReturn: number;
}

interface MarketSignal {
  type: 'buy' | 'sell' | 'hold';
  confidence: number;
  asset: string;
  price: number;
  volume: number;
  timestamp: Date;
}

interface Position {
  asset: string;
  amount: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  openedAt: Date;
}

export class DeFiTradingAgent {
  private mcpAdapter: MCPToolAdapter;
  private provider: ethers.providers.JsonRpcProvider;
  private wallet?: ethers.Wallet;
  private positions: Map<string, Position> = new Map();
  private strategies: Map<string, TradingStrategy> = new Map();
  private isActive: boolean = false;

  constructor(
    private userId: string,
    private config: {
      rpcUrl: string;
      privateKey?: string;
      mcpServices: string[];
      maxPositions?: number;
      riskLimit?: number;
    }
  ) {
    this.mcpAdapter = new MCPToolAdapter();
    this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl || 'https://base.publicnode.com');
    
    if (config.privateKey) {
      this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    }

    this.initializeStrategies();
  }

  private initializeStrategies() {
    // Predefined trading strategies
    this.strategies.set('momentum', {
      name: 'Momentum Trading',
      description: 'Follows strong price trends with technical indicators',
      riskLevel: 'medium',
      minBalance: 100,
      targetReturn: 0.15 // 15% target
    });

    this.strategies.set('arbitrage', {
      name: 'DEX Arbitrage',
      description: 'Exploits price differences across DEXs',
      riskLevel: 'low',
      minBalance: 500,
      targetReturn: 0.05 // 5% target
    });

    this.strategies.set('yield-farming', {
      name: 'Yield Optimization',
      description: 'Maximizes returns through liquidity provision',
      riskLevel: 'high',
      minBalance: 1000,
      targetReturn: 0.30 // 30% target
    });

    this.strategies.set('grid-trading', {
      name: 'Grid Trading',
      description: 'Places multiple orders at different price levels',
      riskLevel: 'low',
      minBalance: 200,
      targetReturn: 0.10 // 10% target
    });
  }

  async initialize(): Promise<void> {
    try {
      // Connect to required MCP services
      for (const service of this.config.mcpServices) {
        await this.mcpAdapter.connectToMCP(service);
      }

      // Verify wallet connection
      if (this.wallet) {
        const balance = await this.wallet.getBalance();
        logger.info(`DeFi Trading Agent initialized for ${this.userId}`, {
          address: this.wallet.address,
          balance: ethers.utils.formatEther(balance)
        });
      }

      this.isActive = true;
    } catch (error) {
      logger.error('Failed to initialize DeFi Trading Agent', error);
      throw error;
    }
  }

  async analyzeMarket(tokenAddress: string): Promise<MarketSignal> {
    try {
      // Use MCP tools to analyze market conditions
      const priceData = await this.mcpAdapter.callTool('get_token_price', {
        tokenAddress,
        network: 'base'
      });

      const volumeData = await this.mcpAdapter.callTool('get_trading_volume', {
        tokenAddress,
        period: '24h'
      });

      const technicalIndicators = await this.calculateTechnicalIndicators(tokenAddress);
      const sentiment = await this.analyzeSentiment(tokenAddress);

      // Generate trading signal based on multiple factors
      const signal = this.generateTradingSignal({
        price: priceData.price,
        volume: volumeData.volume,
        indicators: technicalIndicators,
        sentiment
      });

      return signal;
    } catch (error) {
      logger.error('Market analysis failed', error);
      throw error;
    }
  }

  private async calculateTechnicalIndicators(tokenAddress: string): Promise<any> {
    // Implement technical analysis using MCP tools
    const historicalData = await this.mcpAdapter.callTool('get_price_history', {
      tokenAddress,
      period: '7d',
      interval: '1h'
    });

    // Calculate indicators
    const rsi = this.calculateRSI(historicalData);
    const macd = this.calculateMACD(historicalData);
    const movingAverages = this.calculateMovingAverages(historicalData);

    return {
      rsi,
      macd,
      movingAverages,
      trend: this.determineTrend(movingAverages)
    };
  }

  private async analyzeSentiment(tokenAddress: string): Promise<number> {
    try {
      // Use MCP to analyze social sentiment
      const sentimentData = await this.mcpAdapter.callTool('analyze_sentiment', {
        token: tokenAddress,
        sources: ['twitter', 'reddit', 'telegram']
      });

      return sentimentData.score; // -1 to 1 scale
    } catch {
      return 0; // Neutral if analysis fails
    }
  }

  private generateTradingSignal(data: any): MarketSignal {
    let signalStrength = 0;
    
    // Technical indicators weight: 40%
    if (data.indicators.rsi < 30) signalStrength += 0.4; // Oversold
    if (data.indicators.rsi > 70) signalStrength -= 0.4; // Overbought
    
    // Trend weight: 30%
    if (data.indicators.trend === 'bullish') signalStrength += 0.3;
    if (data.indicators.trend === 'bearish') signalStrength -= 0.3;
    
    // Volume weight: 20%
    if (data.volume > data.avgVolume * 1.5) signalStrength += 0.2;
    
    // Sentiment weight: 10%
    signalStrength += data.sentiment * 0.1;

    const type = signalStrength > 0.3 ? 'buy' : 
                 signalStrength < -0.3 ? 'sell' : 'hold';

    return {
      type,
      confidence: Math.abs(signalStrength),
      asset: data.tokenAddress,
      price: data.price,
      volume: data.volume,
      timestamp: new Date()
    };
  }

  async executeTrade(
    strategy: string,
    tokenAddress: string,
    amount: number,
    action: 'buy' | 'sell'
  ): Promise<any> {
    if (!this.wallet) {
      throw new Error('Wallet not configured for trading');
    }

    const selectedStrategy = this.strategies.get(strategy);
    if (!selectedStrategy) {
      throw new Error(`Unknown strategy: ${strategy}`);
    }

    try {
      // Check risk limits
      await this.validateRiskLimits(amount, selectedStrategy);

      // Get best execution path
      const executionPath = await this.findBestExecutionPath(
        tokenAddress,
        amount,
        action
      );

      // Execute via MCP tools
      const result = await this.mcpAdapter.callTool('execute_swap', {
        fromToken: action === 'buy' ? 'USDC' : tokenAddress,
        toToken: action === 'buy' ? tokenAddress : 'USDC',
        amount,
        slippage: 0.5,
        recipient: this.wallet.address,
        dex: executionPath.dex
      });

      // Update position tracking
      if (action === 'buy') {
        this.positions.set(tokenAddress, {
          asset: tokenAddress,
          amount: result.amountOut,
          entryPrice: result.price,
          currentPrice: result.price,
          pnl: 0,
          openedAt: new Date()
        });
      } else {
        this.positions.delete(tokenAddress);
      }

      logger.info('Trade executed successfully', {
        strategy,
        action,
        token: tokenAddress,
        amount,
        result
      });

      return result;
    } catch (error) {
      logger.error('Trade execution failed', error);
      throw error;
    }
  }

  private async validateRiskLimits(amount: number, strategy: TradingStrategy): Promise<void> {
    const balance = await this.wallet!.getBalance();
    const balanceInUSDC = parseFloat(ethers.utils.formatEther(balance));

    if (amount < strategy.minBalance) {
      throw new Error(`Minimum balance for ${strategy.name} is ${strategy.minBalance}`);
    }

    if (this.config.riskLimit) {
      const totalExposure = Array.from(this.positions.values())
        .reduce((sum, pos) => sum + (pos.amount * pos.currentPrice), 0);
      
      if (totalExposure + amount > balanceInUSDC * this.config.riskLimit) {
        throw new Error('Risk limit exceeded');
      }
    }

    if (this.config.maxPositions && this.positions.size >= this.config.maxPositions) {
      throw new Error('Maximum positions limit reached');
    }
  }

  private async findBestExecutionPath(
    tokenAddress: string,
    amount: number,
    action: 'buy' | 'sell'
  ): Promise<any> {
    // Check multiple DEXs for best price
    const dexes = ['uniswap', 'sushiswap', 'aerodrome'];
    const quotes = await Promise.all(
      dexes.map(async (dex) => {
        try {
          const quote = await this.mcpAdapter.callTool('get_swap_quote', {
            fromToken: action === 'buy' ? 'USDC' : tokenAddress,
            toToken: action === 'buy' ? tokenAddress : 'USDC',
            amount,
            dex
          });
          return { dex, ...quote };
        } catch {
          return null;
        }
      })
    );

    // Find best quote
    const validQuotes = quotes.filter(q => q !== null);
    const bestQuote = validQuotes.reduce((best, current) => 
      current.outputAmount > best.outputAmount ? current : best
    );

    return bestQuote;
  }

  async monitorPositions(): Promise<void> {
    if (!this.isActive) return;

    for (const [tokenAddress, position] of this.positions) {
      try {
        // Update current price
        const priceData = await this.mcpAdapter.callTool('get_token_price', {
          tokenAddress,
          network: 'base'
        });

        position.currentPrice = priceData.price;
        position.pnl = (position.currentPrice - position.entryPrice) * position.amount;

        // Check for stop loss or take profit
        const pnlPercent = position.pnl / (position.entryPrice * position.amount);
        
        if (pnlPercent < -0.05) { // 5% stop loss
          await this.executeTrade('momentum', tokenAddress, position.amount, 'sell');
          logger.info('Stop loss triggered', { tokenAddress, pnl: position.pnl });
        } else if (pnlPercent > 0.15) { // 15% take profit
          await this.executeTrade('momentum', tokenAddress, position.amount, 'sell');
          logger.info('Take profit triggered', { tokenAddress, pnl: position.pnl });
        }
      } catch (error) {
        logger.error(`Failed to monitor position ${tokenAddress}`, error);
      }
    }
  }

  async getPortfolioStatus(): Promise<any> {
    const positions = Array.from(this.positions.values());
    const totalValue = positions.reduce((sum, pos) => 
      sum + (pos.amount * pos.currentPrice), 0
    );
    const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);

    return {
      userId: this.userId,
      walletAddress: this.wallet?.address,
      positions: positions.map(p => ({
        ...p,
        pnlPercent: (p.pnl / (p.entryPrice * p.amount) * 100).toFixed(2) + '%'
      })),
      totalValue,
      totalPnL,
      activeStrategies: Array.from(this.strategies.keys()),
      isActive: this.isActive
    };
  }

  private calculateRSI(data: any[]): number {
    // Simplified RSI calculation
    const periods = 14;
    if (data.length < periods) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i < periods; i++) {
      const change = data[i].price - data[i - 1].price;
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    const avgGain = gains / periods;
    const avgLoss = losses / periods;
    const rs = avgGain / avgLoss;
    
    return 100 - (100 / (1 + rs));
  }

  private calculateMACD(data: any[]): any {
    // Simplified MACD calculation
    const ema12 = this.calculateEMA(data.map(d => d.price), 12);
    const ema26 = this.calculateEMA(data.map(d => d.price), 26);
    const macdLine = ema12 - ema26;
    const signal = this.calculateEMA([macdLine], 9);
    
    return {
      macd: macdLine,
      signal,
      histogram: macdLine - signal
    };
  }

  private calculateEMA(data: number[], period: number): number {
    if (data.length === 0) return 0;
    const multiplier = 2 / (period + 1);
    let ema = data[0];
    
    for (let i = 1; i < data.length; i++) {
      ema = (data[i] - ema) * multiplier + ema;
    }
    
    return ema;
  }

  private calculateMovingAverages(data: any[]): any {
    const prices = data.map(d => d.price);
    return {
      sma20: this.calculateSMA(prices, 20),
      sma50: this.calculateSMA(prices, 50),
      sma200: this.calculateSMA(prices, 200)
    };
  }

  private calculateSMA(data: number[], period: number): number {
    if (data.length < period) return 0;
    const slice = data.slice(-period);
    return slice.reduce((sum, val) => sum + val, 0) / period;
  }

  private determineTrend(movingAverages: any): string {
    if (movingAverages.sma20 > movingAverages.sma50 && 
        movingAverages.sma50 > movingAverages.sma200) {
      return 'bullish';
    } else if (movingAverages.sma20 < movingAverages.sma50 && 
               movingAverages.sma50 < movingAverages.sma200) {
      return 'bearish';
    }
    return 'neutral';
  }

  async stop(): Promise<void> {
    this.isActive = false;
    
    // Close all positions
    for (const [tokenAddress, position] of this.positions) {
      try {
        await this.executeTrade('momentum', tokenAddress, position.amount, 'sell');
      } catch (error) {
        logger.error(`Failed to close position ${tokenAddress}`, error);
      }
    }

    await this.mcpAdapter.disconnectAll();
    logger.info(`DeFi Trading Agent stopped for ${this.userId}`);
  }
}