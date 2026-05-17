// hooks/useSpeechRecognition.js
import { useState, useEffect, useRef, useCallback } from "react";

export function useSpeechRecognition(lang = "zh-CN") {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);

  // ✅ 在 state 初始化时，同步判断浏览器是否支持语音识别
  //    这样就不会在 useEffect 里触发同步 setState 了
  const [error, setError] = useState(() => {
    if (typeof window === "undefined") return null;
    const SpeechRecognition = window["SpeechRecognition"] || window["webkitSpeechRecognition"];
    return SpeechRecognition ? null : "浏览器不支持语音识别，请使用 Chrome 或 Edge";
  });

  const recognitionRef = useRef(null);

  useEffect(() => {
    // 如果初始化时已确定不支持，不再继续
    if (error) return;

    const SpeechRecognition = window["SpeechRecognition"] || window["webkitSpeechRecognition"];
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = lang;

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
    };

    // 这里的 setState 是在事件回调中，属于异步，不是 effect 同步调用，安全
    recognition.onerror = (event) => {
      setError(`语音识别失败: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [lang, error]);

  const start = useCallback(() => {
    if (recognitionRef.current) {
      setTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const resetTranscript = () => setTranscript("");

  return { transcript, isListening, start, stop, resetTranscript, error };
}