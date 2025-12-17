/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';
import { ZoneType } from '../../types';

// --- Theme Configurations ---
const THEMES = {
    1: { // Olympus (Divine Blue/White)
        skyTop: '#0d47a1', 
        skyBottom: '#90caf9', 
        fogColor: '#0d47a1',
        lightColor: '#ffffff',
        ambientColor: '#e3f2fd',
        columnColor: '#f5f5f5', 
        floorColor: '#eceff1',
        floorRoughness: 0.1,
        borderColor: '#546e7a', 
        particleColor: '#e3f2fd', 
        flameColor: '#00b0ff' 
    },
    2: { // Underworld (Dark Red/Black) - Brightened for visibility
        skyTop: '#4a0000', 
        skyBottom: '#ef5350', 
        fogColor: '#3e2723', // Lighter fog to see ahead
        lightColor: '#ffcdd2', // Brighter light
        ambientColor: '#bcaaa4', // High ambient visibility
        columnColor: '#757575', 
        floorColor: '#5d4037', // Brown floor (distinct from black pits)
        floorRoughness: 0.8,
        borderColor: '#ff5722', 
        particleColor: '#ffab91', 
        flameColor: '#ff1744' 
    },
    3: { // Atlantis (Teal/Cyan)
        skyTop: '#004d40', 
        skyBottom: '#00bcd4', 
        fogColor: '#004d40',
        lightColor: '#80deea',
        ambientColor: '#006064',
        columnColor: '#00695c', 
        floorColor: '#00838f', 
        floorRoughness: 0.4,
        borderColor: '#ffd700', 
        particleColor: '#b2ebf2', 
        flameColor: '#00e5ff' 
    },
    4: { // Troy (Battlefield - Earthy/Orange/War)
        skyTop: '#3e2723',
        skyBottom: '#ff6f00',
        fogColor: '#3e2723',
        lightColor: '#ffcc80',
        ambientColor: '#5d4037',
        columnColor: '#8d6e63', // Sandstone
        floorColor: '#5d4037', // Dirt/Mud
        floorRoughness: 0.9,
        borderColor: '#212121', // Charred
        particleColor: '#ffcc80', // Dust
        flameColor: '#ff9800' // Fire
    },
    5: { // Chaos (Void - Purple/Magenta)
        skyTop: '#311b92',
        skyBottom: '#7c4dff',
        fogColor: '#311b92',
        lightColor: '#e040fb',
        ambientColor: '#4a148c',
        columnColor: '#12005e', // Dark Obsidian
        floorColor: '#1a1a1a', // Dark Grey instead of pure black to see pits
        floorRoughness: 0.2,
        borderColor: '#d500f9', // Neon Purple
        particleColor: '#e040fb', // Magic Sparks
        flameColor: '#d500f9' // Purple Fire
    }
};

const StarField: React.FC = () => {
  const count = 500;
  const meshRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 400;     
      pos[i * 3 + 1] = 50 + Math.random() * 100; 
      pos[i * 3 + 2] = -200 + Math.random() * 300; 
    }
    return pos;
  }, []);

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.5}
        color="#ffffff" 
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Divine Dust (Particles)
const DivineDust: React.FC<{ color: string }> = ({ color }) => {
  const speed = useStore(state => state.speed);
  const count = 200; 
  const meshRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;     
      pos[i * 3 + 1] = Math.random() * 20; 
      pos[i * 3 + 2] = -10 - Math.random() * 80; 
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    const activeSpeed = speed > 0 ? speed : 2; 

    for (let i = 0; i < count; i++) {
        let z = positions[i * 3 + 2];
        z += activeSpeed * delta * 0.5; 
        
        if (z > 10) {
            z = -80 - Math.random() * 20; 
            positions[i * 3] = (Math.random() - 0.5) * 60;
            positions[i * 3 + 1] = Math.random() * 20;
        }
        positions[i * 3 + 2] = z;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.25}
        color={color}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Greek Colonnade (Columns)
const GreekColonnade: React.FC<{ columnColor: string, flameColor: string }> = ({ columnColor, flameColor }) => {
    const speed = useStore(state => state.speed);
    const groupRef = useRef<THREE.Group>(null);
    const NUM_PAIRS = 8;
    const GAP = 40;
    
    // Column Geometry
    const COLUMN_GEO = new THREE.CylinderGeometry(1.2, 1.4, 14, 16);
    const BASE_GEO = new THREE.BoxGeometry(4, 1, 4);
    const CAPITAL_GEO = new THREE.BoxGeometry(3.5, 1, 3.5);

    const pairs = useMemo(() => {
        return new Array(NUM_PAIRS).fill(0).map((_, i) => ({
             offset: i * GAP,
        }));
    }, []);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const activeSpeed = speed > 0 ? speed : 2;
        groupRef.current.position.z += activeSpeed * delta; 
        
        if (groupRef.current.position.z > GAP) {
             groupRef.current.position.z -= GAP;
        }
    });

    return (
        <group ref={groupRef}>
            {pairs.map((p, i) => {
                const zPos = -p.offset - 30;
                return (
                    <group key={i} position={[0, 0, zPos]}>
                        {/* Left Column */}
                        <group position={[-20, 7, 0]}>
                            <mesh geometry={COLUMN_GEO}>
                                <meshStandardMaterial color={columnColor} roughness={0.5} />
                            </mesh>
                            <mesh position={[0, -7.5, 0]} geometry={BASE_GEO}>
                                <meshStandardMaterial color={columnColor} roughness={0.6} />
                            </mesh>
                            <mesh position={[0, 7.5, 0]} geometry={CAPITAL_GEO}>
                                <meshStandardMaterial color={columnColor} roughness={0.6} />
                            </mesh>
                            {/* Flame Torch */}
                            <pointLight position={[2, 4, 0]} color={flameColor} intensity={0.8} distance={15} decay={2} />
                        </group>

                        {/* Right Column */}
                        <group position={[20, 7, 0]}>
                            <mesh geometry={COLUMN_GEO}>
                                <meshStandardMaterial color={columnColor} roughness={0.5} />
                            </mesh>
                            <mesh position={[0, -7.5, 0]} geometry={BASE_GEO}>
                                <meshStandardMaterial color={columnColor} roughness={0.6} />
                            </mesh>
                            <mesh position={[0, 7.5, 0]} geometry={CAPITAL_GEO}>
                                <meshStandardMaterial color={columnColor} roughness={0.6} />
                            </mesh>
                             {/* Flame Torch */}
                             <pointLight position={[-2, 4, 0]} color={flameColor} intensity={0.8} distance={15} decay={2} />
                        </group>
                    </group>
                )
            })}
        </group>
    );
};

// Floating Temples in background
const BackgroundTemples: React.FC<{ themeId: number }> = ({ themeId }) => {
    return (
        <group position={[0, 30, -200]}>
             {/* Main Temple Facade */}
             <mesh position={[0, 0, 0]}>
                 <boxGeometry args={[60, 4, 10]} />
                 <meshStandardMaterial color={themeId === 2 ? '#3e2723' : themeId === 5 ? '#212121' : '#e0e0e0'} />
             </mesh>
             {/* Roof */}
             <mesh position={[0, 10, 0]} rotation={[0, 0, 0]}>
                 <coneGeometry args={[40, 15, 4]} />
                 <meshStandardMaterial color={themeId === 2 ? '#4e342e' : themeId === 5 ? '#311b92' : '#eeeeee'} />
             </mesh>
             {/* Moon / Sun */}
             <mesh position={[40, 40, -50]}>
                 <sphereGeometry args={[15, 32, 32]} />
                 <meshBasicMaterial color={themeId === 2 ? '#b71c1c' : themeId === 5 ? '#e040fb' : '#fffde7'} />
             </mesh>
             <pointLight 
                position={[40, 40, -40]} 
                color={themeId === 2 ? '#ff1744' : themeId === 5 ? '#d500f9' : '#fffde7'} 
                intensity={0.5} 
                distance={200} 
            />
        </group>
    )
}

const Floor: React.FC<{ color: string, roughness: number, borderColor: string }> = ({ color, roughness, borderColor }) => {
    return (
        <group>
             {/* Main Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -100]} receiveShadow>
                <planeGeometry args={[100, 400]} />
                <meshStandardMaterial 
                    color={color} 
                    roughness={roughness}
                    metalness={0.1}
                />
            </mesh>
            
            {/* Side Borders */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-14, 0.02, -100]}>
                 <planeGeometry args={[4, 400]} />
                 <meshStandardMaterial color={borderColor} roughness={0.4} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[14, 0.02, -100]}>
                 <planeGeometry args={[4, 400]} />
                 <meshStandardMaterial color={borderColor} roughness={0.4} />
            </mesh>
        </group>
    );
};

export const Environment: React.FC<{ forceLevel?: number }> = ({ forceLevel }) => {
  const { level, currentZone } = useStore();
  
  // Use passed level if available (for Lobby preview), otherwise use game state
  const activeLevel = forceLevel !== undefined ? forceLevel : level;

  // Safe fallback for theme
  const themeKey = ((activeLevel - 1) % 5) + 1;
  const theme = THEMES[themeKey as keyof typeof THEMES] || THEMES[1];

  // Dynamic overrides based on Zone (Only apply zone logic if NOT forcing level/preview)
  let activeFogColor = theme.fogColor;
  let activeLightColor = theme.lightColor;
  
  if (forceLevel === undefined) {
      if (currentZone === ZoneType.SAFE) {
          activeFogColor = '#ffffff'; // Clear fog
          activeLightColor = '#ffffff'; // Bright light
      } else if (currentZone === ZoneType.DANGER) {
          activeFogColor = '#b71c1c'; // Red fog
          activeLightColor = '#ff5252'; // Red light
      }
  }

  // Use refs for smooth color transition
  const fogRef = useRef<THREE.Fog>(null);
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useFrame((state, delta) => {
      // Smoothly interpolate Fog color
      if (fogRef.current) {
          const target = new THREE.Color(activeFogColor);
          fogRef.current.color.lerp(target, delta * 2.0); // Faster lerp for preview switching
      }
      // Smoothly interpolate Light color
      if (lightRef.current) {
          const target = new THREE.Color(activeLightColor);
          lightRef.current.color.lerp(target, delta * 2.0);
      }
  });

  return (
    <>
      <color attach="background" args={[theme.skyTop]} />
      <fog ref={fogRef} attach="fog" args={[activeFogColor, 30, 120]} />
      
      {/* Ambient Light */}
      <ambientLight intensity={0.6} color={theme.ambientColor} />
      
      {/* Directional Light */}
      <directionalLight 
        ref={lightRef}
        position={[-20, 50, -10]} 
        intensity={1.2} 
        color={activeLightColor} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
      />
      
      <StarField />
      <DivineDust color={theme.particleColor} />
      <Floor color={theme.floorColor} roughness={theme.floorRoughness} borderColor={theme.borderColor} />
      <GreekColonnade columnColor={theme.columnColor} flameColor={theme.flameColor} />
      <BackgroundTemples themeId={themeKey} />
    </>
  );
};