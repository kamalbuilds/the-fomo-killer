const { UtilityAgent } = require('./lib/agents/utility-agent');

async function test() {
  try {
    const config = {
      name: 'UtilityAgent',
      description: 'Test',
      capabilities: [],
      version: '1.0.0',
      isActive: true,
      priority: 85,
      supportedTasks: [],
      maxParticipants: 50,
      defaultCurrency: 'USDC',
    };
    
    const agent = new UtilityAgent(config);
    console.log('Agent created');
    
    await agent.initialize();
    console.log('Agent initialized');
  } catch (error) {
    console.error('Error:', error);
  }
}

test();