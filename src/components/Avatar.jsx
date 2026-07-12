// src/components/Avatar.jsx
import { useRef, useEffect, useMemo } from "react";
import { useFBX } from "@react-three/drei";
import * as THREE from "three";

const MODEL_MAP = {
  idle: "/yuxiaotong.fbx",
  wave: "/Waving.fbx",
  dance: "/Hip Hop Dancing.fbx",
};

const GLOBAL_SCALE = 0.01;

export default function Avatar({ currentAction = "idle", isTalking, onActionEnd }) {
  const groupRef = useRef(null);
  const breathRef = useRef(null);
  const mixerRef = useRef(null);

  const modelPath = MODEL_MAP[currentAction] || MODEL_MAP.idle;
  const model = useFBX(modelPath);

  const clip = useMemo(() => {
    if (model && model.animations && model.animations.length > 0) {
      return model.animations[0];
    }
    return null;
  }, [model]);

  const positionY = useMemo(() => {
    return currentAction === "wave" ? 0.2 : 0.5;
  }, [currentAction]);

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
        action.setLoop(THREE.LoopOnce, 1);
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

  useEffect(() => {
    if (currentAction !== "idle") return;

    let animId;
    const baseY = 0;
    const animate = () => {
      const t = performance.now() / 1000;
      if (breathRef.current) {
        const amplitude = isTalking ? 0.025 : 0.015;
        const speed = isTalking ? 2.5 : 1.4;
        breathRef.current.position.y = baseY + Math.sin(t * speed) * amplitude;
      }
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [currentAction, isTalking]);

  useEffect(() => {
    let rafId;
    let prevTime = performance.now();
    const loop = () => {
      const now = performance.now();
      const delta = (now - prevTime) / 1000;
      prevTime = now;
      if (mixerRef.current) mixerRef.current.update(delta);
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