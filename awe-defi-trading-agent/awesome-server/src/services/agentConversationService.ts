import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages.js';
import { ChatPromptTemplate } from '@langchain/core/prompts.js';
import { BufferMemory } from 'langchain/memory.js';
import { logger } from '../utils/logger.js';
import { messageDao } from '../dao/messageDao.js';
import { conversationDao } from '../dao/conversationDao.js';
import { agentDao } from '../dao/agentDao.js';
import { getTaskService } from './taskService.js';
import { TaskExecutorService } from './taskExecutorService.js';
import { MCPAuthService } from './mcpAuthService.js';
import { 
  Agent, 
  TryAgentRequest, 
  TryAgentResponse,
  MCPAuthCheckResult 
} from '../models/agent.js';
import { 
  Message, 
  MessageType, 
  MessageIntent, 
  MessageStepType,
  Conversation,
  ConversationType
} from '../models/conversation.js';
import { v4 as uuidv4 } from 'uuid';
import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables.js';
import { taskExecutorDao } from '../dao/taskExecutorDao.js';
import { MCPManager } from './mcpManager.js';
import { MCPToolAdapter } from './mcpToolAdapter.js';
import { IntelligentWorkflowEngine } from './intelligentWorkflowEngine.js';
import { IntelligentTaskService } from './intelligentTaskService.js';
import { createAgentIntelligentTaskService, AgentIntelligentTaskService } from './agentIntelligentEngine.js';
import { resolveUserLanguageWithInstruction, SupportedLanguage, getLanguageInstruction } from '../utils/languageDetector.js';


/**
 * Agent Conversation Service - Dedicated service for Agent multi-turn conversations
 * 
 * This service handles all Agent-specific conversation logic independently from
 * traditional task execution conversations, providing:
 * - Agent trial conversation management
 * - Agent-specific intent analysis
 * - Agent task execution with specialized workflow
 * - Agent chat with personality and context
 * - Streaming responses for real-time interaction
 */
export class AgentConversationService {
  private llm: ChatOpenAI;
  private mcpAuthService: MCPAuthService;
  private taskExecutorService: TaskExecutorService;
  private conversationMemories: Map<string, BufferMemory> = new Map();
  
  // 🔧 新增：Agent专用的任务执行组件
  private mcpManager: MCPManager;
  private mcpToolAdapter: MCPToolAdapter;
  private intelligentWorkflowEngine: IntelligentWorkflowEngine;
  private intelligentTaskService: IntelligentTaskService;

  constructor(taskExecutorService: TaskExecutorService) {
    this.llm = new ChatOpenAI({
        modelName: 'gpt-4o',
        temperature: 0.3,
        streaming: true,
        maxTokens: 4096,
        apiKey: process.env.OPENAI_API_KEY
      });
    this.mcpAuthService = new MCPAuthService();
    this.taskExecutorService = taskExecutorService;
    
    // 🔧 初始化Agent专用的任务执行组件
    this.mcpManager = (taskExecutorService as any).mcpManager;
    this.mcpToolAdapter = (taskExecutorService as any).mcpToolAdapter;
    this.intelligentWorkflowEngine = (taskExecutorService as any).intelligentWorkflowEngine;
    this.intelligentTaskService = new IntelligentTaskService();
  }

  /**
   * Start Agent trial conversation
   */
  async startAgentTrial(request: TryAgentRequest): Promise<TryAgentResponse> {
    try {
      const { agentId, content, userId } = request;
      
      logger.info(`🚀 Starting Agent trial [AgentID: ${agentId}, UserID: ${userId}]`);

      // Get Agent information
      const agent = await agentDao.getAgentById(agentId);
      if (!agent) {
        logger.error(`❌ Agent not found [AgentID: ${agentId}]`);
        return {
          success: false,
          message: 'Agent not found'
        };
      }

      // Check if Agent is accessible
      if (agent.status === 'private' && agent.userId !== userId) {
        logger.warn(`❌ Access denied for private Agent [${agent.name}] - User [${userId}] is not the owner [${agent.userId}]`);
        return {
          success: false,
          message: 'Access denied: This is a private Agent'
        };
      }

      const authCheck = await this.checkAgentMCPAuth(agent, userId);
      

      logger.info(`✅ MCP authentication check PASSED for Agent [${agent.name}] by user [${userId}]`);

      // Create Agent conversation with intelligent title generation
      const conversation = await this.createAgentConversation(userId, agent, content);
      logger.info(`✅ Agent conversation created [ConversationID: ${conversation.id}]`);

      // Send welcome message
      // const welcomeMessage = await this.generateWelcomeMessage(agent);
      // await messageDao.createMessage({
      //   conversationId: conversation.id,
      //   content: welcomeMessage,
      //   type: MessageType.ASSISTANT,
      //   intent: MessageIntent.CHAT
      // });

      // If user provided initial content, process it
      if (content && content.trim()) {
        logger.info(`📝 Processing initial user message: "${content}"`);
        await this.processAgentMessage(conversation.id, userId, content, agent);
      }

      // Record Agent usage
      await agentDao.recordAgentUsage(agentId, userId, undefined, conversation.id);

      logger.info(`🎉 Agent trial started successfully [Agent: ${agent.name}, User: ${userId}, Conversation: ${conversation.id}]`);

      return {
        success: true,
        conversation: {
          id: conversation.id,
          title: conversation.title,
          agentInfo: {
            id: agent.id,
            name: agent.name,
            description: agent.description
          }
        },
        message: 'Agent trial conversation started successfully'
      };
    } catch (error) {
      logger.error(`❌ Start Agent trial failed [Agent: ${request.agentId}, User: ${request.userId}]:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to start Agent trial'
      };
    }
  }

  /**
   * Process Agent message (non-streaming)
   */
  async processAgentMessage(
    conversationId: string, 
    userId: string, 
    content: string, 
    agent?: Agent
  ): Promise<{
    userMessage: Message;
    assistantMessage: Message;
    intent: MessageIntent;
    taskId?: string;
  }> {
    try {
      // Get Agent if not provided
      if (!agent) {
        const agentId = await this.extractAgentIdFromConversation(conversationId);
        if (!agentId) {
          throw new Error('Invalid Agent conversation');
        }
        
        const agentRecord = await agentDao.getAgentById(agentId);
        if (!agentRecord) {
          throw new Error('Agent not found');
        }
        agent = agentRecord;
      }

      // 🔧 重要修复：在消息处理前检查MCP认证状态
      const authCheck = await this.checkAgentMCPAuth(agent, userId);
      if (authCheck.needsAuth) {
        // 创建用户消息
        const userMessage = await messageDao.createMessage({
          conversationId,
          content,
          type: MessageType.USER,
          intent: MessageIntent.UNKNOWN,
          metadata: {
            contentType: 'user_input'  // 标识：用户输入
          }
        });

        // 创建认证提示消息
        const authMessage = this.generateMCPAuthMessage(authCheck.missingAuth);
        const assistantMessage = await messageDao.createMessage({
          conversationId,
          content: authMessage,
          type: MessageType.ASSISTANT,
          intent: MessageIntent.CHAT
        });

        return {
          userMessage,
          assistantMessage,
          intent: MessageIntent.CHAT
        };
      }

      // Create user message
      const userMessage = await messageDao.createMessage({
        conversationId,
        content,
        type: MessageType.USER,
        intent: MessageIntent.UNKNOWN
      });

      // Increment message count
      await conversationDao.incrementMessageCount(conversationId);

      // 🌍 智能解析用户语言（包括语言指令检测）
      const userLanguage = await resolveUserLanguageWithInstruction(
        content,
        agent.language,
        undefined, // TODO: 从conversation中获取语言设置
        undefined  // TODO: 从请求头中获取浏览器语言
      );

      logger.info(`🌍 Resolved user language: ${userLanguage} for message: "${content.slice(0, 50)}..."`);

      // Analyze user intent
      const intent = await this.analyzeAgentUserIntent(content, agent);

      // Update user message intent
      await messageDao.updateMessageIntent(
        userMessage.id, 
        intent.type === 'task' ? MessageIntent.TASK : MessageIntent.CHAT
      );

      // Process based on intent
      let assistantMessage: Message;
      let taskId: string | undefined;

      if (intent.type === 'task') {
        // Execute Agent task (传递用户语言)
        const taskResult = await this.executeAgentTask(content, agent, userId, conversationId, userLanguage);
        
        assistantMessage = await messageDao.createMessage({
          conversationId,
          content: taskResult.response,
          type: MessageType.ASSISTANT,
          intent: MessageIntent.TASK
        });
        
        taskId = taskResult.taskId;
        
        // Link user message to task
        if (taskId) {
          await messageDao.linkMessageToTask(userMessage.id, taskId);
        }
        
        // Increment task count
        await conversationDao.incrementTaskCount(conversationId);
      } else {
        // Chat with Agent (传递用户语言)
        const chatResponse = await this.chatWithAgent(content, agent, conversationId, userLanguage);
        
        assistantMessage = await messageDao.createMessage({
          conversationId,
          content: chatResponse,
          type: MessageType.ASSISTANT,
          intent: MessageIntent.CHAT
        });
      }

      // Increment message count
      await conversationDao.incrementMessageCount(conversationId);

      return {
        userMessage,
        assistantMessage,
        intent: intent.type === 'task' ? MessageIntent.TASK : MessageIntent.CHAT,
        taskId
      };
    } catch (error) {
      logger.error(`Process Agent message failed [Conversation: ${conversationId}]:`, error);
      throw error;
    }
  }

  /**
   * Process Agent message (streaming)
   */
  async processAgentMessageStream(
    conversationId: string,
    userId: string,
    content: string,
    streamCallback: (chunk: any) => void,
    agent?: Agent
  ): Promise<{
    userMessageId: string;
    // assistantMessageId: string;
    intent: MessageIntent;
    taskId?: string;
  }> {
    try {
      // Get Agent if not provided
      if (!agent) {
        streamCallback({
          event: 'agent_loading',
          data: { status: 'loading' }
        });

        const agentId = await this.extractAgentIdFromConversation(conversationId);
        if (!agentId) {
          throw new Error('Invalid Agent conversation');
        }
        
        const agentRecord = await agentDao.getAgentById(agentId);
        if (!agentRecord) {
          throw new Error('Agent not found');
        }
        agent = agentRecord;

        streamCallback({
          event: 'agent_loaded',
          data: { 
            agentId: agent.id,
            agentName: agent.name
          }
        });
      }

      // 🔧 重要修复：在消息处理前检查MCP认证状态
      streamCallback({
        event: 'auth_checking',
        data: { message: 'Checking MCP authentication status...' }
      });

      const authCheck = await this.checkAgentMCPAuth(agent, userId);
      if (authCheck.needsAuth) {
        streamCallback({
          event: 'auth_required',
          data: { 
            message: 'MCP authentication required',
            missingAuth: authCheck.missingAuth
          }
        });

        // 创建用户消息
        const userMessage = await messageDao.createMessage({
          conversationId,
          content,
          type: MessageType.USER,
          intent: MessageIntent.UNKNOWN,
          metadata: {
            contentType: 'user_input'  // 标识：用户输入
          }
        });

        // 创建认证提示消息
        const authMessage = this.generateMCPAuthMessage(authCheck.missingAuth);
        const assistantMessage = await messageDao.createMessage({
          conversationId,
          content: authMessage,
          type: MessageType.ASSISTANT,
          intent: MessageIntent.CHAT
        });

        streamCallback({
          event: 'message_complete',
          data: { 
            messageId: assistantMessage.id,
            content: authMessage
          }
        });

        return {
          userMessageId: userMessage.id,
          // assistantMessageId: assistantMessage.id,
          intent: MessageIntent.CHAT
        };
      }

      streamCallback({
        event: 'auth_verified',
        data: { message: 'MCP authentication verified' }
      });

      // Create user message
      const userMessage = await messageDao.createMessage({
        conversationId,
        content,
        type: MessageType.USER,
        intent: MessageIntent.UNKNOWN
      });

      streamCallback({
        event: 'user_message_created',
        data: { messageId: userMessage.id }
      });

      // Increment message count
      await conversationDao.incrementMessageCount(conversationId);

      // 🌍 智能解析用户语言（包括语言指令检测）
      const userLanguage = await resolveUserLanguageWithInstruction(
        content,
        agent.language,
        undefined, // TODO: 从conversation中获取语言设置
        undefined  // TODO: 从请求头中获取浏览器语言
      );

      logger.info(`🌍 Resolved user language: ${userLanguage} for streaming message: "${content.slice(0, 50)}..."`);

      // Analyze user intent
      streamCallback({
        event: 'intent_analysis_start',
        data: { message: 'Analyzing user intent...' }
      });

      const intent = await this.analyzeAgentUserIntent(content, agent);

      streamCallback({
        event: 'intent_analysis_complete',
        data: { 
          intent: intent.type,
          confidence: intent.confidence
        }
      });

      // Update user message intent
      await messageDao.updateMessageIntent(
        userMessage.id, 
        intent.type === 'task' ? MessageIntent.TASK : MessageIntent.CHAT
      );

      // Process based on intent
      let assistantMessageId: string;
      let taskId: string | undefined;

      if (intent.type === 'task') {
        // Execute Agent task with streaming (传递用户语言)
        const taskResult = await this.executeAgentTaskStream(content, agent, userId, conversationId, streamCallback, userLanguage);
        // assistantMessageId = taskResult.assistantMessageId;
        taskId = taskResult.taskId;
        
        // Link user message to task
        // if (taskId) {
          // await messageDao.linkMessageToTask(userMessage.id, taskId);
        // }
        
        // Increment task count
        // await conversationDao.incrementTaskCount(conversationId);
      } else {
        // Chat with Agent using streaming (传递用户语言)
        const chatResult = await this.chatWithAgentStream(content, agent, conversationId, (chunk) => {
          streamCallback({
            event: 'chat_chunk',
            data: { content: chunk }
          });
        }, userLanguage);
        
        assistantMessageId = chatResult.assistantMessageId;
      }

      // Increment message count
      await conversationDao.incrementMessageCount(conversationId);

      return {
        userMessageId: userMessage.id,
        // assistantMessageId,
        intent: intent.type === 'task' ? MessageIntent.TASK : MessageIntent.CHAT,
        taskId
      };
    } catch (error) {
      logger.error(`Process Agent message stream failed [Conversation: ${conversationId}]:`, error);
      
      streamCallback({
        event: 'error',
        data: { 
          message: 'Failed to process message',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      
      throw error;
    }
  }

  /**
   * Generate appropriate task title using LLM
   */
  private async generateTaskTitle(content: string, agent: Agent): Promise<string> {
    try {
      const prompt = `Generate a concise, descriptive title for a task based on the user's request and the agent's capabilities.

Agent: ${agent.name}
Description: ${agent.description}
Capabilities: ${agent.mcpWorkflow ? 
  agent.mcpWorkflow.mcps?.map((m: any) => m.name).join(', ') : 
  'general assistance'}

User Request: "${content}"

Requirements:
- Maximum 60 characters
- Clear and descriptive
- Reflects the main action or goal
- Professional tone
- No quotes or special formatting

Examples:
- "Search cryptocurrency prices"
- "Generate GitHub repository analysis"
- "Create social media content"
- "Analyze market trends"

Generate ONLY the title text, nothing else:`;

      const response = await this.llm.invoke([new SystemMessage(prompt)]);
      const generatedTitle = response.content.toString().trim();
      
      // Ensure title length and fallback if needed
      if (generatedTitle && generatedTitle.length <= 60) {
        return generatedTitle;
      } else if (generatedTitle && generatedTitle.length > 60) {
        return generatedTitle.substring(0, 57) + '...';
      } else {
        // Fallback to truncated content if LLM fails
        return content.length > 50 ? content.substring(0, 47) + '...' : content;
      }
    } catch (error) {
      logger.error('Failed to generate task title with LLM:', error);
      // Fallback to truncated content
      return content.length > 50 ? content.substring(0, 47) + '...' : content;
    }
  }

  /**
   * Analyze user intent for Agent conversations
   */
  private async analyzeAgentUserIntent(
    content: string, 
    agent: Agent
  ): Promise<{ type: 'chat' | 'task'; confidence: number }> {
    try {
      const prompt = `Analyze the user's intent based on their message and the agent's capabilities.

Agent: ${agent.name}
Description: ${agent.description}
Capabilities: ${agent.mcpWorkflow ? 
  JSON.stringify(agent.mcpWorkflow.mcps?.map((m: any) => m.name)) : 
  'general assistance'}

User message: "${content}"

Determine if the user wants to:
1. "task" - Execute a specific task using the agent's workflow capabilities
2. "chat" - Have a general conversation

TASK INDICATORS (classify as "task"):
- Action requests: "Help me...", "Show me...", "Create...", "Generate...", "Analyze...", "Get...", "Find...", "Execute..."
- Imperative statements: "Do this...", "Make a...", "Build...", "Search for...", "Retrieve..."
- Task-oriented requests related to the agent's capabilities
- Questions that expect the agent to perform actions or use its tools
- Requests for the agent to demonstrate its functionality

CHAT INDICATORS (classify as "chat"):
- General conversation: "Hello", "How are you?", "Nice to meet you"
- Philosophical discussions or opinions
- Casual small talk
- Questions about the agent's nature or feelings (not capabilities)

Look for action words, specific requests, or task-oriented language.
If the user's message relates to using the agent's capabilities or tools, classify as "task".
If the user's message is asking the agent to perform any action, classify as "task".

Respond with ONLY a JSON object:
{"type": "chat" | "task", "confidence": 0.0-1.0, "reasoning": "brief explanation"}`;

      const response = await this.llm.invoke([new SystemMessage(prompt)]);
      const result = JSON.parse(response.content as string);
      
      return {
        type: result.type,
        confidence: result.confidence
      };
    } catch (error) {
      logger.error('Analyze Agent user intent failed:', error);
      // Default to chat
      return { type: 'chat', confidence: 0.5 };
    }
  }

  /**
   * Execute Agent task
   */
  private async executeAgentTask(
    content: string, 
    agent: Agent, 
    userId: string, 
    conversationId: string,
    userLanguage?: SupportedLanguage
  ): Promise<{ response: string; taskId: string }> {
    try {
      // Generate appropriate task title using LLM
      const taskTitle = await this.generateTaskTitle(content, agent);
      
      // Create task based on Agent's workflow
      const taskService = getTaskService();
      const task = await taskService.createTask({
        userId,
        title: taskTitle,
        content,
        taskType: 'agent', // 🔧 新增：标记为Agent任务
        agentId: agent.id, // 🔧 新增：记录Agent ID
        conversationId
      });

      // Apply Agent's workflow to the task (keeping original structure for compatibility)
      if (agent.mcpWorkflow) {
        await taskService.updateTask(task.id, {
          mcpWorkflow: agent.mcpWorkflow,
          status: 'created'
        });
        
        logger.info(`Applied Agent workflow to task [Agent: ${agent.name}, Task: ${task.id}]`);
        
        // 🔧 关键修复：在任务执行前验证和预连接所需的MCP
        await this.ensureAgentMCPsConnected(agent, userId, task.id);
      }

      // 🔧 使用新的专用Agent任务执行器
      try {
        logger.info(`Executing Agent task using dedicated executor [Agent: ${agent.name}, Task: ${task.id}]`);
        
        const executionSuccess = await this.executeAgentTaskDedicated(task.id, agent, (data) => {
          // Silent execution for non-streaming context
          logger.debug(`Agent task execution progress: ${JSON.stringify(data)}`);
        }, userLanguage);

        if (executionSuccess) {
          // Get the completed task with results
          const completedTask = await taskService.getTaskById(task.id);
          
          // 🔧 新增：获取实际的执行结果并格式化
          const formattedResponse = await this.formatTaskResultWithLLM(
            completedTask,
            agent,
            content,
            false, // isPartialSuccess
            userLanguage
          );

          return { response: formattedResponse, taskId: task.id };
        } else {
          // Get the completed task to check for partial results
          const completedTask = await taskService.getTaskById(task.id);
          
          // 尝试格式化部分结果
          const partialResponse = await this.formatTaskResultWithLLM(
            completedTask,
            agent,
            content,
            true // 标记为部分成功
          );

          return { response: partialResponse, taskId: task.id };
        }
      } catch (executionError) {
        logger.error(`Agent task execution failed [Task: ${task.id}]:`, executionError);
        
        const errorResponse = `❌ ${agent.name} task execution failed: ${executionError instanceof Error ? executionError.message : 'Unknown error'}

**Task**: ${task.title}
**Agent**: ${agent.name}
**Task ID**: ${task.id}

I encountered an error while executing this task. Please try again or check the task configuration.`;

        return { response: errorResponse, taskId: task.id };
      }
    } catch (error) {
      logger.error('Execute Agent task failed:', error);
      throw error;
    }
  }

  /**
   * Format task result with structured output
   */
  private async formatTaskResultWithLLM(
    task: any,
    agent: Agent,
    originalRequest: string,
    isPartialSuccess: boolean = false,
    userLanguage?: SupportedLanguage
  ): Promise<string> {
    try {
      // 提取任务结果
      const taskResult = task?.result;
      const statusIcon = isPartialSuccess ? '⚠️' : '✅';
      const statusText = isPartialSuccess ? 'completed with warnings' : 'completed successfully';
      
      // 构建结构化的响应格式
      let formattedResponse = '';
      
      // 1. Success Indicator 部分 - 使用绿色成功样式
      formattedResponse += `## ✅ Success Indicator\n`;
      formattedResponse += `> The task was ${statusText}.\n\n`;
      
      // 2. Response 部分 - 使用二级标题
      formattedResponse += `## 📋 Response\n`;
      
      if (taskResult) {
        // 优先使用最终结果
        if (taskResult.finalResult) {
          formattedResponse += `${taskResult.finalResult}\n\n`;
        } else if (taskResult.summary) {
          formattedResponse += `${taskResult.summary}\n\n`;
        } else if (taskResult.steps && taskResult.steps.length > 0) {
          // 如果有步骤结果，提取关键信息
          const lastStep = taskResult.steps[taskResult.steps.length - 1];
          if (lastStep.result) {
            formattedResponse += `${lastStep.result}\n\n`;
          } else {
            formattedResponse += `The Agent uses **${agent.name}** to effortlessly access the latest information. Stay informed with this efficient tool.\n\n`;
          }
        } else {
          formattedResponse += `The Agent uses **${agent.name}** to effortlessly access the latest information. Stay informed with this efficient tool.\n\n`;
        }
      } else {
        formattedResponse += `The Agent uses **${agent.name}** to effortlessly access the latest information. Stay informed with this efficient tool.\n\n`;
      }
      
      // 3. 任务详情部分 - 使用无序列表格式，小字标题样式
      formattedResponse += `---\n\n`;
      formattedResponse += `- **Task:** ${originalRequest}\n`;
      formattedResponse += `- **Agent:** ${agent.name}\n`;
      formattedResponse += `- **Task ID:** ${task?.id || 'Unknown'}\n`;
      formattedResponse += `- **Status:** ${statusIcon} I've successfully executed this task using my specialized tools and workflow. The task has been completed as requested.\n`;
      
      return formattedResponse;
    } catch (error) {
      logger.error('Failed to format task result:', error);
      
      // 降级处理：返回基本的格式化结果
      const statusIcon = isPartialSuccess ? '⚠️' : '✅';
      const statusText = isPartialSuccess ? 'completed with warnings' : 'completed successfully';
      
      return `## ✅ Success Indicator
> The task was ${statusText}.

## 📋 Response
The Agent uses **${agent.name}** to effortlessly access the latest information. Stay informed with this efficient tool.

---

- **Task:** ${originalRequest}
- **Agent:** ${agent.name}
- **Task ID:** ${task?.id || 'Unknown'}
- **Status:** ${statusIcon} I've successfully executed this task using my specialized tools and workflow. The task has been completed as requested.`;
    }
  }

  /**
   * Execute Agent task (streaming)
   */
  private async executeAgentTaskStream(
    content: string, 
    agent: Agent, 
    userId: string, 
    conversationId: string,
    streamCallback: (chunk: any) => void,
    userLanguage?: SupportedLanguage
  ): Promise<{ taskId: string }> {
    try {
      streamCallback({
        event: 'task_creation_start',
        data: { message: 'Creating task based on Agent workflow...' }
      });

      // Generate appropriate task title using LLM
      const taskTitle = await this.generateTaskTitle(content, agent);
      
      // Create task based on Agent's workflow
      const taskService = getTaskService();
      const task = await taskService.createTask({
        userId,
        title: taskTitle,
        content,
        taskType: 'agent', // 🔧 新增：标记为Agent任务
        agentId: agent.id, // 🔧 新增：记录Agent ID
        conversationId
      });

      streamCallback({
        event: 'task_created',
        data: { 
          taskId: task.id,
          title: task.title,
          agentName: agent.name,
          message: `Task created: ${task.title} (Agent: ${agent.name})`
        }
      });

      // Apply Agent's workflow to the task
      if (agent.mcpWorkflow) {
        streamCallback({
          event: 'workflow_applying',
          data: { 
            message: `Applying ${agent.name}'s workflow configuration...`,
            agentName: agent.name
          }
        });

        await taskService.updateTask(task.id, {
          mcpWorkflow: agent.mcpWorkflow,
          status: 'created'
        });

        streamCallback({
          event: 'workflow_applied',
          data: { 
            message: `${agent.name}'s workflow applied successfully`,
            agentName: agent.name
          }
        });
        
        // 🔧 关键修复：在任务执行前验证和预连接所需的MCP
        streamCallback({
          event: 'mcp_connection_start',
          data: { 
            message: `Verifying and connecting required MCP services for ${agent.name}...`,
            agentName: agent.name
          }
        });
        
        try {
          await this.ensureAgentMCPsConnected(agent, userId, task.id);
          streamCallback({
            event: 'mcp_connection_success',
            data: { 
              message: `All required MCP services connected successfully for ${agent.name}`,
              agentName: agent.name
            }
          });
        } catch (mcpError) {
          streamCallback({
            event: 'mcp_connection_error',
            data: { 
              message: `Failed to connect required MCP services for ${agent.name}`,
              error: mcpError instanceof Error ? mcpError.message : 'Unknown error',
              agentName: agent.name
            }
          });
          throw mcpError;
        }
      }

      // 🔧 使用新的专用Agent任务执行器
      let executionSuccess = false;
      let executionError: Error | null = null;

      try {
        streamCallback({
          event: 'task_execution_start',
          data: { 
            message: `Starting task execution with ${agent.name}'s workflow...`,
            agentName: agent.name
          }
        });

        executionSuccess = await this.executeAgentTaskDedicated(task.id, agent, (executionData) => {
          // Forward Agent task execution events to the client
          streamCallback({
            event: 'task_execution_progress',
            data: {
              ...executionData,
              agentName: agent.name
            }
          });
        }, userLanguage);

        streamCallback({
          event: 'task_execution_complete',
          data: { 
            message: executionSuccess ? 
              `${agent.name} task execution completed successfully` : 
              `${agent.name} task execution completed with warnings`,
            taskId: task.id,
            success: executionSuccess,
            agentName: agent.name
          }
        });
      } catch (error) {
        executionError = error instanceof Error ? error : new Error(String(error));
        streamCallback({
          event: 'task_execution_error',
          data: { 
            message: `${agent.name} task execution failed`,
            error: executionError.message,
            taskId: task.id,
            agentName: agent.name
          }
        });
      }

      // Create assistant message based on execution result
      let assistantContent: string;
      if (executionError) {
        assistantContent = `❌ ${agent.name} task execution failed: ${executionError.message}

**Task**: ${task.title}
**Agent**: ${agent.name}
**Task ID**: ${task.id}

I encountered an error while executing this task. Please try again or check the task configuration.`;
      } else {
        // 🔧 新增：获取实际的执行结果并格式化
        streamCallback({
          event: 'formatting_results',
          data: { 
            message: `Formatting ${agent.name} execution results...`,
            agentName: agent.name
          }
        });

        try {
          const completedTask = await taskService.getTaskById(task.id);
          assistantContent = await this.formatTaskResultWithLLM(
            completedTask,
            agent,
            content,
            !executionSuccess // 如果executionSuccess为false，则标记为部分成功
          );
        } catch (formatError) {
          logger.error(`Failed to format ${agent.name} task results:`, formatError);
          
          // 降级处理
          const statusIcon = executionSuccess ? '✅' : '⚠️';
          const statusText = executionSuccess ? 'completed successfully' : 'completed with warnings';
          
          assistantContent = `${statusIcon} ${agent.name} task ${statusText}!

**Task**: ${task.title}
**Agent**: ${agent.name}
**Task ID**: ${task.id}

The task has been processed, but I encountered an issue formatting the detailed results for display.`;
        }
      }

      // const assistantMessage = await messageDao.createMessage({
      //   conversationId,
      //   content: assistantContent,
      //   type: MessageType.ASSISTANT,
      //   intent: MessageIntent.TASK
      // });

      streamCallback({
        event: 'message_complete',
        data: { 
          // messageId: assistantMessage.id,
          content: assistantContent,
          taskId: task.id,
          agentName: agent.name
        }
      });

      return { 
        // assistantMessageId: assistantMessage.id, 
        taskId: task.id 
      };
    } catch (error) {
      logger.error(`Execute ${agent.name} task stream failed:`, error);
      throw error;
    }
  }

  /**
   * 🔧 新增：确保Agent所需的MCP服务已连接并具有正确的认证信息（多用户隔离）
   */
  private async ensureAgentMCPsConnected(agent: Agent, userId: string, taskId: string): Promise<void> {
    if (!agent.mcpWorkflow || !agent.mcpWorkflow.mcps || agent.mcpWorkflow.mcps.length === 0) {
      logger.info(`Agent ${agent.name} does not require MCP services`);
      return;
    }

    // 通过TaskExecutorService访问MCPManager
    const mcpManager = (this.taskExecutorService as any).mcpManager;
    const requiredMCPs = agent.mcpWorkflow.mcps.filter((mcp: any) => mcp.authRequired);

    if (requiredMCPs.length === 0) {
      logger.info(`Agent ${agent.name} does not require authenticated MCP services`);
      return;
    }

    logger.info(`Ensuring MCP connections for Agent ${agent.name} (User: ${userId}), required MCPs: ${requiredMCPs.map((mcp: any) => mcp.name).join(', ')}`);

    for (const mcpInfo of requiredMCPs) {
      try {
        // 🔧 重要修复：检查用户特定的MCP连接
        const connectedMCPs = mcpManager.getConnectedMCPs(userId);
        const isConnected = connectedMCPs.some((mcp: any) => mcp.name === mcpInfo.name);

        if (!isConnected) {
          logger.info(`MCP ${mcpInfo.name} not connected for user ${userId}, attempting to connect for Agent task...`);
          
          // 获取MCP配置
          const { getPredefinedMCP } = await import('./predefinedMCPs.js');
          const mcpConfig = getPredefinedMCP(mcpInfo.name);
          
          if (!mcpConfig) {
            throw new Error(`MCP ${mcpInfo.name} configuration not found`);
          }

          // 获取用户认证信息
          const userAuth = await this.mcpAuthService.getUserMCPAuth(userId, mcpInfo.name);
          if (!userAuth || !userAuth.isVerified || !userAuth.authData) {
            throw new Error(`User authentication not found or not verified for MCP ${mcpInfo.name}. Please authenticate this MCP service first.`);
          }

          // 动态注入认证信息
          console.log(`\n🔧 === MCP Auth Injection Debug (Agent Conversation Service) ===`);
          console.log(`MCP Name: ${mcpInfo.name}`);
          console.log(`User ID: ${userId}`);
          console.log(`Task ID: ${taskId}`);
          console.log(`Auth Data Keys: ${Object.keys(userAuth.authData)}`);
          console.log(`Auth Params: ${JSON.stringify(mcpConfig.authParams, null, 2)}`);
          console.log(`Env Config: ${JSON.stringify(mcpConfig.env, null, 2)}`);
          
          const dynamicEnv = { ...mcpConfig.env };
          if (mcpConfig.env) {
            for (const [envKey, envValue] of Object.entries(mcpConfig.env)) {
              console.log(`Checking env var: ${envKey} = "${envValue}"`);
              
              // 🔧 改进：检查用户认证数据中是否有对应的键
              let authValue = userAuth.authData[envKey];
              
              // 🔧 如果直接键名不存在，尝试从authParams映射中查找
              if (!authValue && mcpConfig.authParams && mcpConfig.authParams[envKey]) {
                const authParamKey = mcpConfig.authParams[envKey];
                authValue = userAuth.authData[authParamKey];
                console.log(`🔧 Trying authParams mapping: ${envKey} -> ${authParamKey}, value: "${authValue}"`);
              }
              
              if ((!envValue || envValue === '') && authValue) {
                dynamicEnv[envKey] = authValue;
                console.log(`✅ Injected ${envKey} = "${authValue}"`);
                logger.info(`Injected authentication for ${envKey} in MCP ${mcpInfo.name} for user ${userId}`);
              } else {
                console.log(`❌ Not injecting ${envKey}: envValue="${envValue}", authValue: "${authValue}"`);
              }
            }
          }

          // 创建带认证信息的MCP配置
          const authenticatedMcpConfig = {
            ...mcpConfig,
            env: dynamicEnv
          };

          // 🔧 重要修复：连接MCP时传递用户ID实现多用户隔离
          const connected = await mcpManager.connectPredefined(authenticatedMcpConfig, userId);
          if (!connected) {
            throw new Error(`Failed to connect to MCP ${mcpInfo.name} for user ${userId}`);
          }

          logger.info(`✅ Successfully connected MCP ${mcpInfo.name} for user ${userId} and Agent task`);
        } else {
          logger.info(`✅ MCP ${mcpInfo.name} already connected for user ${userId}`);
        }
      } catch (error) {
        logger.error(`Failed to ensure MCP connection for ${mcpInfo.name} (User: ${userId}):`, error);
        throw new Error(`Failed to connect required MCP service ${mcpInfo.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    logger.info(`✅ All required MCP services connected for Agent ${agent.name} (User: ${userId})`);
  }

  /**
   * Chat with Agent
   */
  private async chatWithAgent(
    content: string, 
    agent: Agent, 
    conversationId: string,
    userLanguage?: SupportedLanguage
  ): Promise<string> {
    try {
      logger.info(`[Agent Chat] Processing chat with ${agent.name} [Conversation: ${conversationId}]`);
      
      // Get conversation memory
      const memory = this.getConversationMemory(conversationId);
      
      // Load memory variables
      const memoryVariables = await memory.loadMemoryVariables({});
      const chatHistory = memoryVariables.chat_history || [];
      
      // Create Agent role prompt template (with language support)
      const agentPrompt = ChatPromptTemplate.fromMessages([
        ['system', `You are ${agent.name}, an AI agent with the following characteristics:

Description: ${agent.description}

Your capabilities include: ${agent.mcpWorkflow ? 
        agent.mcpWorkflow.mcps?.map((m: any) => m.description).join(', ') : 
        'general assistance'}

Respond to the user's message in a helpful and friendly manner, staying in character as this agent. 
If they ask about your capabilities, mention what you can help with based on your description and tools.
Remember the conversation context and provide coherent, helpful responses.${userLanguage ? getLanguageInstruction(userLanguage) : ''}`],
        ...chatHistory.map((msg: any) => {
          if (msg._getType() === 'human') {
            return ['human', msg.content];
          } else if (msg._getType() === 'ai') {
            return ['assistant', msg.content];
          }
          return ['system', msg.content];
        }),
        ['human', content]
      ]);
      
      // Format messages
      const formattedMessages = await agentPrompt.formatMessages({});
      
      // Call LLM
      const response = await this.llm.invoke(formattedMessages);
      
      // Save to memory
      await memory.saveContext(
        { input: content },
        { output: response.content.toString() }
      );
      
      logger.info(`[Agent Chat] Successfully processed chat with memory support`);
      
      return response.content.toString();
    } catch (error) {
      logger.error(`[Agent Chat] Error processing chat with ${agent.name}:`, error);
      
      // Return fallback response
      return `Hello! I'm ${agent.name}. I'd be happy to help you, but I encountered an error processing your message. Could you please try again?`;
    }
  }

  /**
   * Chat with Agent (streaming)
   */
  private async chatWithAgentStream(
    content: string, 
    agent: Agent, 
    conversationId: string,
    streamCallback: (chunk: string) => void,
    userLanguage?: SupportedLanguage
  ): Promise<{ assistantMessageId: string }> {
    try {
      logger.info(`[Agent Chat Stream] Processing chat with ${agent.name} [Conversation: ${conversationId}]`);
      
      // Create empty assistant message
      const assistantMessage = await messageDao.createMessage({
        conversationId,
        content: '',  // Empty content, will be updated after stream processing
        type: MessageType.ASSISTANT,
        intent: MessageIntent.CHAT,
        metadata: {
          contentType: 'chat_response',  // 标识：Agent聊天回复
          agentName: agent.name
        }
      });
      
      // Get conversation memory
      const memory = this.getConversationMemory(conversationId);
      
      // Load memory variables
      const memoryVariables = await memory.loadMemoryVariables({});
      const chatHistory = memoryVariables.chat_history || [];
      
      // Create Agent role prompt template (with language support)
      const agentPrompt = ChatPromptTemplate.fromMessages([
        ['system', `You are ${agent.name}, an AI agent with the following characteristics:

Description: ${agent.description}

Your capabilities include: ${agent.mcpWorkflow ? 
        agent.mcpWorkflow.mcps?.map((m: any) => m.description).join(', ') : 
        'general assistance'}

Respond to the user's message in a helpful and friendly manner, staying in character as this agent. 
If they ask about your capabilities, mention what you can help with based on your description and tools.
Remember the conversation context and provide coherent, helpful responses.${userLanguage ? getLanguageInstruction(userLanguage) : ''}`],
        ...chatHistory.map((msg: any) => {
          if (msg._getType() === 'human') {
            return ['human', msg.content];
          } else if (msg._getType() === 'ai') {
            return ['assistant', msg.content];
          }
          return ['system', msg.content];
        }),
        ['human', content]
      ]);
      
      // Format messages
      const formattedMessages = await agentPrompt.formatMessages({});
      
      // Prepare streaming response handling
      let fullResponse = '';
      
      // Call LLM with streaming
      const stream = await this.llm.stream(formattedMessages);
      
      // Process streaming response
      for await (const chunk of stream) {
        if (chunk.content) {
          fullResponse += chunk.content;
          streamCallback(chunk.content as string);
        }
      }
      
      // Update assistant message with complete content
      await messageDao.updateMessageContent(assistantMessage.id, fullResponse);
      
      // Save to memory
      await memory.saveContext(
        { input: content },
        { output: fullResponse }
      );
      
      logger.info(`[Agent Chat Stream] Chat completed with ${agent.name}, response length: ${fullResponse.length}`);
      
      return {
        assistantMessageId: assistantMessage.id
      };
    } catch (error) {
      logger.error(`[Agent Chat Stream] Error processing chat with ${agent.name}:`, error);
      
      // Create fallback response
      const fallbackResponse = `Hello! I'm ${agent.name}. I'd be happy to help you, but I encountered an error processing your message. Could you please try again?`;
      
      const fallbackMessage = await messageDao.createMessage({
        conversationId,
        content: fallbackResponse,
        type: MessageType.ASSISTANT,
        intent: MessageIntent.CHAT
      });
      
      streamCallback(fallbackResponse);
      
      return {
        assistantMessageId: fallbackMessage.id
      };
    }
  }

  /**
   * Create Agent conversation with intelligent title generation
   */
  private async createAgentConversation(userId: string, agent: Agent, userContent?: string): Promise<Conversation> {
    try {
      let conversationTitle: string;

      // 1. If user provided initial content, generate title based on it
      if (userContent && userContent.trim()) {
        logger.info(`Generating Agent conversation title based on user content: "${userContent}"`);
        
        try {
          // Use the same title generation service as regular conversations
          const { titleGeneratorService } = await import('./llmTasks/titleGenerator.js');
          
          // Generate title with Agent context
          const titlePrompt = `Generate a concise, descriptive title for a conversation with AI Agent "${agent.name}".

Agent Description: ${agent.description}
User's First Message: "${userContent}"

Requirements:
- Maximum 50 characters
- Clear and descriptive
- Reflects the main topic or request
- Professional tone
- No quotes or special formatting

Examples:
- "Cryptocurrency Price Analysis"
- "GitHub Repository Setup"
- "Social Media Content Creation"
- "Market Trend Research"

Generate ONLY the title text, nothing else:`;

          // Use LLM to generate context-aware title
          const response = await this.llm.invoke([new SystemMessage(titlePrompt)]);
          const generatedTitle = response.content.toString().trim();
          
          if (generatedTitle && generatedTitle.length <= 50) {
            conversationTitle = generatedTitle;
          } else if (generatedTitle && generatedTitle.length > 50) {
            conversationTitle = generatedTitle.substring(0, 47) + '...';
          } else {
            // Fallback to truncated user content
            conversationTitle = userContent.length > 40 ? userContent.substring(0, 37) + '...' : userContent;
          }
          
          logger.info(`Generated Agent conversation title: "${conversationTitle}"`);
        } catch (error) {
          logger.error('Failed to generate Agent conversation title from user content:', error);
          // Fallback to truncated user content
          conversationTitle = userContent.length > 40 ? userContent.substring(0, 37) + '...' : userContent;
        }
      } else {
        // 2. If no user content, generate title based on Agent info
        logger.info(`Generating Agent conversation title based on Agent info: ${agent.name}`);
        
        try {
          const agentTitlePrompt = `Generate a welcoming conversation title for starting a chat with AI Agent "${agent.name}".

Agent Description: ${agent.description}
Agent Capabilities: ${agent.mcpWorkflow ? 
  agent.mcpWorkflow.mcps?.map((m: any) => m.name).join(', ') : 
  'general assistance'}

Requirements:
- Maximum 50 characters
- Welcoming and inviting tone
- Reflects the Agent's purpose
- Professional but friendly
- No quotes or special formatting

Examples:
- "Chat with Crypto Analysis Agent"
- "GitHub Assistant Conversation"
- "Social Media Content Helper"
- "Market Research Assistant"

Generate ONLY the title text, nothing else:`;

          const response = await this.llm.invoke([new SystemMessage(agentTitlePrompt)]);
          const generatedTitle = response.content.toString().trim();
          
          if (generatedTitle && generatedTitle.length <= 50) {
            conversationTitle = generatedTitle;
          } else if (generatedTitle && generatedTitle.length > 50) {
            conversationTitle = generatedTitle.substring(0, 47) + '...';
          } else {
            // Fallback to simple format
            conversationTitle = `Chat with ${agent.name}`;
          }
          
          logger.info(`Generated Agent conversation title: "${conversationTitle}"`);
        } catch (error) {
          logger.error('Failed to generate Agent conversation title from Agent info:', error);
          // Fallback to simple format
          conversationTitle = `Chat with ${agent.name}`;
        }
      }

      // 3. Create conversation with Agent type and agentId
      const conversation = await conversationDao.createConversation({
        userId,
        title: conversationTitle,
        type: ConversationType.AGENT,
        agentId: agent.id
      });

      logger.info(`Agent conversation created with title: "${conversationTitle}" [ConversationID: ${conversation.id}]`);
      return conversation;
    } catch (error) {
      logger.error('Failed to create Agent conversation:', error);
      
      // Emergency fallback - create conversation with basic title
      const fallbackTitle = `Chat with ${agent.name}`;
      const conversation = await conversationDao.createConversation({
        userId,
        title: fallbackTitle,
        type: ConversationType.AGENT,
        agentId: agent.id
      });
      
      logger.info(`Created Agent conversation with fallback title: "${fallbackTitle}"`);
      return conversation;
    }
  }

  /**
   * Generate welcome message for Agent
   */
  private async generateWelcomeMessage(agent: Agent): Promise<string> {
    const capabilities = agent.mcpWorkflow && agent.mcpWorkflow.mcps 
      ? agent.mcpWorkflow.mcps.map((m: any) => m.description || m.name).join(', ')
      : 'general assistance';

    return `Hello! I'm ${agent.name}. ${agent.description}

My capabilities include: ${capabilities}

You can:
- Chat with me about anything
- Ask me to help with tasks related to my capabilities
- Request me to demonstrate my functionality

How can I assist you today?`;
  }

  /**
   * Check Agent MCP authentication
   */
  private async checkAgentMCPAuth(agent: Agent, userId: string): Promise<MCPAuthCheckResult> {
    logger.info(`🔍 Starting MCP authentication check for Agent [${agent.name}] by user [${userId}]`);
    
    if (!agent.mcpWorkflow || !agent.mcpWorkflow.mcps) {
      logger.info(`✅ Agent [${agent.name}] does not require MCP services`);
      return { needsAuth: false, missingAuth: [] };
    }

    logger.info(`🔍 Agent [${agent.name}] requires ${agent.mcpWorkflow.mcps.length} MCP services`);
    logger.info(`🔍 MCP services: ${JSON.stringify(agent.mcpWorkflow.mcps.map(m => ({ name: m.name, authRequired: m.authRequired })))}`);

    const missingAuth: any[] = [];
    
    for (const mcp of agent.mcpWorkflow.mcps) {
      logger.info(`🔍 Checking MCP [${mcp.name}] - authRequired: ${mcp.authRequired}`);
      
      if (mcp.authRequired) {
        logger.info(`🔍 Getting user MCP auth for user [${userId}] and MCP [${mcp.name}]`);
        
        const authData = await this.mcpAuthService.getUserMCPAuth(userId, mcp.name);
        logger.info(`🔍 Auth data result: ${JSON.stringify({
          hasAuthData: !!authData,
          isVerified: authData?.isVerified,
          hasAuthDataField: !!authData?.authData,
          mcpName: mcp.name,
          userId: userId
        })}`);
        
        const isAuthenticated = authData && authData.isVerified;
        
        if (!isAuthenticated) {
          logger.warn(`❌ User [${userId}] is NOT authenticated for MCP [${mcp.name}]`);
          
          // 🔧 重要修复：返回完整的认证参数信息给前端
          missingAuth.push({
            mcpName: mcp.name,
            description: mcp.description || mcp.name,
            category: mcp.category || 'Unknown',
            imageUrl: mcp.imageUrl,
            githubUrl: mcp.githubUrl,
            authRequired: true,
            authVerified: false,
            authParams: mcp.authParams || {},
            // 添加认证指引信息
            authInstructions: this.generateAuthInstructions(mcp.name, mcp.authParams)
          });
        } else {
          logger.info(`✅ User [${userId}] is authenticated for MCP [${mcp.name}]`);
        }
      } else {
        logger.info(`ℹ️ MCP [${mcp.name}] does not require authentication`);
      }
    }

    if (missingAuth.length > 0) {
      logger.warn(`❌ Authentication check FAILED for Agent [${agent.name}] by user [${userId}]`);
      logger.warn(`❌ Missing authentication for ${missingAuth.length} MCP services: ${missingAuth.map(m => m.mcpName).join(', ')}`);
      
      return {
        needsAuth: true,
        missingAuth,
        message: `请先为以下MCP服务完成认证：${missingAuth.map(m => m.mcpName).join(', ')}`
      };
    }

    logger.info(`✅ Authentication check PASSED for Agent [${agent.name}] by user [${userId}]`);
    return { needsAuth: false, missingAuth: [] };
  }

  /**
   * 🔧 新增：生成MCP认证指引信息
   */
  private generateAuthInstructions(mcpName: string, authParams?: Record<string, any>): string {
    const baseInstructions = `To use ${mcpName}, you need to provide authentication credentials.`;
    
    if (!authParams || Object.keys(authParams).length === 0) {
      return baseInstructions;
    }

    const paramsList = Object.entries(authParams).map(([key, config]: [string, any]) => {
      const description = config.description || `${key} parameter`;
      const required = config.required ? ' (Required)' : ' (Optional)';
      return `• ${key}: ${description}${required}`;
    }).join('\n');

    return `${baseInstructions}\n\nRequired parameters:\n${paramsList}`;
  }

  /**
   * 🔧 新增：生成MCP认证提示消息
   */
  private generateMCPAuthMessage(missingAuth: any[]): string {
    const mcpNames = missingAuth.map(auth => auth.mcpName).join(', ');
    
    let message = `🔐 **Authentication Required**

To use my capabilities, you need to authenticate the following MCP services: **${mcpNames}**

`;

    missingAuth.forEach((auth, index) => {
      message += `**${index + 1}. ${auth.mcpName}**\n`;
      message += `${auth.description}\n`;
      
      if (auth.authInstructions) {
        message += `${auth.authInstructions}\n`;
      }
      
      if (auth.authParams && Object.keys(auth.authParams).length > 0) {
        message += `\nRequired authentication parameters:\n`;
        Object.entries(auth.authParams).forEach(([key, config]: [string, any]) => {
          const description = config.description || key;
          const required = config.required ? ' ✅' : ' ⚪';
          message += `${required} **${key}**: ${description}\n`;
        });
      }
      
      message += '\n';
    });

    message += `Please use the MCP authentication interface to provide your credentials, then try again.

💡 **How to authenticate:**
1. Go to the MCP settings page
2. Find the required MCP services listed above
3. Click "Authenticate" and provide your credentials
4. Return here and try your request again

Once authenticated, I'll be able to help you with tasks using these powerful tools! 🚀`;

    return message;
  }

  /**
   * 🔧 新增：Agent专用的任务执行方法 - 完全复制TaskExecutorService的流程
   * @param taskId 任务ID
   * @param agent Agent对象
   * @param stream 流式回调
   * @returns 执行是否成功
   */
  private async executeAgentTaskDedicated(
    taskId: string, 
    agent: Agent, 
    stream: (data: any) => void,
    userLanguage?: SupportedLanguage
  ): Promise<boolean> {
    try {
      logger.info(`🤖 Starting dedicated Agent task execution [Task ID: ${taskId}, Agent: ${agent.name}]`);
      
      // 发送执行开始信息
      stream({ 
        event: 'execution_start', 
        data: { 
          taskId, 
          agentName: agent.name,
          timestamp: new Date().toISOString() 
        } 
      });
      
      // 获取任务详情
      const taskService = getTaskService();
      const task = await taskService.getTaskById(taskId);
      if (!task) {
        logger.error(`❌ Task not found [ID: ${taskId}]`);
        stream({ event: 'error', data: { message: 'Task not found' } });
        return false;
      }
      
      // 更新任务状态
      await taskExecutorDao.updateTaskStatus(taskId, 'in_progress');
      stream({ event: 'status_update', data: { status: 'in_progress' } });
      
      // 获取会话ID用于存储消息
      const conversationId = task.conversationId;
      if (!conversationId) {
        logger.warn(`Task ${taskId} has no associated conversation, execution messages will not be stored`);
      }

      // 🔧 新增：智能引擎执行路径（Agent专用格式）
      const useIntelligentEngine = true;
      
      if (useIntelligentEngine) {
        logger.info(`🧠 Using intelligent workflow engine for Agent ${agent.name}`);
        
        // 使用智能任务服务执行（输出Agent格式事件流，传递用户语言）
        return await this.executeAgentTaskWithIntelligentEngine(taskId, agent, stream, userLanguage);
      }
      
      // 🔧 根据用户输入动态生成工作流，而不是使用Agent预定义的工作流
      logger.info(`🔄 Generating dynamic workflow based on user input: "${task.content}"`);
      const dynamicWorkflow = await this.generateDynamicWorkflowForAgent(task.content, agent);
      
      if (!dynamicWorkflow || dynamicWorkflow.length === 0) {
        logger.error(`❌ Failed to generate dynamic workflow for Agent task [Task ID: ${taskId}, Agent: ${agent.name}]`);
        
        stream({ 
          event: 'error', 
          data: { 
            message: 'Failed to generate workflow for user request',
            details: 'Could not determine appropriate actions for the given input'
          } 
        });
        
        await taskExecutorDao.updateTaskResult(taskId, 'failed', {
          error: 'Failed to generate workflow for user request'
        });
        
        return false;
      }
      
      logger.info(`📋 Generated dynamic workflow: ${JSON.stringify(dynamicWorkflow, null, 2)}`);
      
      // 检查 mcpManager 是否已初始化
      if (!this.mcpManager) {
        logger.error(`❌ mcpManager not initialized, cannot execute Agent task [Task ID: ${taskId}]`);
        stream({ 
          event: 'error', 
          data: { 
            message: 'Agent task execution failed: MCP manager not initialized',
            details: 'Server configuration error, please contact administrator'
          } 
        });
        
        await taskExecutorDao.updateTaskResult(taskId, 'failed', {
          error: 'Agent task execution failed: MCP manager not initialized'
        });
        
        return false;
      }
      
      // // 创建执行开始的消息
      // if (conversationId) {
      //   const executionStartMessage = await messageDao.createMessage({
      //     conversationId,
      //     content: `🤖 Executing Agent task "${task.title}" using ${agent.name}'s capabilities with ${dynamicWorkflow.length} steps...`,
      //     type: MessageType.ASSISTANT,
      //     intent: MessageIntent.TASK,
      //     taskId,
      //     metadata: {
      //       stepType: MessageStepType.EXECUTION,
      //       stepName: 'Agent Execution Start',
      //       taskPhase: 'execution',
      //       totalSteps: dynamicWorkflow.length,
      //       agentName: agent.name,
      //       isComplete: true
      //     }
      //   });
        
      //   // 增量会话消息计数
      //   await conversationDao.incrementMessageCount(conversationId);
      // }
      
      try {
        // 🔧 使用动态生成的工作流构建LangChain链
        logger.info(`🔗 Building Agent-specific LangChain workflow chain for ${dynamicWorkflow.length} dynamic steps`);
        const workflowChain = await this.buildAgentWorkflowChain(
          dynamicWorkflow,
          taskId,
          conversationId,
          agent,
          stream
        );
        
        // 执行链式调用，初始输入包含任务内容和Agent信息
        logger.info(`▶️ Executing Agent workflow chain with user input`);
        const chainResult = await workflowChain.invoke({
          taskContent: task.content,
          taskId: taskId,
          agentName: agent.name,
          agentDescription: agent.description
        });
        
        // 收集所有步骤的结果
        const workflowResults: any[] = [];
        let finalResult = null;
        
        // 从chainResult中提取步骤结果
        for (let i = 1; i <= dynamicWorkflow.length; i++) {
          const stepResult = chainResult[`step${i}`];
          if (stepResult) {
            workflowResults.push(stepResult);
          
            // 最后一步的结果作为最终结果
            if (i === dynamicWorkflow.length && stepResult.success) {
              finalResult = stepResult.result;
            }
          }
        }
        
        // 判断整体执行是否成功
        const overallSuccess = workflowResults.every(result => result.success);

        // Agent工作流完成
        stream({ 
          event: 'workflow_complete', 
          data: { 
            success: overallSuccess,
            message: overallSuccess ? 
              `${agent.name} task execution completed successfully` : 
              `${agent.name} task execution completed with errors`,
            finalResult: finalResult,
            agentName: agent.name
          }
        });
        
        // 更新任务状态
        await taskExecutorDao.updateTaskResult(
          taskId, 
          overallSuccess ? 'completed' : 'failed',
          {
            summary: overallSuccess ? 
              `${agent.name} task execution completed successfully` : 
              `${agent.name} task execution completed with some failures`,
            steps: workflowResults,
            finalResult,
            agentName: agent.name,
            agentId: agent.id
          }
        );
      
        // 发送任务完成信息
        stream({ 
          event: 'task_complete', 
          data: { 
            taskId, 
            success: overallSuccess,
            agentName: agent.name
          } 
        });
        
        logger.info(`✅ Agent task execution completed [Task ID: ${taskId}, Agent: ${agent.name}, Success: ${overallSuccess}]`);
        return overallSuccess;
        
      } catch (chainError) {
        logger.error(`❌ Agent workflow execution failed:`, chainError);
        
        // 发送链式调用错误信息
        stream({ 
          event: 'error', 
          data: { 
            message: `${agent.name} workflow execution failed`,
            details: chainError instanceof Error ? chainError.message : String(chainError)
          }
        });
        
        await taskExecutorDao.updateTaskResult(taskId, 'failed', {
          error: `${agent.name} workflow execution failed: ${chainError instanceof Error ? chainError.message : String(chainError)}`,
          agentName: agent.name,
          agentId: agent.id
        });
        
        return false;
      }
      
    } catch (error) {
      logger.error(`Error occurred during Agent task execution [Task ID: ${taskId}, Agent: ${agent.name}]:`, error);
      
      await taskExecutorDao.updateTaskResult(taskId, 'failed', {
        error: error instanceof Error ? error.message : String(error),
        agentName: agent.name,
        agentId: agent.id
      });
      
      // 发送错误信息
      stream({ 
        event: 'error', 
        data: { 
          message: `${agent.name} task execution failed`, 
          details: error instanceof Error ? error.message : String(error)
        } 
      });
      
      return false;
    }
  }

  /**
   * 🔧 新增：根据用户输入动态生成Agent工作流
   * @param userInput 用户输入内容
   * @param agent Agent对象
   * @returns 动态生成的工作流
   */
  private async generateDynamicWorkflowForAgent(
    userInput: string,
    agent: Agent
  ): Promise<Array<{ step: number; mcp: string; action: string; input?: any }>> {
    try {
      logger.info(`🔄 Generating dynamic workflow for Agent [${agent.name}] based on user input: "${userInput}"`);
      
      // 获取Agent可用的MCP工具
      const availableMCPs = agent.mcpWorkflow?.mcps || [];
      if (availableMCPs.length === 0) {
        logger.warn(`Agent [${agent.name}] has no available MCP tools`);
        return [];
      }
      
      logger.info(`📋 Available MCPs for Agent [${agent.name}]: ${availableMCPs.map(m => m.name).join(', ')}`);
      
      // 使用LLM分析用户输入并生成合适的工作流
      const workflowPrompt = `You are a workflow generation expert. Based on the user's request and available MCP tools, generate a dynamic workflow to fulfill the user's needs.

Agent: ${agent.name}
Description: ${agent.description}

Available MCP Tools:
${availableMCPs.map(mcp => `- ${mcp.name}: ${mcp.description || 'No description'}`).join('\n')}

User Request: "${userInput}"

Please analyze the user's request and generate a workflow that uses the available MCP tools to fulfill their needs. 

IMPORTANT GUIDELINES:
1. Only use MCPs that are available for this Agent
2. Generate 1-3 steps maximum (keep it simple and focused)
3. Each step should have a clear action that directly relates to the user's request
4. Use objective-based actions (describe what to achieve, not specific tool names)
5. Consider the logical flow: what needs to be done first, second, etc.

For each step, provide:
- step: sequential number starting from 1
- mcp: exact MCP name from the available list
- action: clear, objective-based description of what to accomplish
- input: optional input parameters (use the user's specific request as context)

Examples of good actions:
- "Search for current cryptocurrency prices based on user query"
- "Retrieve GitHub repository information for the specified repo"
- "Get market data for the requested tokens"
- "Search web for information about the topic mentioned by user"

Return ONLY a JSON array of workflow steps, no other text:`;

      const response = await this.llm.invoke([new SystemMessage(workflowPrompt)]);
      const workflowText = response.content.toString().trim();
      
      let workflow: Array<{ step: number; mcp: string; action: string; input?: any }>;
      
      try {
        workflow = JSON.parse(workflowText);
      } catch (parseError) {
        logger.error(`Failed to parse LLM-generated workflow:`, parseError);
        logger.error(`Raw LLM response: ${workflowText}`);
        
        // 降级处理：如果LLM返回的不是JSON，尝试生成简单的单步工作流
        const firstAvailableMCP = availableMCPs[0];
        workflow = [{
          step: 1,
          mcp: firstAvailableMCP.name,
          action: `Handle user request: ${userInput}`,
          input: userInput // 🔧 让TaskExecutorService的LLM智能转换参数格式
        }];
        
        logger.info(`Generated fallback workflow using ${firstAvailableMCP.name}`);
      }
      
      // 验证和清理生成的工作流
      const validatedWorkflow = this.validateAndCleanWorkflow(workflow, availableMCPs, userInput);
      
      logger.info(`✅ Generated dynamic workflow with ${validatedWorkflow.length} steps`);
      return validatedWorkflow;
      
    } catch (error) {
      logger.error(`Failed to generate dynamic workflow for Agent [${agent.name}]:`, error);
      
      // 最后的降级处理：使用第一个可用的MCP创建基本工作流
      const availableMCPs = agent.mcpWorkflow?.mcps || [];
      if (availableMCPs.length > 0) {
        const fallbackWorkflow = [{
          step: 1,
          mcp: availableMCPs[0].name,
          action: `Process user request: ${userInput}`,
          input: userInput // 🔧 让TaskExecutorService的LLM智能转换参数格式
        }];
        
        logger.info(`Using fallback workflow with ${availableMCPs[0].name}`);
        return fallbackWorkflow;
      }
      
      return [];
    }
  }

  /**
   * 🔧 新增：验证和清理生成的工作流
   */
  private validateAndCleanWorkflow(
    workflow: any[],
    availableMCPs: any[],
    userInput: string
  ): Array<{ step: number; mcp: string; action: string; input?: any }> {
    const availableMCPNames = availableMCPs.map(mcp => mcp.name);
    const validatedSteps: Array<{ step: number; mcp: string; action: string; input?: any }> = [];
    
    for (let i = 0; i < workflow.length; i++) {
      const step = workflow[i];
      
      // 验证步骤结构
      if (!step || typeof step !== 'object') {
        continue;
      }
      
      // 验证MCP是否可用
      if (!step.mcp || !availableMCPNames.includes(step.mcp)) {
        logger.warn(`Skipping step with invalid MCP: ${step.mcp}`);
        continue;
      }
      
      // 验证action是否存在
      if (!step.action || typeof step.action !== 'string') {
        logger.warn(`Skipping step with invalid action: ${step.action}`);
        continue;
      }
      
      // 标准化步骤
      const validatedStep = {
        step: validatedSteps.length + 1,
        mcp: step.mcp,
        action: step.action,
        input: step.input || userInput // 🔧 让TaskExecutorService的LLM智能转换参数格式
      };
      
      validatedSteps.push(validatedStep);
      
      // 限制最多3步
      if (validatedSteps.length >= 3) {
        break;
      }
    }
    
    // 如果没有有效步骤，创建一个基本步骤
    if (validatedSteps.length === 0 && availableMCPs.length > 0) {
      validatedSteps.push({
        step: 1,
        mcp: availableMCPs[0].name,
        action: `Process user request: ${userInput}`,
        input: userInput // 🔧 让TaskExecutorService的LLM智能转换参数格式
      });
    }
    
    return validatedSteps;
  }

  /**
   * 🔧 新增：构建Agent专用的LangChain工作流链（简化版本）
   * @param workflow 工作流配置
   * @param taskId 任务ID
   * @param conversationId 会话ID
   * @param agent Agent对象
   * @param stream 流式回调
   * @returns 工作流链
   */
  private async buildAgentWorkflowChain(
    workflow: Array<{ step: number; mcp: string; action: string; input?: any }>,
    taskId: string,
    conversationId: string | undefined,
    agent: Agent,
    stream: (data: any) => void
  ): Promise<RunnableSequence> {
    logger.info(`🔗 Building Agent-specific LangChain workflow chain for ${workflow.length} steps`);
    
    // 复制TaskExecutorService的工作流链构建逻辑
    const runnables = workflow.map((step) => {
      return RunnablePassthrough.assign({
        [`step${step.step}`]: async (previousResults: any) => {
          const stepNumber = step.step;
          const mcpName = step.mcp;
          const actionName = step.action;
          
          // 处理输入：优先使用上一步的结果，如果没有则使用配置的输入
          let input = step.input;
          
          // 如果是第一步之后的步骤，尝试使用前一步的结果
          if (stepNumber > 1 && previousResults[`step${stepNumber - 1}`]) {
            const prevResult = previousResults[`step${stepNumber - 1}`];
            // 智能提取前一步结果中的有用数据
            input = await this.extractUsefulDataFromAgentResult(prevResult, actionName);
          }
          
          // 确保输入格式正确
          input = this.processAgentStepInput(input || {});
          
          logger.info(`📍 Agent LangChain Step ${stepNumber}: ${mcpName} - ${actionName}`);
          logger.info(`📥 Agent step input: ${JSON.stringify(input, null, 2)}`);
          
          // 🔧 修改：为每个步骤都创建step_thinking消息，保持消息结构性
          let stepThinkingMessageId: string | undefined;
          let finalResultMessageId: string | undefined;
          
          if (conversationId) {
            // 1. 创建step_thinking消息 - 用于存储执行过程
            const stepThinkingMessage = await messageDao.createStreamingMessage({
              conversationId,
              content: '', // 初始为空，等待流式内容填充
              type: MessageType.ASSISTANT,
              intent: MessageIntent.TASK,
              taskId,
              metadata: {
                stepType: MessageStepType.EXECUTION,
                stepNumber,
                stepName: actionName,
                totalSteps: workflow.length,
                taskPhase: 'execution',
                agentName: agent.name,
                contentType: 'step_thinking'  // 执行过程消息
              }
            });
            stepThinkingMessageId = stepThinkingMessage.id;
            
            // 增量会话消息计数
            await conversationDao.incrementMessageCount(conversationId);
            
            // 2. 如果是最后一步，同时创建final_result消息
            if (stepNumber === workflow.length) {
              const finalResultMessage = await messageDao.createStreamingMessage({
                conversationId,
                content: '', // 初始为空，等待流式内容填充
                type: MessageType.ASSISTANT,
                intent: MessageIntent.TASK,
                taskId,
                                 metadata: {
                   stepType: MessageStepType.EXECUTION,
                   stepNumber,
                   stepName: actionName,
                   totalSteps: workflow.length,
                   taskPhase: 'execution',
                   agentName: agent.name,
                   contentType: 'final_result'  // 最终结果消息
                 }
              });
              finalResultMessageId = finalResultMessage.id;
              
              // 增量会话消息计数
              await conversationDao.incrementMessageCount(conversationId);
            }
          }
        
          // 发送步骤开始信息
          stream({ 
            event: 'step_start', 
            data: { 
              step: stepNumber,
              mcpName,
              actionName,
              agentName: agent.name,
              input: typeof input === 'object' ? JSON.stringify(input) : input
            } 
          });
        
          try {
            // 标准化MCP名称
            const actualMcpName = this.normalizeMCPName(mcpName);
            
            // 调用MCP工具
            const stepResult = await this.callAgentMCPTool(actualMcpName, actionName, input, taskId);
            
            // 🔧 关键修复：为每个步骤都添加流式格式化响应
            let formattedResult: string;
            if (stepNumber === workflow.length) {
              // 最后一步使用流式格式化，并发送final_result_chunk事件
              formattedResult = await this.formatAgentResultWithLLMStream(
                stepResult, 
                actualMcpName, 
                actionName,
                agent,
                (chunk: string) => {
                  // 发送流式final_result块
                  stream({
                    event: 'final_result_chunk',
                    data: { 
                      chunk,
                      agentName: agent.name
                    }
                  });
                }
              );
            } else {
              // 🔧 修复：中间步骤也使用流式格式化，发送step_result_chunk事件
              formattedResult = await this.formatAgentResultWithLLMStream(
                stepResult, 
                actualMcpName, 
                actionName,
                agent,
                (chunk: string) => {
                  // 发送流式步骤结果块
                  stream({
                    event: 'step_result_chunk',
                    data: { 
                      step: stepNumber,
                      chunk,
                      agentName: agent.name
                    }
                  });
                }
              );
            }
            
            // 完成步骤消息 - 存储完整的执行结果
            if (stepThinkingMessageId) {
              await messageDao.completeStreamingMessage(stepThinkingMessageId, formattedResult);
            }
            
            // 如果有final_result消息，也需要完成它
            if (finalResultMessageId) {
              await messageDao.completeStreamingMessage(finalResultMessageId, formattedResult);
            }
            
            // 保存步骤结果（保存格式化后的结果）
            await taskExecutorDao.saveStepResult(taskId, stepNumber, true, formattedResult);
          
            // 发送步骤完成信息（发送格式化后的结果）
            stream({ 
              event: 'step_complete', 
              data: { 
                step: stepNumber,
                success: true,
                result: formattedResult,
                rawResult: stepResult, // 保留原始MCP结果供调试
                agentName: agent.name
              } 
            });
          
            return {
              step: stepNumber,
              success: true,
              result: formattedResult,
              rawResult: stepResult,
              parsedData: this.parseAgentResultData(stepResult) // 解析结构化数据供下一步使用
            };
          } catch (error) {
            logger.error(`❌ Agent LangChain Step ${stepNumber} failed:`, error);
            const errorMsg = error instanceof Error ? error.message : String(error);
          
            // 完成步骤消息（错误状态）
            if (stepThinkingMessageId) {
              await messageDao.completeStreamingMessage(stepThinkingMessageId, `🤖 ${agent.name} 执行失败: ${errorMsg}`);
            }
            
            // 如果有final_result消息，也需要完成它（错误状态）
            if (finalResultMessageId) {
              await messageDao.completeStreamingMessage(finalResultMessageId, `🤖 ${agent.name} 执行失败: ${errorMsg}`);
            }
            
            // 保存错误结果
            await taskExecutorDao.saveStepResult(taskId, stepNumber, false, errorMsg);
          
            // 发送步骤错误信息
            stream({ 
              event: 'step_error', 
              data: { 
                step: stepNumber,
                error: errorMsg,
                agentName: agent.name
              } 
            });
            
            return {
              step: stepNumber,
              success: false,
              error: errorMsg
            };
          }
        }
      });
    });
    
    // 使用pipe方法创建链式调用
    if (runnables.length === 0) {
      throw new Error('Agent workflow must have at least one step');
    }
    
    // 使用reduce创建链式调用
    const chain = runnables.reduce((prev, current, index) => {
      if (index === 0) {
        return current;
      }
      return prev.pipe(current);
    }, runnables[0] as any);
    
    return chain as RunnableSequence;
  }

  /**
   * 🔧 新增：Agent专用的MCP工具调用方法
   */
  private async callAgentMCPTool(mcpName: string, toolNameOrObjective: string, input: any, taskId?: string): Promise<any> {
    // 复制TaskExecutorService的callMCPTool逻辑，但添加Agent特定的处理
    return await (this.taskExecutorService as any).callMCPTool(mcpName, toolNameOrObjective, input, taskId);
  }

  /**
   * 🔧 新增：Agent专用的输入处理方法
   */
  private processAgentStepInput(input: any): any {
    // 复制TaskExecutorService的processStepInput逻辑
    return (this.taskExecutorService as any).processStepInput(input);
  }

  /**
   * 🔧 新增：Agent专用的MCP名称标准化方法
   */
  private normalizeMCPName(mcpName: string): string {
    // 复制TaskExecutorService的normalizeMCPName逻辑
    return (this.taskExecutorService as any).normalizeMCPName(mcpName);
  }

  /**
   * 🔧 新增：从Agent结果中提取有用数据
   */
  private async extractUsefulDataFromAgentResult(prevResult: any, nextAction: string): Promise<any> {
    // 复制TaskExecutorService的extractUsefulDataFromResult逻辑
    return await (this.taskExecutorService as any).extractUsefulDataFromResult(prevResult, nextAction);
  }

  /**
   * 🔧 新增：Agent专用的结果格式化方法
   */
  private async formatAgentResultWithLLM(rawResult: any, mcpName: string, actionName: string, agent: Agent): Promise<string> {
    try {
      // 🔧 关键修复：直接调用TaskExecutorService的formatResultWithLLM方法，不添加Agent前缀
      // 这样可以避免markdown内容被错误包装
      const formattedResult = await (this.taskExecutorService as any).formatResultWithLLM(rawResult, mcpName, actionName);
      
      // 直接返回格式化结果，不添加Agent标识
      return formattedResult;
    } catch (error) {
      logger.error(`Failed to format Agent result:`, error);
      return `### ${actionName} 结果\n\n\`\`\`json\n${JSON.stringify(rawResult, null, 2)}\n\`\`\``;
    }
  }

  /**
   * 🔧 新增：Agent专用的流式结果格式化方法（累积完整内容用于存储）
   */
  private async formatAgentResultWithLLMStream(
    rawResult: any, 
    mcpName: string, 
    actionName: string, 
    agent: Agent,
    streamCallback: (chunk: string) => void
  ): Promise<string> {
    try {
      // 🔧 关键修复：直接调用TaskExecutorService的formatResultWithLLMStream方法
      // 不添加Agent前缀，避免markdown内容被错误包装
      const formattedResult = await (this.taskExecutorService as any).formatResultWithLLMStream(
        rawResult, 
        mcpName, 
        actionName,
        streamCallback // 直接传递streamCallback，不添加额外的Agent前缀
      );
      
      // 直接返回格式化结果，不添加Agent标识
      return formattedResult;
    } catch (error) {
      logger.error(`Failed to format Agent result with streaming:`, error);
      const fallbackResult = `### ${actionName} 结果\n\n\`\`\`json\n${JSON.stringify(rawResult, null, 2)}\n\`\`\``;
      streamCallback(fallbackResult);
      return fallbackResult;
    }
  }

  /**
   * 🔧 新增：Agent专用的结果数据解析方法
   */
  private parseAgentResultData(result: any): any {
    // 复制TaskExecutorService的parseResultData逻辑
    return (this.taskExecutorService as any).parseResultData(result);
  }


  /**
   * Extract Agent ID from conversation
   */
  private async extractAgentIdFromConversation(conversationId: string): Promise<string | null> {
    const conversation = await conversationDao.getConversationById(conversationId);
    if (!conversation) return null;

    // First try to get Agent ID from the agentId field
    if (conversation.agentId) {
      return conversation.agentId;
    }

    // Fallback: Extract Agent ID from title using the emoji format (for backward compatibility)
    const emojiMatch = conversation.title.match(/🤖\[([^\]]+)\]$/);
    if (emojiMatch) {
      return emojiMatch[1];
    }

    // Fallback: Parse Agent ID from old title format (for backward compatibility)
    const oldMatch = conversation.title.match(/^\[AGENT:([^\]]+)\]/);
    return oldMatch ? oldMatch[1] : null;
  }

  /**
   * Get conversation memory
   */
  private getConversationMemory(conversationId: string): BufferMemory {
    if (!this.conversationMemories.has(conversationId)) {
      const memory = new BufferMemory({
        memoryKey: 'chat_history',
        returnMessages: true,
        inputKey: 'input',
        outputKey: 'output'
      });
      this.conversationMemories.set(conversationId, memory);
    }
    return this.conversationMemories.get(conversationId)!;
  }

  /**
   * Clear conversation memory
   */
  async clearConversationMemory(conversationId: string): Promise<void> {
    try {
      // Remove conversation memory from cache
      if (this.conversationMemories.has(conversationId)) {
        this.conversationMemories.delete(conversationId);
        logger.info(`Cleared Agent conversation memory [ConversationID: ${conversationId}]`);
      }
    } catch (error) {
      logger.error(`Failed to clear Agent conversation memory [ID: ${conversationId}]:`, error);
      throw error;
    }
  }

  /**
   * Clean Agent conversation title for display
   * Removes the Agent identifier from the title for better UX
   */
  static cleanAgentConversationTitle(title: string): string {
    // Remove the Agent identifier: "Title 🤖[agent-id]" -> "Title"
    const cleanTitle = title.replace(/\s*🤖\[[^\]]+\]$/, '');
    
    // Also handle old format: "[AGENT:agent-id] Title" -> "Title"
    const oldFormatClean = cleanTitle.replace(/^\[AGENT:[^\]]+\]\s*/, '');
    
    return oldFormatClean || title; // Return original if cleaning fails
  }

  /**
   * Check if conversation is Agent conversation
   */
  async isAgentConversation(conversationId: string): Promise<boolean> {
    try {
      const conversation = await conversationDao.getConversationById(conversationId);
      if (!conversation) return false;

      // Check if conversation type is Agent
      if (conversation.type === ConversationType.AGENT) {
        return true;
      }

      // Fallback: Check if title contains Agent identifier (for backward compatibility)
      const hasAgentIdentifier = conversation.title.includes('🤖[') && conversation.title.includes(']');
      const hasOldIdentifier = conversation.title.startsWith('[AGENT:');

      return hasAgentIdentifier || hasOldIdentifier;
    } catch (error) {
      logger.error(`Failed to check if conversation is Agent conversation [ID: ${conversationId}]:`, error);
      return false;
    }
  }

  /**
   * Get Agent from conversation
   */
  async getAgentFromConversation(conversationId: string): Promise<Agent | null> {
    const agentId = await this.extractAgentIdFromConversation(conversationId);
    if (!agentId) return null;

    return await agentDao.getAgentById(agentId);
  }

  /**
   * 使用Agent专用智能引擎执行任务
   */
  private async executeAgentTaskWithIntelligentEngine(
    taskId: string,
    agent: Agent, 
    stream: (data: any) => void,
    userLanguage?: SupportedLanguage
  ): Promise<boolean> {
    try {
      logger.info(`🧠 Starting Agent intelligent task execution [Task ID: ${taskId}, Agent: ${agent.name}]`);
      
      // 🔧 创建Agent专用智能任务服务
      const agentIntelligentService = createAgentIntelligentTaskService(agent);
      
      // 🔧 使用Agent专用智能引擎执行（原生支持Agent事件流格式，传递用户语言）
      const success = await agentIntelligentService.executeAgentTaskIntelligently(taskId, stream, userLanguage);

      logger.info(`🎯 Agent intelligent task execution completed [Success: ${success}, Agent: ${agent.name}]`);
      return success;

    } catch (error) {
      logger.error(`❌ Agent intelligent task execution failed:`, error);
      
      stream({
        event: 'task_execution_error',
        data: {
          error: error instanceof Error ? error.message : String(error),
          agentName: agent.name,
          message: `${agent.name} intelligent execution failed`,
          timestamp: new Date().toISOString()
        }
      });
      
      return false;
    }
  }
}

// Singleton instance
let agentConversationServiceInstance: AgentConversationService | null = null;

/**
 * Get AgentConversationService instance
 */
export function getAgentConversationService(taskExecutorService: TaskExecutorService): AgentConversationService {
  if (!agentConversationServiceInstance) {
    agentConversationServiceInstance = new AgentConversationService(taskExecutorService);
  }
  return agentConversationServiceInstance;
} 