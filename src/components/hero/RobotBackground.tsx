"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, Float, PresentationControls, ContactShadows } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";

function Model() {
  const { scene } = useGLTF("/models/robot.glb");
  const modelRef = useRef<THREE.Group>(null);

  // Gentle floating and rotation animation
  useFrame((state) => {
    if (!modelRef.current) return;
    const t = state.clock.getElapsedTime();
    modelRef.current.rotation.y = Math.sin(t / 4) * 0.2;
    modelRef.current.position.y = Math.sin(t / 2) * 0.1 - 1.5;
  });

  return (
    <primitive 
      ref={modelRef} 
      object={scene} 
      scale={3.8} 
      position={[0, -2.2, 0]} 
      rotation={[0, -Math.PI / 4, 0]}
    />
  );
}

export const RobotBackground = () => {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        shadows
        camera={{ position: [0, 0, 5], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <Environment preset="city" />
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00f0ff" />
          
          <PresentationControls
            global
            snap
            rotation={[0, 0.3, 0]}
            polar={[-Math.PI / 3, Math.PI / 3]}
            azimuth={[-Math.PI / 1.4, Math.PI / 3]}
          >
            <Float
              speed={1.5} 
              rotationIntensity={0.5} 
              floatIntensity={0.5}
            >
              <Model />
            </Float>
          </PresentationControls>

          <ContactShadows
            position={[0, -2, 0]}
            opacity={0.4}
            scale={10}
            blur={2.5}
            far={4}
          />
        </Suspense>
      </Canvas>
      
      {/* Dark overlay to ensure text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/80 pointer-events-none" />
    </div>
  );
};

useGLTF.preload("/models/robot.glb");
