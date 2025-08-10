import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export async function POST(request: NextRequest) {
  try {
    const { message = "Hello, how are you?" } = await request.json();
    
    // Log the API key (first few chars only for security)
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('API Key check:', {
      exists: !!apiKey,
      length: apiKey?.length,
      prefix: apiKey?.substring(0, 10) + '...',
    });

    // Create LLM instance for OpenRouter
    const llm = new ChatOpenAI({
      modelName: 'openai/gpt-4o-mini', // OpenRouter model format
      temperature: 0.7,
      openAIApiKey: apiKey,
      configuration: {
        baseURL: process.env.OPENAI_API_BASE || 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'http://localhost:3000', // Your site URL
          'X-Title': 'Kill-FOMO Agent System', // Your site name
        },
      },
    });

    console.log('Calling OpenAI API with message:', message);
    
    // Test the LLM
    const startTime = Date.now();
    const response = await llm.invoke(message);
    const duration = Date.now() - startTime;
    
    console.log('OpenAI API response received in', duration, 'ms');

    return NextResponse.json({
      success: true,
      message: "LLM is working!",
      input: message,
      response: response.content,
      duration: duration,
      model: 'gpt-4o-mini',
      metadata: {
        apiKeyConfigured: !!apiKey,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error: any) {
    console.error('LLM Test Error:', error);
    
    // Parse the error for more details
    let errorDetails = {
      message: error.message || 'Unknown error',
      type: error.constructor.name,
      code: error.code,
      status: error.status,
    };

    // Check for specific error types
    if (error.message?.includes('429')) {
      errorDetails.message = 'OpenAI API quota exceeded. Please check your billing.';
    } else if (error.message?.includes('401')) {
      errorDetails.message = 'Invalid OpenAI API key. Please check your configuration.';
    } else if (error.message?.includes('not found')) {
      errorDetails.message = 'OpenAI API key not configured. Please set OPENAI_API_KEY in .env';
    }

    return NextResponse.json({
      success: false,
      error: errorDetails,
      apiKeyConfigured: !!process.env.OPENAI_API_KEY,
      apiKeyLength: process.env.OPENAI_API_KEY?.length,
    }, { status: 500 });
  }
}

// GET endpoint for quick testing
export async function GET() {
  return NextResponse.json({
    message: "Test LLM endpoint is working. Send a POST request with { message: 'your message' } to test the OpenAI API.",
    apiKeyConfigured: !!process.env.OPENAI_API_KEY,
    apiKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) + '...',
  });
}