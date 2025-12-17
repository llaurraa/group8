/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Environment } from './components/World/Environment';
import { Player } from './components/World/Player';
import { LevelManager } from './components/World/LevelManager';
import { Effects } from './components/World/Effects';
import { HUD } from './components/UI/HUD';
import { useStore } from './store';
import { ZoneType } from './types';

// Dynamic Camera Controller
const CameraController = () => {
  const { camera, size } = useThree();
  const { laneCount, isSliding, currentZone, speed } = useStore();
  
  useFrame((state, delta) => {
    // Determine if screen is narrow (mobile portrait)
    const aspect = size.width / size.height;
    const isMobile = aspect < 1.2;

    const extraLanes = Math.max(0, laneCount - 3);

    // --- Dynamic Factors ---
    // 1. Zone Influence
    let zoneYOffset = 0;
    let zoneZOffset = 0;
    let targetFOV = 60;

    // Only apply special camera for Danger zone (tight/fast feel)
    // Safe Zone now uses standard camera (removed wide shot)
    if (currentZone === ZoneType.DANGER) {
        // Tight, fast shot for Danger Zone
        zoneYOffset = -1.0;
        zoneZOffset = -1.5;
        targetFOV = 65; // Slightly wider for speed sensation
    }

    // 2. Action Influence (Sliding)
    const slideOffset = isSliding ? -2.0 : 0;

    // 3. Speed Influence (Field of View)
    // As speed increases, widen FOV slightly for "warp speed" effect
    const speedFOVBonus = (speed > 30) ? (speed - 30) * 0.3 : 0;

    // --- Calculate Final Targets ---
    const heightFactor = isMobile ? 2.0 : 0.5;
    const distFactor = isMobile ? 4.5 : 1.0;

    const baseY = 5.5 + (extraLanes * heightFactor);
    const baseZ = 8.0 + (extraLanes * distFactor);

    const targetY = baseY + zoneYOffset + slideOffset;
    const targetZ = baseZ + zoneZOffset;

    const targetPos = new THREE.Vector3(0, targetY, targetZ);
    
    // Smoothly interpolate camera position
    camera.position.lerp(targetPos, delta * 2.0);
    
    // Smoothly interpolate FOV
    if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFOV + speedFOVBonus, delta * 1.5);
        camera.updateProjectionMatrix();
    }
    
    // Look Target
    // Standard look ahead, slightly closer in Danger for intensity
    const lookZ = -30;
    camera.lookAt(0, 0, lookZ); 
  });
  
  return null;
};

function Scene() {
  return (
    <>
        <Environment />
        <group>
            {/* Attach a userData to identify player group for LevelManager collision logic */}
            <group userData={{ isPlayer: true }} name="PlayerGroup">
                 <Player />
            </group>
            <LevelManager />
        </group>
        <Effects />
    </>
  );
}

function App() {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      <HUD />
      <Canvas
        shadows
        dpr={[1, 1.5]} 
        gl={{ antialias: false, stencil: false, depth: true, powerPreference: "high-performance" }}
        // Initial camera, matches the controller base
        camera={{ position: [0, 5.5, 8], fov: 60 }}
      >
        <CameraController />
        <Suspense fallback={null}>
            <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;