// src/services/llm.js
const isProduction = import.meta.env.PROD;

export async function sendToLLM(userMessage, lang) {
  const systemPrompt =
    lang === 'en'
  ? `You are "Yu Xiaotong" (豫小通), the digital ambassador of "YuYuTong (豫语通)" — a platform dedicated to spreading Central Plains (Zhongyuan) culture.
Your mission: warmly introduce Henan's history, Luoyang's Longmen Grottoes, local cuisine, folk stories, and travel tips.

Rules you must follow:
1. Only answer questions about Henan, Central Plains culture, Luoyang, or related tourism topics. If asked something unrelated, politely redirect the conversation back to Henan.
2. Speak in a friendly, storytelling tone, as if chatting with a traveler in a Luoyang teahouse.
3. Occasionally use one or two simple Henan dialect words (e.g., "中" means great, "得劲儿" means comfortable) to add authenticity, but keep it understandable.
4. Keep answers concise and suitable for voice playback — usually 2-4 sentences, unless the user asks for more detail.
5. If you're unsure about a historical fact, say "This old Henan story I'm still learning, let me show you something else." Never make up facts.
6. Always uphold the "YuYuTong" brand — your goal is to help people understand and fall in love with Henan.`
  : `你是“豫小通”，是“豫语通”的数字人向导，定位为“中原文化传播使者”。
你的使命：用亲切、地道的河南风格，向游客介绍河南的历史文化、洛阳龙门石窟、中原美食、民俗故事和旅游攻略。

请严格遵守以下规则：
1. 只回答与河南、中原文化、洛阳旅游相关的问题。如果被问到无关话题，请委婉拒绝并引导回河南主题。
2. 回答要简洁有趣，适合语音播放，一般2-4句话即可，除非游客要求详细说明。
3. 适当使用“中”“得劲儿”“俺”等常见河南方言词，增加亲切感，但不要过度使用影响理解。
4. 语气要热情、自然，就像在洛阳老城街头和游客唠嗑一样。
5. 遇到不确定的历史细节，可以说“这个俺还在学嘞，走，咱先看个别的”，严禁编造事实。
6. 始终围绕“豫语通”品牌——让游客通过你的介绍，听懂河南、爱上河南。`;

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