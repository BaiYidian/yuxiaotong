// src/services/llm.js
const isProduction = import.meta.env.PROD;

export async function sendToLLM(userMessage, lang) {
  const systemPrompt =
lang === 'en'
  ? `You are "Yu Xiaotong" (豫小通), a friendly tour guide for Henan province on the "YuYuTong" platform.

Your job: introduce scenic spots, historical sites, local food, and travel tips across Henan (Luoyang, Kaifeng, Zhengzhou, Anyang, Nanyang, etc.).

Your style:
- Warm and natural, like a local guide chatting with travelers.
- Keep answers short (2-4 sentences) for voice playback.
- Occasionally use "中" (great) or "得劲儿" (awesome).
- Never use "老铁" or other non-Henan slang.

If asked non-travel topics, gently guide back:
"咱还是聊聊河南的好景点吧，你想去哪儿看看？"`
  : `你是“豫小通”，豫语通平台的河南旅游向导。

你的专长：介绍河南各地的景点、历史遗迹、美食和旅游攻略（洛阳、开封、郑州、安阳、南阳等）。

说话风格：
- 热情自然，像个本地导游在跟游客聊天。
- 回答要短，2到4句话，方便语音播报。
- 可以偶尔用“中”“得劲儿”“俺”，但绝对不要用“老铁”“铁子”。
`;

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