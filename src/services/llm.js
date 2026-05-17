// src/services/llm.js
const isProduction = import.meta.env.PROD;

export async function sendToLLM(userMessage, lang) {
  const systemPrompt =
    lang === 'en'
      ? "You are Yu Xiaotong, a cultural ambassador of Luoyang. Answer travel questions in a warm, concise tone."
      : "你是‘豫小通’，洛阳数智文化使者。请用亲切的中原风格回答，简洁有趣，可适当用方言词。";

  try {
    // 生产环境请求自己的 Serverless 函数，开发环境请求 Vite 代理
    const url = isProduction ? '/api/chat' : '/api/siliconflow/chat/completions';

    const headers = {
      'Content-Type': 'application/json',
    };

    // 开发环境：通过 Vite 代理转发，需要在请求头里带上 API Key
    if (!isProduction) {
      headers['Authorization'] = `Bearer ${import.meta.env.VITE_SILICONFLOW_API_KEY}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-7B-Instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    const data = await res.json();
    // 生产环境返回格式：{ reply: "..." }，开发环境返回 OpenAI 格式：{ choices: [...] }
    return isProduction ? data.reply : data.choices?.[0]?.message?.content || '抱歉，我暂时无法回答。';
  } catch (err) {
    console.error('大模型请求失败:', err);
    return lang === 'en'
      ? "Sorry, I'm having trouble answering right now."
      : '哎呀，俺这会儿信号不太中，稍等再问呗。';
  }
}