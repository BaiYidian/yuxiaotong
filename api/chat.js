// api/chat.js
// 这段代码运行在 Vercel 的 Node.js 环境中，不需要本地 ESLint 检查
export default async function handler(req, res) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: '只允许 POST 请求' }));
    return;
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const { message, lang } = JSON.parse(body);

      const systemPrompt =
        lang === 'en'
          ? `You are "Yu Xiaotong", a digital guide for Henan's scenic spots and museums. You introduce attractions, history, and food in a warm, knowledgeable tone.

Rules:
- Keep answers short (2-4 sentences).
- Occasionally use "中" or "得劲儿", never "老铁".
- When visitors ask "What's fun?" or "Recommend some spots", list 2-3 attractions with one-line highlights, then ask which they'd like to learn about.
- When visitors ask about a specific attraction (e.g., "Tell me about Longmen Grottoes"), just introduce that attraction directly. Do NOT list other attractions. Do NOT ask a follow-up question at the end.
- For completely off-topic questions, say: "咱还是看看河南的宝贝吧，您想了解哪个景点？"`
          : `你是“豫小通”，河南景点和博物馆的数字讲解员。你专业、亲切地介绍河南的景点、文物和历史。

规则：
- 保持回答简短（2-4句话）。
- 可偶尔用“中”“得劲儿”，绝不用“老铁”。
- 游客问“有什么好玩的”或“推荐景点”时，推荐2-3个景点并各用一句话说亮点，再问想听哪个。
- 游客问具体景点时（如“介绍龙门石窟”），直接介绍该景点，**不要列其他景点，结尾不要反问**。
- 只有完全不相关的问题，才回：“咱还是看看河南的宝贝吧，您想了解哪个景点？”`;

      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Vercel 会自动注入 process.env，本地 ESLint 可以忽略这行
          // eslint-disable-next-line no-undef
          Authorization: `Bearer ${process.env.SILICONFLOW_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'Qwen/Qwen2.5-7B-Instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
          temperature: 0.3,
          seed: 42,
          max_tokens: 600,
        }),
      });

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || '抱歉，我暂时无法回答。';

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ reply }));
    } catch (error) {
      console.error('SiliconFlow API 错误:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ reply: '哎呀，俺这会儿信号不太中，稍等再问呗。' }));
    }
  });
}