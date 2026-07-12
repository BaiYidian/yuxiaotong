// src/App.jsx
import { useState, Suspense, useCallback, Component } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, Environment, OrbitControls } from "@react-three/drei";

import Avatar from "./components/Avatar";
import ChatPanel from "./components/ChatPanel";
import BackgroundVideo from "./components/BackgroundVideo";
import LongmenShowcase from "./components/LongmenShowcase";
import "./App.css";

function Loading() {
  return (
    <Html center>
      <div style={{ color: "#D4AF37", fontSize: 18, textAlign: "center", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
        <p style={{ letterSpacing: "2px" }}>豫小通正在唤醒中...</p>
      </div>
    </Html>
  );
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? (
      <div style={{ color: "white", textAlign: "center", marginTop: "40vh" }}>
        <h2 style={{ color: "#D4AF37" }}>模型加载出错</h2>
        <p>请检查 public 文件夹下的模型文件路径是否正确</p>
      </div>
    ) : this.props.children;
  }
}

export default function App() {
  const [currentAction, setCurrentAction] = useState("idle");
  const [isTalking, setIsTalking] = useState(false);
  const [longmenOpen, setLongmenOpen] = useState(false);

  const handleOpenLongmen = useCallback(() => {
    setLongmenOpen(true);
  }, []);

  const handleCloseLongmen = useCallback(() => {
    setLongmenOpen(false);
  }, []);

  const handleActionEnd = useCallback(() => {
    setCurrentAction("idle");
  }, []);

  return (
    <div className="app-container">
      <BackgroundVideo />

      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1 }}>
        <ErrorBoundary>
          <Canvas
            camera={{ position: [0, 1.3, 4.2], fov: 45 }}
            gl={{ alpha: true, antialias: true }}
            onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); }}
          >
            <ambientLight intensity={0.65} />
            <directionalLight position={[2, 3, 2]} intensity={1.1} castShadow />
            <Suspense fallback={<Loading />}>
              <Environment files="/studio.hdr" background={false} intensity={1.6} blur={0.35} />
              <Avatar
                currentAction={currentAction}
                isTalking={isTalking}
                onActionEnd={handleActionEnd}
              />
            </Suspense>
            <Controls />
          </Canvas>
        </ErrorBoundary>
      </div>

      {!longmenOpen && (
        <div className="longmen-trigger-badge" onClick={handleOpenLongmen}>
          龙门
        </div>
      )}

      {/* 龙门卡片：下发 setIsTalking 控制 3D 数字人 */}
      <LongmenShowcase
        isOpen={longmenOpen}
        onClose={handleCloseLongmen}
        setIsTalking={setIsTalking}
      />

      <ChatPanel
        setIsTalking={setIsTalking}
        setCurrentAction={setCurrentAction}
        onOpenLongmen={handleOpenLongmen}
      />
    </div>
  );
}

function Controls() {
  return (
    <OrbitControls
      enablePan={false}
      enableZoom={true}
      minDistance={2}
      maxDistance={6}
      target={[0, 1.2, 0]}
      maxPolarAngle={Math.PI / 2 + 0.1}
      minPolarAngle={Math.PI / 3}
    />
  );
}