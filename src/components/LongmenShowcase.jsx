// src/components/LongmenShowcase.jsx
import { useState, useRef, useEffect } from 'react';
import { LANG_CONFIG } from '../config/longmenConfig';

const LUSHENA_IMG = "/lushena.jpg";

export default function LongmenShowcase({ isOpen, onClose, setIsTalking }) {
  const [lang, setLang] = useState('zh'); // 默认选中中文
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const currentContent = LANG_CONFIG[lang];

  useEffect(() => {
    if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      try {
        audioRef.current.currentTime = 0;
      } catch (error) {
        console.warn("重置音频时间失败:", error);
      }
      setIsPlaying(false);
      if (setIsTalking) setIsTalking(false);
    }
  }, [isOpen, setIsTalking]);

  if (!isOpen) return null;

  const toggleAudio = () => {
    if (!currentContent.audio) {
      alert("该语种暂未提供专家原声，您可通过聊天让数字人为您播报。");
      return;
    }

    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
      if (setIsTalking) setIsTalking(false);
    } else {
      if (window.speechSynthesis) window.speechSynthesis.cancel();

      const audio = new Audio(currentContent.audio);
      audioRef.current = audio;
      setIsPlaying(true);
      if (setIsTalking) setIsTalking(true);

      audio.onended = () => { setIsPlaying(false); if (setIsTalking) setIsTalking(false); };
      audio.onerror = () => { setIsPlaying(false); if (setIsTalking) setIsTalking(false); };

      audio.play().catch(e => {
        console.warn("音频播放被拦截", e);
        setIsPlaying(false);
        if (setIsTalking) setIsTalking(false);
      });
    }
  };

  const handleLangChange = (newLang) => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (setIsTalking) setIsTalking(false);
    }
    setLang(newLang);
  };

  return (
    <div className="longmen-showcase-panel glass-panel">
      <div className="showcase-header">
        <img src={LUSHENA_IMG} alt="龙门石窟奉先寺" />
        <button className="showcase-close-btn" onClick={onClose}>×</button>
      </div>
      <div className="showcase-body">

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ margin: 0, color: '#D4AF37' }}>
            {currentContent.title}
          </h2>
          {/* 🌟 动态遍历配置文件渲染按钮，彻底告别写死 */}
          <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', padding: '2px' }}>
            {Object.values(LANG_CONFIG).map((cfg) => (
              <button
                key={cfg.id}
                onClick={() => handleLangChange(cfg.id)}
                style={{
                  background: lang === cfg.id ? '#D4AF37' : 'transparent',
                  color: lang === cfg.id ? '#000' : '#fff',
                  border: 'none', padding: '4px 8px', borderRadius: '4px',
                  cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        <p style={{ minHeight: '85px', fontSize: '0.9rem', lineHeight: '1.6', color: '#ddd' }}>
          {currentContent.desc}
        </p>

        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
          {currentContent.audio && (
            <button
              className="cultural-btn"
              style={{ width: '100%', background: isPlaying ? 'rgba(255,68,68,0.2)' : 'rgba(255,255,255,0.1)', borderColor: isPlaying ? '#ff4444' : 'var(--glass-border)' }}
              onClick={toggleAudio}
            >
              {isPlaying ? '⏹️ 停止播放原声' : `🎧 播放${currentContent.label}专家原声`}
            </button>
          )}
          <button className="cultural-btn primary" style={{ width: '100%' }}>
            📍 进入 3D 虚拟漫游 (敬请期待)
          </button>
        </div>
      </div>
    </div>
  );
}