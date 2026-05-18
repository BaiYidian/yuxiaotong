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

      // ✅ 已更新：常驻景点/博物馆的数字人讲解员提示词
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