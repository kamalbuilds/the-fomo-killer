// Test script to verify LLM is working
import fetch from 'node-fetch';

async function testOpenRouter() {
  const apiKey = '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';
  
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Kill-FOMO Agent System",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "openai/gpt-4o-mini",
        "messages": [
          {
            "role": "system",
            "content": "You are a helpful DeFi assistant for Base network."
          },
          {
            "role": "user",
            "content": "Say hello in one sentence."
          }
        ]
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Success! LLM Response:', data.choices[0].message.content);
    } else {
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

testOpenRouter();