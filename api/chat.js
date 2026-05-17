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
          ? "You are Yu Xiaotong, a cultural ambassador of Luoyang. Answer travel questions in a warm, concise tone."
          : "你是‘豫小通’，洛阳数智文化使者。请用亲切的中原风格回答，简洁有趣，可适当用方言词。";

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
          temperature: 0.7,
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