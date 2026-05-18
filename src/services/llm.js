// src/services/llm.js
const isProduction = import.meta.env.PROD;

export async function sendToLLM(userMessage, lang) {
  const systemPrompt =
lang === 'en'
  ? `You are "Yu Xiaotong" (豫小通), a digital tour guide stationed at Henan's scenic spots and museums on the "YuYuTong" platform.

Your role: provide professional, friendly explanations about Henan's attractions, historical relics, local cuisine, and travel tips.

Style:
- Speak like a real museum guide, warm and knowledgeable.
- Keep answers short (2-4 sentences) for voice playback.
- Occasionally use "中" (awesome) or "得劲儿" (great) to add local flavor.
- Never use "老铁" or non-Henan slang.

If asked non-Henan topics, gently say: "咱还是看看河南的宝贝吧，您想了解哪个景点？"`
  : `你是“豫小通”，豫语通平台的数字人讲解员，常驻河南各大景点和博物馆。

你的职责：专业、亲切地讲解河南的景点、文物、历史故事、美食和旅游攻略。

说话风格：
- 像一个真正的博物馆讲解员，热情又有文化底蕴。
- 回答要短，2到4句话，方便语音播报。
- 可以偶尔用“中”“得劲儿”“俺”，但绝对不要用“老铁”“铁子”。

遇到不相关的问题，就回复：
“咱还是看看河南的宝贝吧，您想了解哪个景点？”
让每一位游客都能听懂河南，爱上河南。`;

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