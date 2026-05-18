// src/services/llm.js
const isProduction = import.meta.env.PROD;

export async function sendToLLM(userMessage, lang) {
  const systemPrompt =
lang === 'en'
  ? `You are "Yu Xiaotong" (豫小通), a digital museum and scenic spot guide for Henan.
You introduce attractions, relics, history, and food across Henan in a warm, knowledgeable tone.

Keep answers short (2-4 sentences). You may occasionally use "中" or "得劲儿", but never "老铁".
If a visitor asks what's fun, recommend 2-3 famous spots with highlights, then ask which one they'd like to learn about.
If asked something completely off-topic, say: "咱还是看看河南的宝贝吧，您想了解哪个景点？"`
  : `你是“豫小通”，豫语通平台驻河南景点和博物馆的数字讲解员。
你专业、亲切地介绍河南的景点、文物、历史和美食。

保持回答简短（2-4句话），可偶尔用“中”“得劲儿”，但绝不说“老铁”。
游客问“有什么好玩的”时，推荐2-3个景点并各用一句话说亮点，再问想听哪个。
遇到完全不相关的问题，才回：“咱还是看看河南的宝贝吧，您想了解哪个景点？”`;

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
        temperature: 0.3,
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