// src/components/ChatPanel.jsx
import { useState, useEffect, useCallback } from "react";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { sendToLLM } from "../services/llm";

const TEXTS = {
  dialect: {
    title: "智能交互导览（中原方言）",
    placeholder: "有啥想问嘞？或者点🎤说话",
    send: "发送",
    waveBtn: "挥手迎宾",
    danceBtn: "来段潮舞",
  },
  zh: {
    title: "智能交互导览",
    placeholder: "提问龙门石窟... 或点🎤说话",
    send: "发送",
    waveBtn: "挥手迎宾",
    danceBtn: "动感舞步",
  },
  en: {
    title: "Smart Guide",
    placeholder: "Ask about Longmen Grottoes... or tap 🎤",
    send: "Send",
    waveBtn: "Wave Greeting",
    danceBtn: "Hip Hop Dance",
  },
};

export default function ChatPanel({ setIsTalking, setCurrentAction, langMode }) {
  const t = TEXTS[langMode] || TEXTS.zh;

  // 根据语言切换语音识别语言
  const recognitionLang = langMode === "en" ? "en-US" : "zh-CN";
  const { transcript, isListening, start, stop, resetTranscript, error } =
    useSpeechRecognition(recognitionLang);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
         langMode === "en"
        ? "Welcome to Henan! I'm Yu Xiaotong, your personal tour guide."
        : "中不中？欢迎来河南！我是豫小通，你的专属向导",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // 语音合成函数：用浏览器原生 API 朗读文本
  const speak = useCallback(
    (text) => {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel(); // 停止当前朗读
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langMode === "en" ? "en-US" : "zh-CN";
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      utterance.onstart = () => setIsTalking(true);
      utterance.onend = () => setIsTalking(false);
      utterance.onerror = () => setIsTalking(false);
      window.speechSynthesis.speak(utterance);
    },
    [langMode, setIsTalking]
  );

  // 发送消息（文字或语音转文字）
  const handleSend = useCallback(
    async (text) => {
      const msg = (typeof text === "string" ? text : input).trim();
      if (!msg || loading) return;

      const userMsg = { role: "user", text: msg };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);
      setIsTalking(true);

      try {
        const reply = await sendToLLM(msg, langMode);
        setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
        // ✅ 收到回复后立即朗读
        speak(reply);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: "服务暂时不可用，请稍后重试。" },
        ]);
      } finally {
        setLoading(false);
        // 注意：setIsTalking(false) 已由 speak 的 onend/onerror 处理
      }
    },
    [input, loading, langMode, setIsTalking, speak]
  );

  // 当语音识别到文字后自动发送
  useEffect(() => {
    if (transcript) {
      const sendRecognized = async () => {
        await handleSend(transcript);
        resetTranscript();
      };
      sendRecognized();
    }
  }, [transcript, handleSend, resetTranscript]);

  const handleAction = (action) => {
    setCurrentAction(action);
    setIsTalking(true);
  };

  const micStyle = {
    padding: "0 16px",
    background: isListening ? "#ff4444" : "#D4AF37",
    border: "none",
    borderRadius: 10,
    color: isListening ? "#fff" : "#000",
    fontWeight: "bold",
    fontSize: 16,
    cursor: "pointer",
    transition: "all 0.2s",
    animation: isListening ? "micPulse 1s infinite" : "none",
  };

  return (
    <>
      <h3>{t.title}</h3>
      <div className="messages-box">
        {messages.map((msg, i) => (
          <div key={i} className={`msg-bubble ${msg.role}`}>
            {msg.text}
          </div>
        ))}
        {loading && <div className="msg-bubble assistant">豫小通思考中...</div>}
      </div>

      {error && <div style={{ color: "#ff8888", fontSize: 12 }}>{error}</div>}

      <div className="input-wrap">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.placeholder}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={() => handleSend()}>{t.send}</button>
        <button onClick={isListening ? stop : start} style={micStyle}>
          {isListening ? "⏹️" : "🎤"}
        </button>
      </div>

      <div className="button-group">
        <button onClick={() => handleAction("wave")}>{t.waveBtn}</button>
        <button onClick={() => handleAction("dance")}>{t.danceBtn}</button>
      </div>

      <style>{`
        @keyframes micPulse {
          0% { box-shadow: 0 0 0 0 rgba(255,68,68,0.7); }
          70% { box-shadow: 0 0 0 10px rgba(255,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,68,68,0); }
        }
      `}</style>
    </>
  );
}