// 如果视频在 public 文件夹，这样导入：
import videoSrc from "/longmen-bg.mp4";

export default function BackgroundVideo() {
  return (
    <video
      src={videoSrc}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster={videoSrc + "?poster"} // 可选：用视频第一帧做占位
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        objectFit: "cover",
        zIndex: 0,
        filter: "brightness(0.6) contrast(1.3) sepia(0.15)",
        pointerEvents: "none",
      }}
    />
  );
}