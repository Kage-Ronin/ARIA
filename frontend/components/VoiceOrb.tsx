"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

interface OrbMeshProps {
  state: OrbState;
  amplitude: number;
}

// Cyan for input states, amber for output
const STATE_COLORS: Record<OrbState, THREE.Color> = {
  idle:      new THREE.Color(0.05, 0.22, 0.35),
  listening: new THREE.Color(0.0,  0.82, 1.0),
  thinking:  new THREE.Color(0.15, 0.45, 0.95),
  speaking:  new THREE.Color(1.0,  0.65, 0.18),
};

const VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  uniform float uAmplitude;
  uniform float uTime;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec3 pos = position;
    float wave = sin(pos.y * 7.0 + uTime * 2.5) * cos(pos.x * 5.0 + uTime * 1.8);
    pos += normal * uAmplitude * 0.18 * wave;
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const FRAG = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  uniform vec3 uColor;
  uniform float uEmissive;
  uniform vec3 cameraPosition;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.2);
    vec3 col = mix(uColor * 0.04, uColor, fresnel) + uColor * uEmissive;
    float alpha = clamp(fresnel * 0.9 + 0.06, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
`;

function OrbMesh({ state, amplitude }: OrbMeshProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat  = useRef<THREE.ShaderMaterial>(null);
  const t    = useRef(0);

  const uniforms = useMemo(
    () => ({
      uColor:     { value: new THREE.Color().copy(STATE_COLORS.idle) },
      uAmplitude: { value: 0 },
      uEmissive:  { value: 0.08 },
      uTime:      { value: 0 },
    }),
    []
  );

  useFrame((_, delta) => {
    t.current += delta;
    const u = mat.current?.uniforms;
    if (!u) return;

    // Smooth colour transition
    u.uColor.value.lerp(STATE_COLORS[state], 0.04);

    // Target amplitude: idle = slow breathe, others = live signal
    const targetAmp =
      state === "idle"
        ? 0.04 + Math.sin(t.current * 0.7) * 0.025
        : amplitude * 0.85 + 0.05;
    u.uAmplitude.value = THREE.MathUtils.lerp(u.uAmplitude.value, targetAmp, 0.14);

    // Target emissive
    const targetEmissive =
      state === "idle"      ? 0.07
      : state === "thinking" ? 0.28
      : 0.35 + amplitude * 0.7;
    u.uEmissive.value = THREE.MathUtils.lerp(u.uEmissive.value, targetEmissive, 0.06);

    u.uTime.value = t.current;

    // Subtle rotation when thinking
    if (mesh.current && state === "thinking") {
      mesh.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[1.35, 96, 96]} />
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

interface VoiceOrbProps {
  state: OrbState;
  amplitude: number;
  className?: string;
}

export default function VoiceOrb({ state, amplitude, className }: VoiceOrbProps) {
  return (
    <div className={className} style={{ userSelect: "none" }}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 42 }}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        style={{ background: "transparent" }}
      >
        <OrbMesh state={state} amplitude={amplitude} />
      </Canvas>
    </div>
  );
}
