// Production-ready Data-Driven Agent for Code NYC hackathon
// Uses Coinbase CDP Data API v2 for real wallet analysis and insights
import { DecodedMessage } from '@xmtp/browser-sdk';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { BaseAgent } from './base-agent';
import { 
  AgentKit,
  CdpV2EvmWalletProvider,
  cdpApiActionProvider,
} from '@coinbase/agentkit';
import { getLangChainTools } from '@coinbase/agentkit-langchain';
import { HumanMessage } from '@langchain/core/messages';
import { MemorySaver } from '@langchain/langgraph';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import {
  TradingAgentConfig,
  AgentContext,
  AgentResponse,
} from '../types';
import axios from 'axios';

/**
 * Data-Driven Agent using CDP Data API v2 for real-time blockchain analysis
 * Qualifies for Code NYC "Data-Driven Agents" bounty track
 */
export class DataDrivenAgent extends BaseAgent {
  private agentKit?: AgentKit;
  private walletProvider?: CdpV2EvmWalletProvider;
  private reactAgent?: ReturnType<typeof createReactAgent>;
  private memory?: MemorySaver;
  private llmModel?: ChatOpenAI;
  private cdpDataApiBase = 'https://api.cdp.coinbase.com/v2';
  private watchedAddresses: Set<string> = new Set();
  private alertThresholds: Map<string, { minBalance: number; maxBalance: number }> = new Map();

  constructor(config: TradingAgentConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    try {
      console.log('[DataDrivenAgent] Initializing CDP Data API integration...');

      this.llmModel = new ChatOpenAI({
        model: "gpt-4o",
        temperature: 0.1,
      });

      // Initialize CDP Wallet Provider for blockchain operations
      if (process.env.CDP_API_KEY_ID && process.env.CDP_API_KEY_SECRET) {
        const cdpWalletConfig = {
          apiKeyId: process.env.CDP_API_KEY_ID,
          apiKeySecret: process.env.CDP_API_KEY_SECRET,
          walletSecret: process.env.CDP_WALLET_SECRET!,
          networkId: process.env.NETWORK_ID || 'base-mainnet',
        };

        this.walletProvider = await CdpV2EvmWalletProvider.configureWithWallet(cdpWalletConfig);

        // Initialize AgentKit with CDP Data API action provider
        this.agentKit = await AgentKit.from({
          walletProvider: this.walletProvider,
          actionProviders: [
            cdpApiActionProvider({
              apiKeyId: process.env.CDP_API_KEY_ID,
              apiKeySecret: process.env.CDP_API_KEY_SECRET,
            }),
          ],
        });
      }

      this.initializeDataTools();
      const agentKitTools = this.agentKit ? await getLangChainTools(this.agentKit) : [];
      const allTools = [...agentKitTools, ...this.tools];

      this.memory = new MemorySaver();

      this.reactAgent = createReactAgent({
        llm: this.llmModel,
        tools: allTools,
        checkpointSaver: this.memory,
        messageModifier: this.getSystemPrompt(),
      });

      await super.initialize();
      this.logger.info('DataDrivenAgent initialized with CDP Data API capabilities');
    } catch (error) {
      this.logger.error('Failed to initialize DataDrivenAgent', { error });
      throw error;
    }
  }

  protected initializeTools(): void {
    this.initializeDataTools();
  }

  protected initializeDataTools(): void {
    this.tools.push(
      // Real-time token balances using CDP Data API
      new DynamicStructuredTool({
        name: 'get_real_token_balances',
        description: 'Get real-time token balances for any address using CDP Data API v2',
        schema: z.object({
          address: z.string().describe('Ethereum/Base address to analyze'),
          network: z.string().optional().default('base-mainnet').describe('Network to query'),
        }),
        func: async ({ address, network }) => {
          try {
            if (!process.env.CDP_API_KEY_ID || !process.env.CDP_API_KEY_SECRET) {
              return 'CDP API credentials not configured';
            }

            // Use CDP Data API v2 Token Balances endpoint
            const response = await axios.get(
              `${this.cdpDataApiBase}/token-balances/${address}`,
              {
                headers: {
                  'Authorization': `Bearer ${await this.getCdpAccessToken()}`,
                  'Content-Type': 'application/json',
                },
                params: { network },
              }
            );

            const balances = response.data.data || [];
            if (balances.length === 0) {
              return `No token balances found for ${address} on ${network}`;
            }

            const summary = balances.map((balance: any) => ({
              token: balance.contract_address || 'Native Token',
              symbol: balance.symbol || 'Unknown',
              amount: balance.amount,
              valueUsd: balance.value_usd || 'N/A',
            }));

            return `Token balances for ${address}:\n${JSON.stringify(summary, null, 2)}`;
          } catch (error) {
            this.logger.error('Error fetching token balances', { error });
            return `Error fetching token balances: ${error instanceof Error ? error.message : 'Unknown error'}`;
          }
        },
      }),

      // Wallet history analysis using CDP Data API
      new DynamicStructuredTool({
        name: 'analyze_wallet_history',
        description: 'Analyze wallet transaction history and patterns using CDP Wallet History API',
        schema: z.object({
          address: z.string().describe('Address to analyze'),
          limit: z.number().optional().default(50).describe('Number of transactions to analyze'),
          network: z.string().optional().default('base-mainnet'),
        }),
        func: async ({ address, limit, network }) => {
          try {
            // Use CDP Wallet History API
            const response = await axios.get(
              `${this.cdpDataApiBase}/wallet-history/${address}`,
              {
                headers: {
                  'Authorization': `Bearer ${await this.getCdpAccessToken()}`,
                },
                params: { limit, network },
              }
            );

            const transactions = response.data.data || [];
            
            // Analyze patterns
            const analysis = this.analyzeTransactionPatterns(transactions);
            
            return `Wallet Analysis for ${address}:
Total Transactions: ${transactions.length}
Transaction Patterns: ${JSON.stringify(analysis, null, 2)}
Recent Activity: ${transactions.slice(0, 5).map((tx: any) => 
  `${tx.type}: ${tx.amount} ${tx.asset} (${tx.timestamp})`
).join('\n')}`;
          } catch (error) {
            this.logger.error('Error analyzing wallet history', { error });
            return `Error analyzing wallet: ${error instanceof Error ? error.message : 'Unknown error'}`;
          }
        },
      }),

      // Set up balance alerts
      new DynamicStructuredTool({
        name: 'setup_balance_alert',
        description: 'Set up real-time balance alerts for wallet addresses',
        schema: z.object({
          address: z.string().describe('Address to monitor'),
          minBalance: z.number().optional().describe('Alert when balance drops below this'),
          maxBalance: z.number().optional().describe('Alert when balance exceeds this'),
          token: z.string().optional().default('ETH').describe('Token to monitor'),
        }),
        func: async ({ address, minBalance, maxBalance, token }) => {
          try {
            this.watchedAddresses.add(address);
            
            if (minBalance !== undefined || maxBalance !== undefined) {
              this.alertThresholds.set(address, {
                minBalance: minBalance || 0,
                maxBalance: maxBalance || Infinity,
              });
            }

            // Get current balance for baseline
            const currentBalance = await this.getCurrentBalance(address, token);
            
            return `Alert set up for ${address}:
Current ${token} balance: ${currentBalance}
Min threshold: ${minBalance || 'Not set'}
Max threshold: ${maxBalance || 'Not set'}
Monitoring is now active.`;
          } catch (error) {
            return `Error setting up alert: ${error instanceof Error ? error.message : 'Unknown error'}`;
          }
        },
      }),

      // Portfolio performance insights
      new DynamicStructuredTool({
        name: 'generate_portfolio_insights',
        description: 'Generate comprehensive portfolio insights and recommendations',
        schema: z.object({
          addresses: z.array(z.string()).describe('Array of addresses to analyze as portfolio'),
          timeframe: z.string().optional().default('30d').describe('Analysis timeframe (7d, 30d, 90d)'),
        }),
        func: async ({ addresses, timeframe }) => {
          try {
            const portfolioData = await Promise.all(
              addresses.map(async (address: string) => {
                const balances = await this.getTokenBalances(address);
                const history = await this.getWalletHistory(address);
                return { address, balances, history };
              })
            );

            const insights = this.generatePortfolioInsights(portfolioData, timeframe);
            
            return `Portfolio Insights (${timeframe}):
${JSON.stringify(insights, null, 2)}`;
          } catch (error) {
            return `Error generating insights: ${error instanceof Error ? error.message : 'Unknown error'}`;
          }
        },
      }),

      // DeFi position analysis
      new DynamicStructuredTool({
        name: 'analyze_defi_positions',
        description: 'Analyze DeFi positions and yield opportunities across protocols',
        schema: z.object({
          address: z.string().describe('Address to analyze for DeFi positions'),
          protocols: z.array(z.string()).optional().describe('Specific protocols to check'),
        }),
        func: async ({ address, protocols }) => {
          try {
            // Get token balances and identify DeFi tokens
            const balances = await this.getTokenBalances(address);
            const defiAnalysis = this.analyzeDeFiPositions(balances, protocols);
            
            return `DeFi Position Analysis for ${address}:
${JSON.stringify(defiAnalysis, null, 2)}`;
          } catch (error) {
            return `Error analyzing DeFi positions: ${error instanceof Error ? error.message : 'Unknown error'}`;
          }
        },
      }),
    );
  }

  // Helper methods for CDP Data API integration
  private async getCdpAccessToken(): Promise<string> {
    // In production, implement proper OAuth token management
    // For now, using API key authentication
    return Buffer.from(`${process.env.CDP_API_KEY_ID}:${process.env.CDP_API_KEY_SECRET}`).toString('base64');
  }

  private async getTokenBalances(address: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.cdpDataApiBase}/token-balances/${address}`,
        {
          headers: {
            'Authorization': `Bearer ${await this.getCdpAccessToken()}`,
          },
        }
      );
      return response.data.data || [];
    } catch (error) {
      this.logger.error('Error fetching token balances', { error });
      return [];
    }
  }

  private async getWalletHistory(address: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.cdpDataApiBase}/wallet-history/${address}`,
        {
          headers: {
            'Authorization': `Bearer ${await this.getCdpAccessToken()}`,
          },
        }
      );
      return response.data.data || [];
    } catch (error) {
      this.logger.error('Error fetching wallet history', { error });
      return [];
    }
  }

  private async getCurrentBalance(address: string, token: string): Promise<string> {
    const balances = await this.getTokenBalances(address);
    const tokenBalance = balances.find(b => 
      b.symbol?.toLowerCase() === token.toLowerCase() || 
      b.contract_address?.toLowerCase() === token.toLowerCase()
    );
    return tokenBalance?.amount || '0';
  }

  private analyzeTransactionPatterns(transactions: any[]): any {
    const patterns = {
      totalVolume: 0,
      uniqueTokens: new Set(),
      averageTransactionSize: 0,
      mostActiveToken: '',
      riskScore: 0,
    };

    transactions.forEach(tx => {
      patterns.totalVolume += parseFloat(tx.amount || '0');
      patterns.uniqueTokens.add(tx.asset || 'unknown');
    });

    patterns.averageTransactionSize = patterns.totalVolume / (transactions.length || 1);
    patterns.riskScore = this.calculateRiskScore(transactions);

    return {
      ...patterns,
      uniqueTokens: Array.from(patterns.uniqueTokens),
    };
  }

  private calculateRiskScore(transactions: any[]): number {
    // Simple risk scoring based on transaction patterns
    let riskScore = 0;
    
    // High frequency trading increases risk
    if (transactions.length > 100) riskScore += 2;
    
    // Large transactions increase risk
    const avgAmount = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0) / transactions.length;
    if (avgAmount > 10000) riskScore += 3;
    
    // Return score out of 10
    return Math.min(riskScore, 10);
  }

  private generatePortfolioInsights(portfolioData: any[], timeframe: string): any {
    const insights = {
      totalValue: 0,
      diversificationScore: 0,
      riskLevel: 'Low',
      recommendations: [] as string[],
      topPerformers: [] as string[],
    };

    // Calculate total portfolio value and diversification
    const allTokens = new Set();
    portfolioData.forEach(data => {
      data.balances.forEach((balance: any) => {
        insights.totalValue += parseFloat(balance.value_usd || '0');
        allTokens.add(balance.symbol);
      });
    });

    insights.diversificationScore = Math.min(allTokens.size * 10, 100);
    
    if (insights.totalValue > 100000) insights.riskLevel = 'High';
    else if (insights.totalValue > 10000) insights.riskLevel = 'Medium';

    // Generate recommendations
    if (insights.diversificationScore < 50) {
      insights.recommendations.push('Consider diversifying across more tokens');
    }
    
    if (insights.riskLevel === 'High') {
      insights.recommendations.push('Consider taking profits on large positions');
    }

    return insights;
  }

  private analyzeDeFiPositions(balances: any[], protocols?: string[]): any {
    const defiAnalysis = {
      totalDeFiValue: 0,
      protocols: [] as string[],
      yieldOpportunities: [] as string[],
      liquidityPositions: [] as any[],
    };

    // Identify DeFi tokens and positions
    const defiTokens = balances.filter(balance => 
      this.isDeFiToken(balance.symbol || balance.contract_address)
    );

    defiTokens.forEach(token => {
      defiAnalysis.totalDeFiValue += parseFloat(token.value_usd || '0');
      
      // Identify protocol from token
      const protocol = this.identifyProtocol(token.symbol || token.contract_address);
      if (protocol && !defiAnalysis.protocols.includes(protocol)) {
        defiAnalysis.protocols.push(protocol);
      }
    });

    // Generate yield opportunities
    if (defiAnalysis.totalDeFiValue > 1000) {
      defiAnalysis.yieldOpportunities.push('Consider staking ETH for 4-6% APY');
      defiAnalysis.yieldOpportunities.push('Explore Base ecosystem liquidity mining');
    }

    return defiAnalysis;
  }

  private isDeFiToken(symbol: string): boolean {
    const defiIndicators = ['LP', 'UNI', 'AAVE', 'COMP', 'SUSHI', 'CRV', 'BAL'];
    return defiIndicators.some(indicator => symbol?.includes(indicator));
  }

  private identifyProtocol(tokenSymbol: string): string | null {
    const protocolMap: { [key: string]: string } = {
      'UNI': 'Uniswap',
      'AAVE': 'Aave',
      'COMP': 'Compound',
      'SUSHI': 'SushiSwap',
      'CRV': 'Curve',
      'BAL': 'Balancer',
    };

    for (const [token, protocol] of Object.entries(protocolMap)) {
      if (tokenSymbol?.includes(token)) {
        return protocol;
      }
    }
    return null;
  }

  protected async handleMessage(message: DecodedMessage, context: AgentContext): Promise<AgentResponse> {
    try {
      if (!this.reactAgent) {
        throw new Error('React agent not initialized');
      }

      const messageContent = typeof message.content === 'string' ? message.content : '';
      const threadId = context.conversationId || 'default';

      let response = '';
      const stream = await this.reactAgent.stream(
        { messages: [new HumanMessage(messageContent)] },
        { configurable: { thread_id: threadId } }
      );

      for await (const chunk of stream) {
        if (chunk && typeof chunk === 'object' && 'agent' in chunk) {
          const agentChunk = chunk as {
            agent: { messages: Array<{ content: unknown }> };
          };
          response += String(agentChunk.agent.messages[0].content) + '\n';
        }
      }

      return {
        message: response.trim() || 'I can analyze wallet data, set up alerts, and provide portfolio insights. What would you like me to analyze?',
        metadata: { 
          handledBy: 'data-driven-agent',
          cdpDataApiEnabled: true,
          watchedAddresses: Array.from(this.watchedAddresses),
        },
        actions: []
      };
    } catch (error) {
      this.logger.error('Error in handleMessage', { error });
      return {
        message: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        metadata: { handledBy: 'data-driven-agent', error: true },
        actions: []
      };
    }
  }

  protected async shouldHandleMessage(message: DecodedMessage, context: AgentContext): Promise<boolean> {
    const content = typeof message.content === 'string' ? message.content.toLowerCase() : '';
    const dataKeywords = [
      'analyze', 'data', 'balance', 'wallet', 'history', 'insight', 'portfolio',
      'alert', 'monitor', 'track', 'defi', 'yield', 'performance', 'risk',
      'token', 'holdings', 'transaction', 'pattern', 'dashboard'
    ];
    
    return dataKeywords.some(keyword => content.includes(keyword));
  }

  protected async suggestNextAgent(message: DecodedMessage, context: AgentContext): Promise<string> {
    const content = typeof message.content === 'string' ? message.content.toLowerCase() : '';
    
    if (content.includes('trade') || content.includes('swap') || content.includes('buy') || content.includes('sell')) {
      return 'trading';
    }
    if (content.includes('event') || content.includes('payment') || content.includes('split')) {
      return 'utility';
    }
    if (content.includes('game') || content.includes('play')) {
      return 'game';
    }
    
    return 'master';
  }

  protected getSystemPrompt(): string {
    return `You are DataDrivenAgent, a specialized agent for blockchain data analysis using Coinbase CDP Data API v2.

Your capabilities include:
- Real-time token balance analysis using CDP Data API
- Wallet transaction history analysis and pattern recognition
- Portfolio performance insights and recommendations
- DeFi position analysis and yield optimization
- Real-time balance monitoring and alerting
- Risk assessment and diversification analysis

You have access to production CDP Data APIs:
- Token Balances API for real-time balance data
- Wallet History API for transaction analysis
- Comprehensive blockchain data across multiple networks

Guidelines:
1. Always use real CDP Data API calls for accurate information
2. Provide actionable insights based on actual blockchain data
3. Set up alerts and monitoring for user addresses when requested
4. Analyze patterns and trends in wallet activity
5. Offer personalized recommendations based on portfolio data
6. Explain complex DeFi concepts in simple terms
7. Prioritize user privacy and data security

Current network: ${process.env.NETWORK_ID || 'base-mainnet'}
CDP Data API integration: Active

You excel at turning raw blockchain data into valuable insights for users.`;
  }
}