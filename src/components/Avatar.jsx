import { useRef, useEffect, useMemo } from "react";
import { useFBX } from "@react-three/drei";
import * as THREE from "three";

const MODEL_MAP = {
  idle: "/yuxiaotong.fbx",
  wave: "/animations/Waving.fbx",
  dance: "/animations/Hip Hop Dancing.fbx",
};

const GLOBAL_SCALE = 0.01;

export default function Avatar({ currentAction = "idle", onActionEnd }) {
  const groupRef = useRef(null);
  const breathRef = useRef(null);
  const mixerRef = useRef(null);

  const modelPath = MODEL_MAP[currentAction] || MODEL_MAP.idle;
  const model = useFBX(modelPath);
  const clip = useMemo(() => model?.animations?.[0] || null, [model]);

  // ✅ 动态Y轴：挥手时降低整个人物，让手部进入合理视野
  const positionY = useMemo(() => {
    return currentAction === "wave" ? 0.2 : 0.5;
  }, [currentAction]);

  // 设置材质
  useEffect(() => {
    if (!model) return;
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.side = THREE.DoubleSide;
        child.material.needsUpdate = true;
        child.material.roughness = 0.5;
        child.material.metalness = 0.2;
      }
    });
  }, [model]);

  // 动画控制
  useEffect(() => {
    if (!breathRef.current || !model) return;

    if (mixerRef.current) {
      mixerRef.current.stopAllAction();
      mixerRef.current.uncacheRoot(mixerRef.current.getRoot());
    }

    const mixer = new THREE.AnimationMixer(breathRef.current);
    mixerRef.current = mixer;

    if (clip) {
      const action = mixer.clipAction(clip);
      action.reset();

      if (currentAction === "idle") {
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.play();
      } else {
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
        action.play();

        const onFinished = () => {
          if (onActionEnd) onActionEnd();
          mixer.removeEventListener("finished", onFinished);
        };
        mixer.addEventListener("finished", onFinished);
      }
    } else if (currentAction !== "idle") {
      const timer = setTimeout(() => {
        if (onActionEnd) onActionEnd();
      }, 2000);
      return () => clearTimeout(timer);
    }

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(mixer.getRoot());
    };
  }, [model, clip, currentAction, onActionEnd]);

  // Idle呼吸动画（仅在没有其他动画时）
  useEffect(() => {
    if (currentAction !== "idle" || clip) return;

    let animId;
    const baseY = 0;   // ✅ 呼吸时基于当前 group 位置（即 positionY）叠加微小偏移
    const animate = () => {
      const t = performance.now() / 1000;
      if (breathRef.current) {
        // 注意：breathRef是 group 的子级，它的y是相对于父级 group 的偏移
        breathRef.current.position.y = baseY + Math.sin(t * 1.4) * 0.015;
      }
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [currentAction, clip]);

  // 全局动画循环
  useEffect(() => {
    let rafId;
    let prevTime = performance.now();

    const loop = () => {
      const now = performance.now();
      const delta = (now - prevTime) / 1000;
      prevTime = now;
      mixerRef.current?.update(delta);
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <group ref={groupRef} position={[0, positionY, 0]} scale={GLOBAL_SCALE}>
      <group ref={breathRef}>
        <primitive object={model} />
      </group>
    </group>
  );
}