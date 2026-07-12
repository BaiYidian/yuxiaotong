// src/components/ChatPanel.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { sendToLLM } from "../services/llm";
import { LANG_CONFIG } from "../config/longmenConfig";
export default function ChatPanel({ setIsTalking, setCurrentAction, onOpenLongmen }) {
  const { transcript, isListening, start, stop, resetTranscript, error } = useSpeechRecognition("zh-CN");
  const expertAudioRef = useRef(null);
  const messagesEndRef = useRef(null); // 🌟 优化：用于自动滚动到底部

  const [messages, setMessages] = useState([
    { role: "assistant", text: "中不中？欢迎来河南！我是豫小通。您可以随时打字或语音向我提问。" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // 每次消息更新，自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const detectLanguageForTTS = (text) => {
    if (/[\uAC00-\uD7AF]/.test(text)) return 'ko-KR';
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja-JP';
    if (/[\u4E00-\u9FFF]/.test(text)) return 'zh-CN';
    return 'en-US';
  };

  // 全局强制停止语音函数 (防翻车神器)
  const stopAudio = useCallback(() => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (expertAudioRef.current) {
      expertAudioRef.current.pause();
      try {
        expertAudioRef.current.currentTime = 0;
      } catch (error) {
        console.warn("重置音频时间失败:", error);
      }
    }
    setIsTalking(false);
  }, [setIsTalking]);

  // 播放机器语音 (TTS)
  const speakTTS = useCallback(async (text) => {
    setIsTalking(true);
    try {
      const apiKey = import.meta.env.VITE_SILICONFLOW_API_KEY;
      if (!apiKey) throw new Error("No API Key");

      // 语音请求也必须和 LLM 一样走 Vite 代理，防止被浏览器跨域拦截！
      const isProduction = import.meta.env.PROD;
      const apiUrl = isProduction
        ? 'https://api.siliconflow.cn/v1/audio/speech'
        : '/api/siliconflow/audio/speech';

const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // 🌟 回归最稳定且您账号确认有权限的模型
          model: "FunAudioLLM/CosyVoice2-0.5B",
          // 🌟 核心破局点：音色 ID 必须包含模型前缀！
          voice: "FunAudioLLM/CosyVoice2-0.5B:anna",
          input: text,
          response_format: "mp3"
        })
      });

      // 精准捕获 API 报错信息
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API 拒绝了请求: ${response.status} - ${errorData}`);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);

      expertAudioRef.current = audio;
      audio.onended = () => { setIsTalking(false); URL.revokeObjectURL(audioUrl); };
      audio.onerror = () => { setIsTalking(false); URL.revokeObjectURL(audioUrl); };

      await audio.play().catch(e => {
          console.warn("浏览器拦截了音频播放", e);
          setIsTalking(false);
      });

    } catch (err) {
      // 在 F12 控制台打印出最真实的死因
      console.warn("云端 TTS 调用失败，已降级为原生语音。具体原因:", err.message || err);

      if (!window.speechSynthesis) { setIsTalking(false); return; }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = detectLanguageForTTS(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      utterance.onstart = () => setIsTalking(true);
      utterance.onend = () => setIsTalking(false);
      utterance.onerror = () => setIsTalking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, [setIsTalking]);

  // 播放专家音频
  const playExpertAudio = useCallback((audioPath) => {
    stopAudio();
    setIsTalking(true);
    const audio = new Audio(audioPath);
    expertAudioRef.current = audio;
    audio.onended = () => setIsTalking(false);
    audio.onerror = () => setIsTalking(false);
    audio.play().catch(e => {
        console.warn("音频拦截", e);
        setIsTalking(false);
    });
  }, [setIsTalking, stopAudio]);

const handleSend = useCallback(async (text) => {
    const msg = (typeof text === "string" ? text : input).trim();
    if (!msg || loading) return;

    stopAudio();

    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);
    setIsTalking(true);

    try {
      const reply = await sendToLLM(msg);
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);

      // 🌟 核心改进：动态多语种打断策略
      let expertAudioToPlay = null;
      let isAIReplyingLongmen = false;

      // 1. 判断 AI 提到龙门石窟了没？(遍历所有语言的关键词)
      const allKeywords = Object.values(LANG_CONFIG).flatMap(cfg => cfg.keywords);
      isAIReplyingLongmen = allKeywords.some(kw => reply.includes(kw));

      // 2. 如果提到了，判断这段回复是什么语言，有没有对应的专家音频？
      if (isAIReplyingLongmen) {
        for (const key in LANG_CONFIG) {
          const config = LANG_CONFIG[key];
          // 如果该语言配有录音，且回复文本命中了该语言的正则
          if (config.audio && config.detectRegex.test(reply)) {
            expertAudioToPlay = config.audio;
            break; // 找到了对应的专家音频，跳出循环
          }
        }
      }

      // 3. 执行播放
      if (expertAudioToPlay) {
        playExpertAudio(expertAudioToPlay); // 播放韩语/日语专家录音
      } else {
        speakTTS(reply); // 没匹配上录音，走普通 AI 语音合成 (比如中文)
      }

      // 智能长卷触发条件（判断用户意图）
      const isUserInterested = msg.includes("龙门") || msg.includes("石窟") || msg.includes("大佛") || msg.includes("推荐");

      if (isUserInterested && isAIReplyingLongmen) {
        setTimeout(() => onOpenLongmen(), 1200);
      }

    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "网络好像开小差了，请稍后再试。" }]);
      setIsTalking(false);
    } finally {
      setLoading(false);
    }
  }, [input, loading, setIsTalking, speakTTS, playExpertAudio, onOpenLongmen, stopAudio]);

  useEffect(() => {
    if (transcript) {
      const processTranscript = async () => {
        await handleSend(transcript);
        resetTranscript();
      };
      processTranscript();
    }
  }, [transcript, handleSend, resetTranscript]);

  const micStyle = {
    animation: isListening ? "pulse 1s infinite" : "none",
    backgroundColor: isListening ? "rgba(255, 68, 68, 0.8)" : "",
    borderColor: isListening ? "#ff4444" : "",
    color: isListening ? "#fff" : ""
  };

  return (
    <div className="chat-panel glass-panel">
      <h3>中原数智使者 · 豫小通</h3>
      <div className="messages-box">
        {messages.map((msg, i) => (
          <div key={i} className={`msg-bubble ${msg.role}`}>
            {msg.text}
          </div>
        ))}
        {loading && <div className="msg-bubble assistant">小通思考中...</div>}
        <div ref={messagesEndRef} />
      </div>

      {error && <div style={{ color: "#ff8888", fontSize: 12, marginBottom: 5 }}>{error}</div>}

      <div className="input-wrap">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="支持多语种提问..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button className="cultural-btn" onClick={() => handleSend()}>发送</button>
        <button className="cultural-btn" onClick={isListening ? stop : start} style={{ ...micStyle, padding: '8px 12px' }} title="语音输入">
          {isListening ? "⏹️" : "🎤"}
        </button>
        <button className="cultural-btn" onClick={stopAudio} style={{ padding: '8px 12px', borderColor: 'rgba(255,255,255,0.2)' }} title="强制停止语音">
          🔇
        </button>
      </div>

      <div className="button-group">
        <button className="cultural-btn" onClick={() => {setCurrentAction("wave"); setIsTalking(true);}}>作揖迎宾</button>
        <button className="cultural-btn" onClick={() => {setCurrentAction("dance"); setIsTalking(true);}}>数字国潮</button>
      </div>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255,68,68,0.7); }
          70% { box-shadow: 0 0 0 10px rgba(255,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,68,68,0); }
        }
      `}</style>
    </div>
  );
}