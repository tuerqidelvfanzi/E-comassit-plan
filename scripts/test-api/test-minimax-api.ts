/**
 * Minimax Anthropic 兼容 API 全功能测试脚本
 * 用法: npx ts-node scripts/test-api/test-minimax-api.ts
 *
 * 环境变量:
 *   MINIMAX_API_KEY - 你的 API Key
 *   MINIMAX_API_BASE - API 地址 (默认: https://api.minimaxi.com/v1)
 */

const API_KEY = process.env.MINIMAX_API_KEY || '';
const API_BASE = process.env.MINIMAX_API_BASE || 'https://api.minimaxi.com/v1';

type TestResult = { name: string; passed: boolean; detail: string };

async function testConnection(): Promise<TestResult> {
  console.log('\n【1】GET /v1/models - 列出可用模型');
  if (!API_KEY) {
    return { name: 'API 连接', passed: false, detail: 'Missing API Key' };
  }
  try {
    const response = await fetch(`${API_BASE}/models`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    });
    if (response.ok) {
      const data = await response.json();
      const count = data.data?.length || 0;
      return { name: 'API 连接', passed: true, detail: `${count} 个模型` };
    }
    return { name: 'API 连接', passed: false, detail: `HTTP ${response.status}` };
  } catch (error) {
    return { name: 'API 连接', passed: false, detail: String(error) };
  }
}

async function testAnthropicMessages(): Promise<TestResult> {
  console.log('\n【2】POST /v1/messages - Anthropic 格式');
  try {
    const response = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7-highspeed',
        messages: [{ role: 'user', content: 'reply OK only' }],
        max_tokens: 10,
      }),
    });
    if (response.ok) {
      return { name: 'Anthropic 格式', passed: true, detail: 'OK' };
    }
    return { name: 'Anthropic 格式', passed: false, detail: `HTTP ${response.status}` };
  } catch (error) {
    return { name: 'Anthropic 格式', passed: false, detail: String(error) };
  }
}

async function testOpenAIChat(): Promise<TestResult> {
  console.log('\n【3】POST /v1/chat/completions - OpenAI 格式');
  try {
    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7-highspeed',
        messages: [{ role: 'user', content: 'reply OK only' }],
        max_tokens: 10,
      }),
    });
    if (response.ok) {
      const data = await response.json();
      return { name: 'OpenAI 格式', passed: true, detail: data.choices?.[0]?.message?.content?.slice(0, 30) || 'OK' };
    }
    return { name: 'OpenAI 格式', passed: false, detail: `HTTP ${response.status}` };
  } catch (error) {
    return { name: 'OpenAI 格式', passed: false, detail: String(error) };
  }
}

async function testStreaming(): Promise<TestResult> {
  console.log('\n【4】流式输出 (stream)');
  try {
    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7-highspeed',
        messages: [{ role: 'user', content: 'count to 3' }],
        max_tokens: 30,
        stream: true,
      }),
    });
    if (!response.ok || !response.body) {
      return { name: '流式输出', passed: false, detail: `HTTP ${response.status}` };
    }
    let chunkCount = 0;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      if (chunk.includes('data:')) chunkCount++;
    }
    return { name: '流式输出', passed: true, detail: `${chunkCount} chunks` };
  } catch (error) {
    return { name: '流式输出', passed: false, detail: String(error) };
  }
}

async function testVision(): Promise<TestResult> {
  console.log('\n【5】图像理解 (vision)');
  try {
    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7-highspeed',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'describe this image' },
            { type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' } }
          ]
        }],
        max_tokens: 50,
      }),
    });
    if (response.ok) {
      return { name: '图像理解', passed: true, detail: 'supported' };
    }
    return { name: '图像理解', passed: false, detail: `HTTP ${response.status}` };
  } catch (error) {
    return { name: '图像理解', passed: false, detail: String(error) };
  }
}

async function testMusic(): Promise<TestResult> {
  console.log('\n【6】音乐生成 (music_generation)');
  try {
    const response = await fetch(`${API_BASE}/v1/music_generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'music-2.0',
        prompt: 'calm piano',
        lyrics: '[Instrumental]',
        instrumental: true,
      }),
    });
    if (response.ok) {
      const data = await response.json();
      return { name: '音乐生成', passed: true, detail: `job_id: ${data.job_id?.slice(0, 20)}...` };
    }
    return { name: '音乐生成', passed: false, detail: `HTTP ${response.status}` };
  } catch (error) {
    return { name: '音乐生成', passed: false, detail: String(error) };
  }
}

async function testEmbeddings(): Promise<TestResult> {
  console.log('\n【7】向量嵌入 (embeddings)');
  try {
    const response = await fetch(`${API_BASE}/v1/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ model: 'embo-01', input: 'Hello world' }),
    });
    if (response.ok) {
      const data = await response.json();
      const dim = data.data?.[0]?.embedding?.length || 0;
      return { name: '向量嵌入', passed: true, detail: `${dim} 维` };
    }
    return { name: '向量嵌入', passed: false, detail: `HTTP ${response.status}` };
  } catch (error) {
    return { name: '向量嵌入', passed: false, detail: String(error) };
  }
}

async function testMultiTurn(): Promise<TestResult> {
  console.log('\n【8】多轮对话');
  try {
    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7-highspeed',
        messages: [
          { role: 'user', content: 'My name is Alice' },
          { role: 'assistant', content: 'Hello Alice!' },
          { role: 'user', content: 'What is my name?' }
        ],
        max_tokens: 30,
      }),
    });
    if (response.ok) {
      const data = await response.json();
      return { name: '多轮对话', passed: true, detail: data.choices?.[0]?.message?.content?.slice(0, 30) || 'OK' };
    }
    return { name: '多轮对话', passed: false, detail: `HTTP ${response.status}` };
  } catch (error) {
    return { name: '多轮对话', passed: false, detail: String(error) };
  }
}

async function testSystemPrompt(): Promise<TestResult> {
  console.log('\n【9】系统提示词 (system prompt)');
  try {
    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7-highspeed',
        messages: [
          { role: 'system', content: 'You are a pirate. Reply in one word.' },
          { role: 'user', content: 'Hello!' }
        ],
        max_tokens: 10,
      }),
    });
    if (response.ok) {
      return { name: '系统提示词', passed: true, detail: 'supported' };
    }
    return { name: '系统提示词', passed: false, detail: `HTTP ${response.status}` };
  } catch (error) {
    return { name: '系统提示词', passed: false, detail: String(error) };
  }
}

async function testFunctionCalling(): Promise<TestResult> {
  console.log('\n【10】Function Calling / Tools');
  try {
    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7-highspeed',
        messages: [{ role: 'user', content: 'What is 2+2?' }],
        max_tokens: 100,
        tools: [{
          type: 'function',
          function: {
            name: 'calculator',
            description: 'Calculate math',
            parameters: { type: 'object', properties: { expr: { type: 'string' } } }
          }
        }],
      }),
    });
    if (response.ok) {
      const data = await response.json();
      const toolCalls = data.choices?.[0]?.message?.tool_calls?.length || 0;
      return { name: 'Function Calling', passed: true, detail: `${toolCalls} tool calls` };
    }
    return { name: 'Function Calling', passed: false, detail: `HTTP ${response.status}` };
  } catch (error) {
    return { name: 'Function Calling', passed: false, detail: String(error) };
  }
}

async function testUsage(): Promise<TestResult> {
  console.log('\n【11】Usage 信息');
  try {
    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7-highspeed',
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 10,
      }),
    });
    if (response.ok) {
      const data = await response.json();
      const usage = data.usage || {};
      return { name: 'Usage 信息', passed: true, detail: `tokens: ${usage.total_tokens}` };
    }
    return { name: 'Usage 信息', passed: false, detail: `HTTP ${response.status}` };
  } catch (error) {
    return { name: 'Usage 信息', passed: false, detail: String(error) };
  }
}

async function testParameters(): Promise<TestResult> {
  console.log('\n【12】参数 (temperature, top_p, stop)');
  try {
    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7-highspeed',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 10,
        temperature: 0.7,
        top_p: 0.9,
      }),
    });
    if (response.ok) {
      return { name: '参数设置', passed: true, detail: 'supported' };
    }
    return { name: '参数设置', passed: false, detail: `HTTP ${response.status}` };
  } catch (error) {
    return { name: '参数设置', passed: false, detail: String(error) };
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Minimax Anthropic API 全功能测试          ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`\nAPI Base: ${API_BASE}`);
  console.log(`API Key: ${API_KEY ? '***' + API_KEY.slice(-4) : 'NOT SET'}`);

  const results: TestResult[] = [];

  results.push(await testConnection());
  results.push(await testAnthropicMessages());
  results.push(await testOpenAIChat());
  results.push(await testStreaming());
  results.push(await testVision());
  results.push(await testMusic());
  results.push(await testEmbeddings());
  results.push(await testMultiTurn());
  results.push(await testSystemPrompt());
  results.push(await testFunctionCalling());
  results.push(await testUsage());
  results.push(await testParameters());

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║              测试结果总结                    ║');
  console.log('╚════════════════════════════════════════════╝');

  for (const { name, passed, detail } of results) {
    console.log(`  ${passed ? '✅' : '❌'} ${name}: ${detail}`);
  }

  const passed = results.filter(r => r.passed).length;
  console.log(`\n通过率: ${passed}/${results.length}`);

  if (passed === results.length) {
    console.log('🎉 所有测试通过！');
  }
}

main().catch(console.error);
