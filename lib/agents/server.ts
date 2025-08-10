import * as dotenv from 'dotenv';
import winston from 'winston';
import { EventEmitter } from 'events';
import { MasterAgent } from './master-agent';
import { UtilityAgent } from './utility-agent';
import { TokenTrackerAgent } from './token-tracker-agent';
import { SwapAgent } from './swap-agent';
import { SentimentAgent } from './sentiment-agent';
import { PortfolioAgent } from './portfolio-agent';
import { DeFiAnalyticsAgent } from './defi-analytics-agent';
import { DataDrivenAgent } from './data-driven-agent';
import { TradingAgent } from './trading-agent';
import { XMTPClientManager } from '../xmtp/client';
import {
  MasterAgentConfig,
  UtilityAgentConfig,
  AgentContext,
  SystemHealth,
  AgentHealth,
} from '../types';

// Load environment variables
dotenv.config();

/**
 * Kill-FOMO Server - Orchestrates the multi-agent system
 */
export class BaseAgentsServer extends EventEmitter {
  private logger: winston.Logger;
  private xmtpClient: XMTPClientManager;
  private masterAgent?: MasterAgent;
  private agents: Map<string, any> = new Map();
  private isRunning = false;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.logger = this.createLogger();
    this.xmtpClient = new XMTPClientManager();
    this.setupEventListeners();
  }

  /**
   * Initialize and start the agent server
   */
  async start(): Promise<void> {
    try {
      this.logger.info('🚀 Starting Kill-FOMO Server...');

      // Validate environment variables
      this.validateEnvironment();

      // Initialize XMTP client (optional - continue if it fails)
      try {
        await this.xmtpClient.initialize();
        // Start XMTP message stream only if client initialized
        this.startMessageStream();
      } catch (xmtpError) {
        this.logger.warn('⚠️ XMTP client failed to initialize, continuing without messaging', { xmtpError });
        // Continue without XMTP - agents will still work via API
      }

      // Initialize all agents (this will work even without XMTP)
      await this.initializeAgents();

      // Start health monitoring
      this.startHealthMonitoring();

      this.isRunning = true;
      this.logger.info('✅ Kill-FOMO Server started successfully');
      this.emit('started');

    } catch (error) {
      this.logger.error('❌ Failed to start Kill-FOMO Server', { error });
      throw error;
    }
  }

  /**
   * Stop the agent server
   */
  async stop(): Promise<void> {
    try {
      this.logger.info('🛑 Stopping Kill-FOMO Server...');

      this.isRunning = false;

      // Stop health monitoring
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }

      // Cleanup agents
      for (const agent of this.agents.values()) {
        await agent.cleanup();
      }

      // Cleanup XMTP client
      await this.xmtpClient.cleanup();

      this.logger.info('✅ Kill-FOMO Server stopped successfully');
      this.emit('stopped');

    } catch (error) {
      this.logger.error('❌ Error stopping Kill-FOMO Server', { error });
      throw error;
    }
  }

  /**
   * Validate required environment variables
   */
  private validateEnvironment(): void {
    const required = [
      'OPENAI_API_KEY',
      'WALLET_PRIVATE_KEY',
      'ENCRYPTION_KEY',
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    this.logger.info('✅ Environment validation passed');
  }

  /**
   * Initialize all agents and register with master agent
   */
  private async initializeAgents(): Promise<void> {
    this.logger.info('🤖 Initializing agents...');
    console.log('[BaseAgentsServer] Initializing agents...');

    try {
      // Initialize Master Agent
      console.log('[BaseAgentsServer] Initializing MasterAgent...');
      const masterConfig: MasterAgentConfig = {
        name: 'MasterAgent',
        description: 'Central orchestrator for the Kill-FOMO multi-agent system',
        capabilities: ['routing', 'delegation', 'system_management', 'agent_coordination'],
        version: '1.0.0',
        isActive: true,
        priority: 100,
        routingRules: [
          { pattern: /swap|exchange/i, targetAgent: 'swap', priority: 96 },
          { pattern: /analyze|data|portfolio|balance|wallet|history/i, targetAgent: 'data-driven', priority: 95 },
          { pattern: /trade|buy|sell|defi|token|price/i, targetAgent: 'trading', priority: 94 },
          { pattern: /track|trending|tokens/i, targetAgent: 'token-tracker', priority: 90 },
          { pattern: /portfolio|positions|holdings/i, targetAgent: 'portfolio', priority: 88 },
          { pattern: /analytics|market|yield/i, targetAgent: 'defi-analytics', priority: 87 },
          { pattern: /sentiment|news|social/i, targetAgent: 'sentiment', priority: 85 },
          { pattern: /event|plan|payment|split/i, targetAgent: 'utility', priority: 80 },
        ],
        fallbackAgent: 'UtilityAgent',
        maxConversations: 1000,
      };
      this.masterAgent = new MasterAgent(masterConfig);
      await this.masterAgent.initialize();
      this.agents.set('MasterAgent', this.masterAgent);
      console.log('[BaseAgentsServer] MasterAgent initialized and registered.');

      // Initialize Utility Agent
      console.log('[BaseAgentsServer] Initializing UtilityAgent...');
      const utilityConfig: UtilityAgentConfig = {
        name: 'UtilityAgent',
        description: 'Handles event planning, payment splitting, and group coordination',
        capabilities: ['event_planning', 'payment_splitting', 'expense_tracking', 'shared_wallets'],
        version: '1.0.0',
        isActive: true,
        priority: 85,
        supportedTasks: [
          { type: 'event_planning', description: 'Organize events with participants', requiredParams: ['title', 'date'] },
          { type: 'payment_split', description: 'Split payments among group members', requiredParams: ['amount', 'participants'] },
          { type: 'shared_wallet', description: 'Manage shared group wallets', requiredParams: ['participants'] },
          { type: 'expense_tracking', description: 'Track group expenses', requiredParams: ['description', 'amount'] },
        ],
        maxParticipants: 50,
        defaultCurrency: 'USDC',
      };
      const utilityAgent = new UtilityAgent(utilityConfig);
      await utilityAgent.initialize();
      await this.masterAgent.registerAgent(utilityAgent);
      this.agents.set('UtilityAgent', utilityAgent);
      console.log('[BaseAgentsServer] UtilityAgent initialized and registered.');

      // Initialize Data-Driven Agent (Code NYC - Data-Driven Agents Track)
      console.log('[BaseAgentsServer] Initializing DataDrivenAgent...');
      const dataDrivenAgent = new DataDrivenAgent({
        name: 'data-driven',
        description: 'CDP Data API powered blockchain analysis agent',
        config: {},
      });
      await dataDrivenAgent.initialize();
      await this.masterAgent.registerAgent(dataDrivenAgent);
      this.agents.set('data-driven', dataDrivenAgent);
      console.log('[BaseAgentsServer] DataDrivenAgent initialized and registered.');

      // Initialize Trading Agent (Code NYC - Enhanced trading capabilities)
      console.log('[BaseAgentsServer] Initializing TradingAgent...');
      const tradingAgent = new TradingAgent({
        name: 'trading',
        description: 'DeFi and trading operations agent with AgentKit',
        config: {},
      });
      await tradingAgent.initialize();
      await this.masterAgent.registerAgent(tradingAgent);
      this.agents.set('trading', tradingAgent);
      console.log('[BaseAgentsServer] TradingAgent initialized and registered.');

      // Initialize Token Tracker Agent
      console.log('[BaseAgentsServer] Initializing TokenTrackerAgent...');
      const tokenTrackerAgent = new TokenTrackerAgent();
      await tokenTrackerAgent.initialize();
      await this.masterAgent.registerAgent(tokenTrackerAgent);
      this.agents.set('token-tracker', tokenTrackerAgent);
      console.log('[BaseAgentsServer] TokenTrackerAgent initialized and registered.');

      // Initialize Swap Agent  
      console.log('[BaseAgentsServer] Initializing SwapAgent...');
      const swapAgent = new SwapAgent();
      await swapAgent.initialize();
      await this.masterAgent.registerAgent(swapAgent);
      this.agents.set('swap', swapAgent);
      console.log('[BaseAgentsServer] SwapAgent initialized and registered.');

      // Initialize Portfolio Agent
      console.log('[BaseAgentsServer] Initializing PortfolioAgent...');
      const portfolioAgent = new PortfolioAgent();
      await portfolioAgent.initialize();
      await this.masterAgent.registerAgent(portfolioAgent);
      this.agents.set('portfolio', portfolioAgent);
      console.log('[BaseAgentsServer] PortfolioAgent initialized and registered.');

      // Initialize DeFi Analytics Agent
      console.log('[BaseAgentsServer] Initializing DeFiAnalyticsAgent...');
      const defiAnalyticsAgent = new DeFiAnalyticsAgent();
      await defiAnalyticsAgent.initialize();
      await this.masterAgent.registerAgent(defiAnalyticsAgent);
      this.agents.set('defi-analytics', defiAnalyticsAgent);
      console.log('[BaseAgentsServer] DeFiAnalyticsAgent initialized and registered.');

      // Initialize Sentiment Agent
      console.log('[BaseAgentsServer] Initializing SentimentAgent...');
      const sentimentConfig: any = {
        name: 'sentiment',
        description: 'Analyzes social sentiment and market mood',
        capabilities: ['sentiment_analysis', 'news_aggregation', 'trend_detection'],
        version: '1.0.0',
        isActive: true,
        priority: 85,
        contentSources: [],
        moderationLevel: 'moderate',
        personalizedContent: true,
      };
      const sentimentAgent = new SentimentAgent(sentimentConfig);
      await sentimentAgent.initialize();
      await this.masterAgent.registerAgent(sentimentAgent);
      this.agents.set('sentiment', sentimentAgent);
      console.log('[BaseAgentsServer] SentimentAgent initialized and registered.');

      // GameAgent and MiniAppAgent are stub implementations
      // Focus is on DeFi agents

      console.log(`[BaseAgentsServer] All agents initialized. Total: ${this.agents.size}`);
      this.logger.info(`✅ Initialized ${this.agents.size} agents successfully`);

    } catch (error) {
      this.logger.error('❌ Failed to initialize agents', { error });
      console.error('[BaseAgentsServer] Failed to initialize agents:', error);
      throw error;
    }
  }

  /**
   * Start listening for XMTP messages
   */
  private startMessageStream(): void {
    this.logger.info('📡 Starting XMTP message stream...');
    
    // Start the message stream in the background
    this.xmtpClient.startMessageStream().catch(error => {
      this.logger.error('Message stream error', { error });
      this.emit('error', error);
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // XMTP Client Events
    this.xmtpClient.on('connected', (data) => {
      this.logger.info('XMTP client connected', data);
    });

    this.xmtpClient.on('messageReceived', async (message) => {
      await this.handleIncomingMessage(message);
    });

    this.xmtpClient.on('error', (error) => {
      this.logger.error('XMTP client error', { error });
      this.emit('error', error);
    });

    // Agent Events
    this.on('agentActivity', (data) => {
      this.logger.debug('Agent activity', data);
    });

    this.on('agentError', (data) => {
      this.logger.error('Agent error', data);
    });

    // Process termination handlers
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception', { error });
      this.gracefulShutdown();
    });
  }

  /**
   * Handle incoming XMTP messages
   */
  private async handleIncomingMessage(message: any): Promise<void> {
    try {
      if (!this.masterAgent) {
        this.logger.error('Master agent not initialized');
        return;
      }

      this.logger.info('Processing incoming message', {
        messageId: message.id,
        senderInboxId: message.senderInboxId,
        conversationId: message.conversationId,
        contentLength: message.content.length,
      });

      // Create agent context
      const context: AgentContext = {
        userId: message.senderInboxId,
        conversationId: message.conversationId,
        messageHistory: [message], // In production, would fetch conversation history
        userPreferences: undefined, // Would fetch from database
        agentMemory: {},
      };

      // Process message with master agent
      const response = await this.masterAgent.processMessage(message, context);

      // Send response back via XMTP
      if (response.message) {
        await this.xmtpClient.sendMessage(message.conversationId, response.message);
      }

      // Handle any required actions
      if (response.actions) {
        await this.handleAgentActions(response.actions, context);
      }

      this.logger.info('Message processed successfully', {
        messageId: message.id,
        responseLength: response.message.length,
        handledBy: response.metadata?.handledBy,
      });

    } catch (error) {
      this.logger.error('Error processing message', { error, messageId: message.id });
      
      // Send error response to user
      try {
        await this.xmtpClient.sendMessage(
          message.conversationId,
          '❌ Sorry, I encountered an error processing your message. Please try again.'
        );
      } catch (sendError) {
        this.logger.error('Failed to send error message', { sendError });
      }
    }
  }

  /**
   * Handle agent actions (transactions, notifications, etc.)
   */
  private async handleAgentActions(actions: any[], context: AgentContext): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'transaction':
            await this.handleTransactionAction(action, context);
            break;
          case 'notification':
            await this.handleNotificationAction(action, context);
            break;
          case 'miniapp':
            await this.handleMiniappAction(action, context);
            break;
          default:
            this.logger.warn('Unknown action type', { actionType: action.type });
        }
      } catch (error) {
        this.logger.error('Error handling agent action', { error, action });
      }
    }
  }

  private async handleTransactionAction(action: any, context: AgentContext): Promise<void> {
    this.logger.info('Handling transaction action', { action, userId: context.userId });
    // Implementation would handle blockchain transactions
  }

  private async handleNotificationAction(action: any, context: AgentContext): Promise<void> {
    this.logger.info('Handling notification action', { action, userId: context.userId });
    // Implementation would send notifications
  }

  private async handleMiniappAction(action: any, context: AgentContext): Promise<void> {
    this.logger.info('Handling miniapp action', { action, userId: context.userId });
    // Implementation would launch mini-apps
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Perform system health check
   */
  private performHealthCheck(): void {
    try {
      const health = this.getSystemHealth();
      
      if (health.status !== 'healthy') {
        this.logger.warn('System health degraded', { health });
        this.emit('healthDegraded', health);
      }

      this.emit('healthCheck', health);
    } catch (error) {
      this.logger.error('Health check failed', { error });
    }
  }

  /**
   * Get system health status
   */
  public getSystemHealth(): SystemHealth {
    const agentHealth: Record<string, AgentHealth> = {};
    
    for (const [name, agent] of this.agents) {
      const health = agent.getHealth();
      agentHealth[name] = {
        isActive: health.isActive,
        responseTime: 0, // Would track actual response times
        errorRate: 0, // Would track error rates
        conversationCount: health.conversationCount,
        lastActivity: health.lastActivity,
      };
    }

    const xmtpStatus = this.xmtpClient.getStatus();
    // Consider the system healthy if running, even without XMTP (agents work via API)
    const overallStatus = this.isRunning ? 'healthy' : 'down';

    return {
      status: overallStatus,
      agents: agentHealth,
      xmtpConnection: xmtpStatus.isConnected,
      blockchainConnection: true, // Would check actual blockchain connection
      lastCheck: new Date(),
    };
  }

  /**
   * Graceful shutdown handler
   */
  private async gracefulShutdown(): Promise<void> {
    this.logger.info('Initiating graceful shutdown...');
    
    try {
      await this.stop();
      process.exit(0);
    } catch (error) {
      this.logger.error('Error during shutdown', { error });
      process.exit(1);
    }
  }

  /**
   * Create logger instance
   */
  private createLogger(): winston.Logger {
    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'base-agents-server' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
        new winston.transports.File({
          filename: 'logs/server-error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/server.log',
        }),
      ],
    });
  }

  /**
   * Get an agent by type/name
   */
  public getAgent(agentType: string): any {
    return this.agents.get(agentType);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new BaseAgentsServer();
  
  server.start().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default BaseAgentsServer; 