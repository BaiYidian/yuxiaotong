import React, { useState, Suspense, useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, Environment } from "@react-three/drei";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Avatar from "./components/Avatar";
import ChatPanel from "./components/ChatPanel";
import BackgroundVideo from "./components/BackgroundVideo";
import "./App.css";

function Loading() {
  return (
    <Html center>
      <div style={{ color: "#D4AF37", fontSize: 18, textAlign: "center" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid rgba(212,175,55,0.2)",
            borderTop: "4px solid #D4AF37",
            borderRadius: "50%",
            margin: "0 auto 20px",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ letterSpacing: "2px" }}>豫小通正在唤醒中...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </Html>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "#050110",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
          }}
        >
          <h2 style={{ color: "#D4AF37", marginBottom: "20px" }}>渲染异常</h2>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "12px 24px",
              background: "linear-gradient(135deg, #D4AF37 0%, #F5E6A3 100%)",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              color: "#000",
            }}
          >
            刷新页面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Controls() {
  const { camera, gl } = useThree();
  const controlsRef = useRef(null);

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0.9, 0);
    controls.minDistance = 2.5;
    controls.maxDistance = 5.5;
    controls.minPolarAngle = Math.PI / 3.2;
    controls.maxPolarAngle = Math.PI / 1.8;
    controls.update();
    controlsRef.current = controls;

    return () => controls.dispose();
  }, [camera, gl]);

  return null;
}

export default function App() {
  const [, setIsTalking] = useState(false);          // ✅ 不接收 isTalking，消除警告
  const [currentAction, setCurrentAction] = useState("idle");
  const [langMode, setLangMode] = useState("dialect");

  const handleActionEnd = () => {
    setCurrentAction("idle");
    setIsTalking(false);
  };

  return (
    <>
      <BackgroundVideo />

      <div className="app-container">
        <div className="canvas-stage">
          <div className="brand-overlay">
            <h1>豫语通</h1>
          </div>

          <div
            style={{
              position: "absolute",
              top: 45,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 25,
              display: "flex",
              gap: 10,
              background: "rgba(10, 20, 40, 0.75)",
              padding: 8,
              borderRadius: 14,
              border: "1px solid rgba(212, 175, 55, 0.2)",
              backdropFilter: "blur(15px)",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
            }}
          >
            {["dialect", "zh", "en"].map((mode) => (
              <button
                key={mode}
                onClick={() => setLangMode(mode)}
                style={{
                  padding: "8px 18px",
                  background:
                    langMode === mode
                      ? "linear-gradient(135deg, #D4AF37 0%, #F5E6A3 100%)"
                      : "transparent",
                  color: langMode === mode ? "#000" : "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.25s",
                  fontSize: "14px",
                }}
              >
                {mode === "dialect" ? "中原方言" : mode === "zh" ? "普通话" : "English"}
              </button>
            ))}
          </div>

          <ErrorBoundary>
            <Canvas
              style={{ background: "transparent" }}
              camera={{ position: [0, 1.3, 4.2], fov: 45 }}
              gl={{
                antialias: true,
                alpha: true,
                failIfMajorPerformanceCaveat: false,
              }}
              dpr={[1, 1.5]}
              onCreated={({ gl }) => {
                gl.setClearColor(0x000000, 0);
              }}
            >
              <ambientLight intensity={0.65} />
              <directionalLight position={[2, 3, 2]} intensity={1.1} castShadow />

              <Suspense fallback={<Loading />}>
                <Environment
                  files="/studio.hdr"
                  background={false}
                  intensity={1.6}
                  blur={0.35}
                />
                <Avatar
                  currentAction={currentAction}
                  onActionEnd={handleActionEnd}
                />
              </Suspense>

              <Controls />
            </Canvas>
          </ErrorBoundary>
        </div>

        <div className="right-chat-area">
          <ChatPanel
            key={langMode}
            setIsTalking={setIsTalking}
            setCurrentAction={setCurrentAction}
            langMode={langMode}
          />
        </div>
      </div>
    </>
  );
}