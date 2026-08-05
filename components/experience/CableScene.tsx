"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CatmullRomCurve3, MathUtils, TubeGeometry, Vector2, Vector3, type Group } from "three";

function CableSculpture() {
  const groupRef = useRef<Group>(null);
  const pointerTarget = useRef(new Vector2());
  const { invalidate, viewport } = useThree();

  useEffect(() => {
    const settleAtCenter = () => {
      pointerTarget.current.set(0, 0);
      invalidate();
    };
    const followPointer = (event: PointerEvent) => {
      pointerTarget.current.set(
        MathUtils.clamp((event.clientX / window.innerWidth) * 2 - 1, -1, 1),
        MathUtils.clamp(1 - (event.clientY / window.innerHeight) * 2, -1, 1),
      );
      invalidate();
    };

    window.addEventListener("pointermove", followPointer, { passive: true });
    window.addEventListener("pointercancel", settleAtCenter);
    window.addEventListener("blur", settleAtCenter);
    return () => {
      window.removeEventListener("pointermove", followPointer);
      window.removeEventListener("pointercancel", settleAtCenter);
      window.removeEventListener("blur", settleAtCenter);
    };
  }, [invalidate]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const target = pointerTarget.current;
    group.rotation.x = MathUtils.damp(group.rotation.x, -0.08 + target.y * 0.14, 5, delta);
    group.rotation.y = MathUtils.damp(group.rotation.y, target.x * 0.2, 5, delta);
    group.rotation.z = MathUtils.damp(group.rotation.z, -0.08 - target.x * 0.055, 5, delta);
    group.position.x = MathUtils.damp(group.position.x, target.x * 0.12, 4, delta);
    group.position.y = MathUtils.damp(group.position.y, target.y * 0.07, 4, delta);

    const stillMoving =
      Math.abs(group.rotation.x - (-0.08 + target.y * 0.14)) > 0.0003 ||
      Math.abs(group.rotation.y - target.x * 0.2) > 0.0003 ||
      Math.abs(group.rotation.z - (-0.08 - target.x * 0.055)) > 0.0003 ||
      Math.abs(group.position.x - target.x * 0.12) > 0.0003 ||
      Math.abs(group.position.y - target.y * 0.07) > 0.0003;

    if (stillMoving) invalidate();
  });

  const geometry = useMemo(() => {
    const curve = new CatmullRomCurve3(
      [
        new Vector3(-2.75, 0.58, -0.05),
        new Vector3(-1.68, 1.18, 0.1),
        new Vector3(-0.28, 0.45, 0.34),
        new Vector3(1.58, 1.08, 0.05),
        new Vector3(2.72, 0.12, 0.27),
        new Vector3(1.28, -0.76, 0.08),
        new Vector3(-0.52, -0.16, 0.4),
        new Vector3(-2.48, -0.8, 0.04),
      ],
      true,
      "catmullrom",
      0.42,
    );
    return new TubeGeometry(curve, 144, 0.085, 12, true);
  }, []);

  const innerGeometry = useMemo(() => {
    const curve = new CatmullRomCurve3(
      [
        new Vector3(-2.8, 0.55, 0.03),
        new Vector3(-1.7, 1.14, 0.18),
        new Vector3(-0.3, 0.42, 0.42),
        new Vector3(1.55, 1.05, 0.13),
        new Vector3(2.68, 0.1, 0.35),
        new Vector3(1.25, -0.73, 0.16),
        new Vector3(-0.52, -0.13, 0.48),
        new Vector3(-2.45, -0.77, 0.12),
      ],
      true,
      "catmullrom",
      0.42,
    );
    return new TubeGeometry(curve, 144, 0.025, 7, true);
  }, []);

  const scale = Math.max(0.76, Math.min(1.3, viewport.width / 7));

  return (
    <group ref={groupRef} scale={scale} rotation={[-0.08, 0, -0.08]}>
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          clearcoat={1}
          clearcoatRoughness={0.08}
          color="#6d16ff"
          emissive="#8b18ff"
          emissiveIntensity={0.6}
          metalness={0.15}
          roughness={0.13}
          transmission={0.28}
          transparent
          opacity={0.94}
        />
      </mesh>
      <mesh geometry={innerGeometry}>
        <meshStandardMaterial color="#ff4ad8" emissive="#ff1694" emissiveIntensity={1.8} />
      </mesh>
      <mesh position={[-2.12, -0.41, 0.24]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshPhysicalMaterial
          color="#caff00"
          emissive="#89ff00"
          emissiveIntensity={0.7}
          metalness={0.05}
          roughness={0.1}
          transmission={0.22}
        />
      </mesh>
      <mesh position={[2.1, 0.53, 0.27]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshPhysicalMaterial
          color="#caff00"
          emissive="#89ff00"
          emissiveIntensity={0.7}
          metalness={0.05}
          roughness={0.1}
          transmission={0.22}
        />
      </mesh>
      <mesh position={[1.58, -0.72, 0.22]} rotation={[0.2, 0.12, 1.2]}>
        <cylinderGeometry args={[0.15, 0.15, 0.42, 14, 1, true]} />
        <meshStandardMaterial color="#d6d2ca" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

export function CableScene() {
  return (
    <Canvas
      camera={{ fov: 40, position: [0, 0, 5.1] }}
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      performance={{ debounce: 240, max: 1, min: 0.6 }}
    >
      <ambientLight intensity={1.1} />
      <pointLight color="#ff72da" intensity={24} position={[-2.8, 1.6, 3]} />
      <pointLight color="#6e30ff" intensity={28} position={[2.8, -1.2, 2.5]} />
      <directionalLight color="#ffffff" intensity={2.8} position={[0, 3, 4]} />
      <CableSculpture />
    </Canvas>
  );
}
