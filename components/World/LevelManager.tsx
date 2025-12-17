/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text3D, Center } from '@react-three/drei';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../../store';
import { GameObject, ObjectType, LANE_WIDTH, SPAWN_DISTANCE, REMOVE_DISTANCE, GameStatus, ZoneType } from '../../types';
import { audio } from '../System/Audio';

// --- Geometries ---

// Spikes -> Bronze Trap (Spears)
const TRAP_BASE_GEO = new THREE.BoxGeometry(1.5, 0.2, 1.5);
const TRAP_SPIKE_GEO = new THREE.ConeGeometry(0.1, 0.8, 8);

// Tall Obstacle -> Marble Column
const COLUMN_GEO = new THREE.CylinderGeometry(0.6, 0.6, 4.0, 16);
const COLUMN_CAPITAL_GEO = new THREE.BoxGeometry(1.4, 0.3, 1.4);

// Flying Obstacle -> Floating Arch/Harpy
const ARCH_PILLAR_GEO = new THREE.BoxGeometry(0.2, 2.5, 0.2);
const ARCH_TOP_GEO = new THREE.BoxGeometry(2.4, 0.5, 0.5);

// Hammer (Rhythmic)
const HAMMER_HEAD_GEO = new THREE.BoxGeometry(1.8, 1.2, 1.2);
const HAMMER_HANDLE_GEO = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
// Horizontal Hammer handle needs to be longer
const HAMMER_HANDLE_LONG_GEO = new THREE.CylinderGeometry(0.1, 0.1, 6, 8); 

// Breakable -> Pottery
const POT_GEO = new THREE.DodecahedronGeometry(0.5, 0); // Low poly pot

// Pit -> Void visual
const PIT_GEO = new THREE.CircleGeometry(1.2, 16);

// Gem -> Drachma (Coin)
const COIN_GEO = new THREE.CylinderGeometry(0.4, 0.4, 0.05, 16);
const COIN_DETAIL_GEO = new THREE.CylinderGeometry(0.3, 0.3, 0.06, 6); 

// Enemy -> Automaton (Bronze Robot)
const GUARD_BODY_GEO = new THREE.CylinderGeometry(0.3, 0.2, 1.0, 8);
const GUARD_HEAD_GEO = new THREE.SphereGeometry(0.25, 16, 16); 
const GUARD_SHIELD_GEO = new THREE.CylinderGeometry(0.4, 0.4, 0.05, 16);

// Missile -> Lightning Ball
const LIGHTNING_GEO = new THREE.IcosahedronGeometry(0.3, 1);

// Warning Marker
const WARNING_GEO = new THREE.PlaneGeometry(1.5, 4);

// --- Power Up Geometries (Enhanced) ---
const BUFF_BAR_GEO = new THREE.BoxGeometry(0.25, 1.2, 0.25); // For Cross / X
const BUFF_BOLT_PART_GEO = new THREE.BoxGeometry(0.3, 0.8, 0.1); // For Lightning segments
const BUFF_MAGNET_RING_GEO = new THREE.TorusGeometry(0.4, 0.1, 8, 16, Math.PI + 0.5); 
const BUFF_MAGNET_TIP_GEO = new THREE.BoxGeometry(0.25, 0.3, 0.25);
const BUFF_SHIELD_GEO = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
const BUFF_SHIELD_BOSS_GEO = new THREE.SphereGeometry(0.2, 16, 8);
const BUFF_HALO_GEO = new THREE.TorusGeometry(0.6, 0.03, 8, 24); // Delicate Halo

// Shop
const SHOP_GATE_GEO = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
const SHOP_TOP_GEO = new THREE.BoxGeometry(6, 0.5, 1.0);

// Shadows
const SHADOW_SIMPLE = new THREE.CircleGeometry(0.7, 16);

const PARTICLE_COUNT = 600;
const BASE_FRAGMENT_INTERVAL = 150; 

const getFragmentInterval = (level: number) => {
    return BASE_FRAGMENT_INTERVAL * Math.pow(1.5, Math.max(0, level - 1));
};

const MISSILE_SPEED = 30; 
const FONT_URL = "https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_bold.typeface.json";

// --- Particle System ---
const ParticleSystem: React.FC = () => {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    
    const particles = useMemo(() => new Array(PARTICLE_COUNT).fill(0).map(() => ({
        life: 0,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        scale: 1,
        color: new THREE.Color()
    })), []);

    useEffect(() => {
        const handleExplosion = (e: CustomEvent) => {
            const { position, color } = e.detail;
            let spawned = 0;
            const burstAmount = 40; 

            for(let i = 0; i < PARTICLE_COUNT; i++) {
                const p = particles[i];
                if (p.life <= 0) {
                    p.life = 1.0 + Math.random() * 0.5; 
                    p.pos.set(position[0], position[1], position[2]);
                    
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    const speed = 2 + Math.random() * 8;
                    
                    p.vel.set(
                        Math.sin(phi) * Math.cos(theta),
                        Math.sin(phi) * Math.sin(theta),
                        Math.cos(phi)
                    ).multiplyScalar(speed);

                    p.scale = Math.random() * 0.5 + 0.2;
                    p.color.set(color);
                    
                    spawned++;
                    if (spawned >= burstAmount) break;
                }
            }
        };
        
        window.addEventListener('particle-burst', handleExplosion as any);
        return () => window.removeEventListener('particle-burst', handleExplosion as any);
    }, [particles]);

    useFrame((state, delta) => {
        if (!mesh.current) return;
        const safeDelta = Math.min(delta, 0.1);

        particles.forEach((p, i) => {
            if (p.life > 0) {
                p.life -= safeDelta * 1.5;
                p.pos.addScaledVector(p.vel, safeDelta);
                p.vel.y -= safeDelta * 3; 
                
                dummy.position.copy(p.pos);
                const s = p.life * p.scale;
                dummy.scale.set(s, s, s);
                dummy.updateMatrix();
                
                mesh.current!.setMatrixAt(i, dummy.matrix);
                mesh.current!.setColorAt(i, p.color);
            } else {
                dummy.scale.set(0,0,0);
                dummy.updateMatrix();
                mesh.current!.setMatrixAt(i, dummy.matrix);
            }
        });
        
        mesh.current.instanceMatrix.needsUpdate = true;
        if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, PARTICLE_COUNT]}>
            <dodecahedronGeometry args={[0.3, 0]} />
            <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
    );
};

const getRandomLane = (laneCount: number) => {
    const max = Math.floor(laneCount / 2);
    return Math.floor(Math.random() * (max * 2 + 1)) - max;
};

// --- Entities Components ---
interface HammerData extends GameObject {
    variant?: 'VERTICAL' | 'HORIZONTAL';
}

const HammerEntity: React.FC<{ data: HammerData }> = ({ data }) => {
    const groupRef = useRef<THREE.Group>(null);
    const meshRef = useRef<THREE.Group>(null);
    const isHorizontal = data.variant === 'HORIZONTAL';

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.position.set(data.position[0], data.position[1], data.position[2]);
        }
        if (meshRef.current) {
            const time = state.clock.elapsedTime;
            const phase = data.phaseOffset || 0;
            const speed = data.speed || 3;
            const cycle = Math.sin(time * speed + phase);
            
            if (isHorizontal) {
                // Horizontal Swing: Move left and right
                // Swing range +/- 2.5 units
                const xOffset = cycle * 2.5; 
                meshRef.current.position.x = xOffset;
                // Add pendulum rotation effect
                meshRef.current.rotation.z = -cycle * 0.5; 
                // Fixed height for horizontal hammer
                meshRef.current.position.y = 0; 
            } else {
                // Vertical Smash
                const n = (cycle + 1) / 2;
                const targetY = n * 4.0 + 0.6;
                const localY = targetY - data.position[1];
                meshRef.current.position.y = localY;
                meshRef.current.rotation.z = 0;
                meshRef.current.position.x = 0;
            }
        }
    });

    return (
        <group ref={groupRef}>
             <group ref={meshRef}>
                 <mesh geometry={HAMMER_HEAD_GEO} rotation={isHorizontal ? [0, 0, Math.PI/2] : [0,0,0]}>
                     <meshStandardMaterial color={data.color || '#5d4037'} />
                 </mesh>
                 <mesh 
                    geometry={isHorizontal ? HAMMER_HANDLE_LONG_GEO : HAMMER_HANDLE_GEO} 
                    position={isHorizontal ? [0, 3.5, 0] : [0, 2.6, 0]}
                 >
                     <meshStandardMaterial color="#8d6e63" />
                 </mesh>
             </group>
             <mesh position={[0, -4.0 + 0.02, 0]} rotation={[-Math.PI/2, 0, 0]} geometry={SHADOW_SIMPLE} scale={isHorizontal ? [3,1,1] : [2,2,1]}>
                 <meshBasicMaterial color="black" transparent opacity={0.3} />
             </mesh>
        </group>
    )
};

const GameEntity: React.FC<{ data: GameObject }> = ({ data }) => {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.position.set(data.position[0], data.position[1], data.position[2]);
            
            if (data.type === ObjectType.GEM || data.type === ObjectType.FRAGMENT || (data.type as string).startsWith('BUFF')) {
                 groupRef.current.rotation.y += 0.05;
                 // Bobbing
                 groupRef.current.position.y = data.position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.1;
            }
             if (data.type === ObjectType.FIREBALL) {
                groupRef.current.rotation.x += 0.1;
                groupRef.current.rotation.y += 0.1;
            }
        }
    });

    if (data.type === ObjectType.HAMMER) {
        return <HammerEntity data={data as HammerData} />;
    }
    
    let content = null;

    switch (data.type) {
        case ObjectType.OBSTACLE:
             content = (
                 <>
                     <mesh geometry={TRAP_BASE_GEO} position={[0, 0.1, 0]}>
                         <meshStandardMaterial color={data.color || '#cd7f32'} />
                     </mesh>
                     {[...Array(3)].map((_, i) => (
                         <mesh key={i} geometry={TRAP_SPIKE_GEO} position={[-0.5 + i * 0.5, 0.5, 0]}>
                             <meshStandardMaterial color="#b0bec5" metalness={0.8} />
                         </mesh>
                     ))}
                 </>
             );
             break;
        case ObjectType.TALL_OBSTACLE:
             content = (
                 <>
                     <mesh geometry={COLUMN_GEO} position={[0, 0, 0]}>
                         <meshStandardMaterial color={data.color || '#f5f5f5'} />
                     </mesh>
                     <mesh geometry={COLUMN_CAPITAL_GEO} position={[0, 2.1, 0]}>
                         <meshStandardMaterial color={data.color || '#f5f5f5'} />
                     </mesh>
                     <mesh geometry={SHADOW_SIMPLE} position={[0, 0.02, 0]} rotation={[-Math.PI/2, 0, 0]}>
                         <meshBasicMaterial color="black" transparent opacity={0.3} />
                     </mesh>
                 </>
             );
             break;
        case ObjectType.FLYING_OBSTACLE:
             content = (
                 <>
                     <mesh geometry={ARCH_PILLAR_GEO} position={[-1.0, 0, 0]}>
                         <meshStandardMaterial color={data.color || '#8d6e63'} />
                     </mesh>
                     <mesh geometry={ARCH_PILLAR_GEO} position={[1.0, 0, 0]}>
                         <meshStandardMaterial color={data.color || '#8d6e63'} />
                     </mesh>
                     <mesh geometry={ARCH_TOP_GEO} position={[0, 1.2, 0]}>
                         <meshStandardMaterial color={data.color || '#8d6e63'} />
                     </mesh>
                     <mesh geometry={SHADOW_SIMPLE} position={[0, -1.4, 0]} rotation={[-Math.PI/2, 0, 0]} scale={[2, 1, 1]}>
                         <meshBasicMaterial color="black" transparent opacity={0.3} />
                     </mesh>
                 </>
             );
             break;
        case ObjectType.PIT:
             content = (
                 <mesh rotation={[-Math.PI/2, 0, 0]} geometry={PIT_GEO}>
                     <meshBasicMaterial color="#000000" />
                 </mesh>
             );
             break;
        case ObjectType.BREAKABLE:
             content = (
                 <mesh geometry={POT_GEO}>
                     <meshStandardMaterial color={data.color || '#795548'} />
                 </mesh>
             );
             break;
        case ObjectType.GEM:
             content = (
                 <group rotation={[Math.PI/2, 0, 0]}>
                     <mesh geometry={COIN_GEO}>
                         <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
                     </mesh>
                     <mesh geometry={COIN_DETAIL_GEO} position={[0, 0.05, 0]}>
                        <meshStandardMaterial color="#ffecb3" />
                     </mesh>
                 </group>
             );
             break;
        case ObjectType.FRAGMENT:
             content = (
                 <group scale={[0.8, 0.8, 0.8]}>
                      {/* Lightning Bolt Shape 3D */}
                      <mesh geometry={BUFF_BOLT_PART_GEO} position={[0, 0.5, 0]} rotation={[0, 0, 0.6]}>
                          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.8} />
                      </mesh>
                      <mesh geometry={BUFF_BOLT_PART_GEO} position={[0, 0, 0]} rotation={[0, 0, -0.6]}>
                          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.8} />
                      </mesh>
                      <mesh geometry={BUFF_BOLT_PART_GEO} position={[0, -0.5, 0]} rotation={[0, 0, 0.6]}>
                          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.8} />
                      </mesh>
                      <pointLight color="#ffd700" distance={3} decay={2} intensity={1.5} />
                 </group>
             );
             break;
         case ObjectType.SHOP_PORTAL:
              content = (
                  <>
                      <mesh geometry={SHOP_GATE_GEO} position={[-2.5, 3, 0]}>
                          <meshStandardMaterial color="#f5f5f5" />
                      </mesh>
                      <mesh geometry={SHOP_GATE_GEO} position={[2.5, 3, 0]}>
                          <meshStandardMaterial color="#f5f5f5" />
                      </mesh>
                      <mesh geometry={SHOP_TOP_GEO} position={[0, 6, 0]}>
                          <meshStandardMaterial color="#f5f5f5" />
                      </mesh>
                      <Center position={[0, 4, 0]}>
                          <Text3D font={FONT_URL} size={0.8} height={0.2}>
                              MARKET
                              <meshStandardMaterial color="#ffd700" />
                          </Text3D>
                      </Center>
                      <mesh position={[0, 2.5, 0]}>
                          <planeGeometry args={[5, 6]} />
                          <meshBasicMaterial color="#0d47a1" transparent opacity={0.6} side={THREE.DoubleSide} />
                      </mesh>
                  </>
              );
              break;
        case ObjectType.ENEMY:
              content = (
                  <>
                      <mesh geometry={GUARD_BODY_GEO} position={[0, 0.5, 0]}>
                          <meshStandardMaterial color={data.color || '#5d4037'} metalness={0.6} />
                      </mesh>
                      <mesh geometry={GUARD_HEAD_GEO} position={[0, 1.1, 0]}>
                           <meshStandardMaterial color={data.color || '#5d4037'} metalness={0.6} />
                      </mesh>
                      <mesh position={[0, 1.1, 0.2]}>
                           <sphereGeometry args={[0.1]} />
                           <meshBasicMaterial color="#ff1744" />
                      </mesh>
                      <mesh geometry={GUARD_SHIELD_GEO} position={[0.4, 0.6, 0.2]} rotation={[0, Math.PI/4, 0]}>
                           <meshStandardMaterial color="#8d6e63" />
                      </mesh>
                  </>
              );
              break;
         case ObjectType.FIREBALL:
              content = (
                  <>
                      <mesh geometry={LIGHTNING_GEO}>
                          <meshBasicMaterial color="#00e5ff" />
                      </mesh>
                      <pointLight color="#00e5ff" intensity={1} distance={5} />
                  </>
              );
              break;
         case ObjectType.WARNING:
              content = (
                  <mesh rotation={[-Math.PI/2, 0, 0]} geometry={WARNING_GEO}>
                       <meshBasicMaterial color="#d50000" transparent opacity={0.3} />
                  </mesh>
              );
              break;
         // --- Enhanced Power Ups ---
         case ObjectType.BUFF_MAGNET:
              content = (
                  <group>
                      {/* Magnet Ring */}
                      <mesh geometry={BUFF_MAGNET_RING_GEO}>
                          <meshStandardMaterial color="#ff1744" metalness={0.6} roughness={0.4} />
                      </mesh>
                      {/* Metal Tips */}
                      <mesh geometry={BUFF_MAGNET_TIP_GEO} position={[-0.4, -0.2, 0]}>
                          <meshStandardMaterial color="#b0bec5" metalness={0.8} />
                      </mesh>
                      <mesh geometry={BUFF_MAGNET_TIP_GEO} position={[0.4, -0.2, 0]}>
                          <meshStandardMaterial color="#b0bec5" metalness={0.8} />
                      </mesh>
                  </group>
              );
              break;
         case ObjectType.BUFF_MULTIPLIER:
              content = (
                  <group>
                      {/* "X" Shape */}
                      <mesh geometry={BUFF_BAR_GEO} rotation={[0, 0, Math.PI/4]} scale={[1, 1.4, 1]}>
                          <meshStandardMaterial color="#00e676" emissive="#00e676" emissiveIntensity={0.6} />
                      </mesh>
                      <mesh geometry={BUFF_BAR_GEO} rotation={[0, 0, -Math.PI/4]} scale={[1, 1.4, 1]}>
                          <meshStandardMaterial color="#00e676" emissive="#00e676" emissiveIntensity={0.6} />
                      </mesh>
                  </group>
              );
              break;
         case ObjectType.BUFF_HEAL:
               content = (
                  <group>
                      {/* "+" Shape */}
                      <mesh geometry={BUFF_BAR_GEO} scale={[1, 1.2, 1]}>
                          <meshStandardMaterial color="#ff4081" emissive="#ff4081" emissiveIntensity={0.5} />
                      </mesh>
                      <mesh geometry={BUFF_BAR_GEO} rotation={[0, 0, Math.PI/2]} scale={[1, 1.2, 1]}>
                          <meshStandardMaterial color="#ff4081" emissive="#ff4081" emissiveIntensity={0.5} />
                      </mesh>
                      {/* Floating Halo */}
                      <mesh geometry={BUFF_HALO_GEO} rotation={[Math.PI/3, 0, 0]}>
                           <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
                      </mesh>
                  </group>
              );
              break;
         case ObjectType.BUFF_INVINCIBLE:
               content = (
                  <group rotation={[Math.PI/2, 0, 0]}>
                      {/* Shield Base */}
                      <mesh geometry={BUFF_SHIELD_GEO}>
                          <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
                      </mesh>
                      {/* Shield Boss (Center) */}
                      <mesh geometry={BUFF_SHIELD_BOSS_GEO} position={[0, 0.05, 0]}>
                          <meshStandardMaterial color="#e65100" />
                      </mesh>
                  </group>
              );
              break;
        default:
            return null;
    }

    return (
        <group ref={groupRef}>
            {content}
        </group>
    );
};

export const LevelManager: React.FC = () => {
  const { 
    status, 
    speed, 
    collectScarab, 
    collectFragment, 
    fragmentsCollected,
    laneCount,
    setDistance,
    openShop,
    level,
    activateBuff,
    isMagnetActive,
    isShieldActive,
    heal,
    isSliding,
    addScore,
    addCombo,
    combo,
    lives,
    currentZone,
    setZone,
    healsSpawned,
    incrementHealsSpawned
  } = useStore();
  
  const objectsRef = useRef<GameObject[]>([]);
  const [renderTrigger, setRenderTrigger] = useState(0);
  const prevStatus = useRef(status);
  const prevLevel = useRef(level);

  const playerObjRef = useRef<THREE.Object3D | null>(null);
  const distanceTraveled = useRef(0);
  const nextFragmentDistance = useRef(BASE_FRAGMENT_INTERVAL);
  const lastBuffZ = useRef(-999); // Track the Z position of the last spawned buff
  
  // Zone Management
  const zoneTimer = useRef(0); // Tracks distance within current zone
  const NEXT_ZONE_DISTANCE = 300; // Change zone every 300m

  // Handle resets
  useEffect(() => {
    const isRestart = status === GameStatus.PLAYING && prevStatus.current === GameStatus.GAME_OVER;
    const isMenuReset = status === GameStatus.MENU;
    const isLevelUp = level !== prevLevel.current && status === GameStatus.PLAYING;
    const isVictoryReset = status === GameStatus.PLAYING && prevStatus.current === GameStatus.VICTORY;

    if (isMenuReset || isRestart || isVictoryReset) {
        objectsRef.current = [];
        setRenderTrigger(t => t + 1);
        distanceTraveled.current = 0;
        nextFragmentDistance.current = getFragmentInterval(1);
        zoneTimer.current = 0;
        setZone(ZoneType.NORMAL);
        lastBuffZ.current = -999;

    } else if (isLevelUp && level > 1) {
        objectsRef.current = objectsRef.current.filter(obj => obj.position[2] > -80);
        objectsRef.current.push({
            id: uuidv4(),
            type: ObjectType.SHOP_PORTAL,
            position: [0, 0, -100], 
            active: true,
        });
        nextFragmentDistance.current = distanceTraveled.current - SPAWN_DISTANCE + getFragmentInterval(level);
        setRenderTrigger(t => t + 1);
        
    } else if (status === GameStatus.GAME_OVER || status === GameStatus.VICTORY) {
        setDistance(Math.floor(distanceTraveled.current));
    }
    
    prevStatus.current = status;
    prevLevel.current = level;
  }, [status, level, setDistance, setZone]);

  useFrame((state) => {
      if (!playerObjRef.current) {
          const group = state.scene.getObjectByName('PlayerGroup');
          if (group && group.children.length > 0) {
              playerObjRef.current = group.children[0];
          }
      }
  });

  useFrame((state, delta) => {
    if (status !== GameStatus.PLAYING) return;

    const safeDelta = Math.min(delta, 0.05); 
    
    // --- Speed Boost Logic ---
    const currentSpeed = isShieldActive ? speed * 1.5 : speed;
    const dist = currentSpeed * safeDelta;
    
    distanceTraveled.current += dist;
    zoneTimer.current += dist;

    // --- Zone Switching Logic ---
    if (zoneTimer.current > NEXT_ZONE_DISTANCE) {
        zoneTimer.current = 0;
        if (currentZone === ZoneType.NORMAL) {
             if (Math.random() > 0.5) setZone(ZoneType.SAFE);
             else setZone(ZoneType.DANGER);
        } else {
             setZone(ZoneType.NORMAL);
        }
    }

    let hasChanges = false;
    let playerPos = new THREE.Vector3(0, 0, 0);
    
    if (playerObjRef.current) playerObjRef.current.getWorldPosition(playerPos);

    const currentObjects = objectsRef.current;
    const keptObjects: GameObject[] = [];
    const newSpawns: GameObject[] = [];

    // --- Difficulty Calculation ---
    // Level scaling: 25% to 55% base intensity (Increased base difficulty, but Level 5 capped lower)
    let baseLevelFactor = 0.25; // Increased Level 1 difficulty from 0.15
    if (level === 2) baseLevelFactor = 0.35;
    if (level === 3) baseLevelFactor = 0.45;
    if (level === 4) baseLevelFactor = 0.55;
    if (level === 5) baseLevelFactor = 0.55; // Reduced Level 5 from 0.65 to 0.55

    const levelDifficulty = 1.0 + baseLevelFactor;
    let comboMultiplier = 1 + (combo * 0.05); 
    if (comboMultiplier > 2) comboMultiplier = 2; 
    const totalDifficulty = levelDifficulty * comboMultiplier;

    for (const obj of currentObjects) {
        let moveAmount = dist;
        if (obj.type === ObjectType.FIREBALL) moveAmount += (MISSILE_SPEED * levelDifficulty) * safeDelta;

        const prevZ = obj.position[2];
        obj.position[2] += moveAmount;

        // --- Combo Logic ---
        if (obj.type !== ObjectType.WARNING && obj.active && !obj.passed && obj.position[2] > playerPos.z + 1.0) {
            obj.passed = true;
            if (
                obj.type === ObjectType.OBSTACLE || 
                obj.type === ObjectType.TALL_OBSTACLE || 
                obj.type === ObjectType.FLYING_OBSTACLE || 
                obj.type === ObjectType.PIT ||
                obj.type === ObjectType.ENEMY ||
                obj.type === ObjectType.FIREBALL ||
                obj.type === ObjectType.HAMMER
            ) {
                addCombo(1);
            }
        }

        // --- Magnet Logic ---
        if (isMagnetActive && obj.type === ObjectType.GEM && obj.active) {
            const dx = playerPos.x - obj.position[0];
            const dz = playerPos.z - obj.position[2];
            const distToPlayer = Math.sqrt(dx*dx + dz*dz);
            
            if (distToPlayer < 15 && obj.position[2] > playerPos.z - 2) {
                const pullSpeed = 15 * safeDelta;
                obj.position[0] += (dx / distToPlayer) * pullSpeed;
                obj.position[2] += (dz / distToPlayer) * pullSpeed;
                obj.position[1] = THREE.MathUtils.lerp(obj.position[1], 1.0, safeDelta * 5); 
            }
        }
        
        // Enemy Firing Logic
        if (obj.type === ObjectType.ENEMY && obj.active && !obj.hasFired) {
             if (obj.position[2] > -90) {
                 obj.hasFired = true;
             }
        }

        let keep = true;
        if (obj.active) {
            // Tightened Z-threshold for collision to make jumping over objects easier and fairer.
            const zThreshold = 0.9; 
            const inZZone = (prevZ < playerPos.z + zThreshold) && (obj.position[2] > playerPos.z - zThreshold);
            
            if (obj.type === ObjectType.SHOP_PORTAL) {
                const dz = Math.abs(obj.position[2] - playerPos.z);
                if (dz < 2) { 
                     openShop();
                     obj.active = false;
                     hasChanges = true;
                     keep = false; 
                }
            } else if (inZZone) {
                const dx = Math.abs(obj.position[0] - playerPos.x);
                if (dx < 0.9) { 
                     
                     // ---- COLLISION LOGIC ----
                     if (obj.type === ObjectType.BREAKABLE) {
                         const playerBottom = playerPos.y;
                         
                         // Check 1: Jump Over
                         if (playerBottom > 1.2) {
                             // Jumped over successfully
                         } 
                         // Check 2: Slide to break
                         else if (isSliding) {
                             addScore(200);
                             addCombo(1);
                             audio.playGemCollect(); 
                             window.dispatchEvent(new CustomEvent('particle-burst', { 
                                detail: { position: obj.position, color: '#8d6e63' } 
                             }));
                             obj.active = false;
                             hasChanges = true;
                         } 
                         // Check 3: Collision
                         else {
                             window.dispatchEvent(new Event('player-hit'));
                             obj.active = false;
                             hasChanges = true;
                         }
                     }
                     else if (obj.type === ObjectType.PIT) {
                         const playerBottom = playerPos.y;
                         // Safe if jumping
                         if (playerBottom < 0.2) {
                             window.dispatchEvent(new Event('player-hit'));
                             keep = true; 
                         }
                     }
                     else if (obj.type === ObjectType.HAMMER) {
                         const hammerData = obj as HammerData;
                         const time = state.clock.elapsedTime;
                         const phase = obj.phaseOffset || 0;
                         const speed = obj.speed || 3;
                         const cycle = Math.sin(time * speed + phase);
                         
                         let hit = false;
                         const playerBottom = playerPos.y;
                         const playerTop = playerPos.y + 1.8;

                         if (hammerData.variant === 'HORIZONTAL') {
                             // Horizontal Collision
                             const hammerX = obj.position[0] + (cycle * 2.5); // Range +/- 2.5 relative to base
                             const diffX = Math.abs(hammerX - playerPos.x);
                             
                             // Hammer head width roughly 1.8, but visually swinging
                             // Check if hammer head intersects player horizontal space
                             if (diffX < 1.0 && playerTop > 2.0 && playerBottom < 5.0) {
                                 hit = true;
                             }
                         } else {
                             // Vertical Collision
                             const n = (cycle + 1) / 2;
                             const hammerY = n * 4.0 + 0.6; 
                             const hBottom = hammerY - 0.6;
                             const hTop = hammerY + 0.6;
                             
                             // Must be in same lane (handled by outer dx check) and overlapping Y
                             if (playerBottom < hTop && playerTop > hBottom) {
                                 hit = true;
                             }
                         }

                         if (hit) {
                              window.dispatchEvent(new Event('player-hit'));
                              obj.active = false; 
                              hasChanges = true;
                         }
                     }
                     else if (obj.type === ObjectType.WARNING) {
                         // Safe
                     }
                     else {
                         const isDamageSource = obj.type === ObjectType.OBSTACLE || obj.type === ObjectType.TALL_OBSTACLE || obj.type === ObjectType.FLYING_OBSTACLE || obj.type === ObjectType.ENEMY || obj.type === ObjectType.FIREBALL;
                         
                         if (isDamageSource) {
                             const playerTop = playerPos.y + 1.8; 
                             const playerBottom = playerPos.y;

                             let objBottom = obj.position[1] - 0.5;
                             let objTop = obj.position[1] + 0.5;

                             if (obj.type === ObjectType.OBSTACLE) { 
                                 objBottom = 0; objTop = 0.5; 
                             } else if (obj.type === ObjectType.TALL_OBSTACLE) { 
                                objBottom = 0; objTop = 4.0; 
                             } else if (obj.type === ObjectType.FLYING_OBSTACLE) {
                                objBottom = 0.9; // Spikes are low enough to hit standing player
                                objTop = 4.0;
                             }

                             let playerHitBoxTop = playerTop;
                             if (isSliding) playerHitBoxTop = playerBottom + 0.8; 

                             if ((playerBottom < objTop) && (playerHitBoxTop > objBottom)) { 
                                 if (obj.type === ObjectType.FLYING_OBSTACLE && isSliding) {
                                     // Safe passage under arch
                                 } else {
                                     window.dispatchEvent(new Event('player-hit'));
                                     obj.active = false; 
                                     hasChanges = true;
                                     if (obj.type === ObjectType.FIREBALL) {
                                        window.dispatchEvent(new CustomEvent('particle-burst', { 
                                            detail: { position: obj.position, color: '#00e5ff' } 
                                        }));
                                     }
                                 }
                             }
                         } else {
                             // Pickups
                             const dy = Math.abs(obj.position[1] - playerPos.y);
                             if (dy < 2.5) {
                                if (obj.type === ObjectType.GEM) {
                                    collectScarab(obj.points || 50);
                                    audio.playGemCollect();
                                } else if (obj.type === ObjectType.FRAGMENT) {
                                    collectFragment();
                                    audio.playLetterCollect(); 
                                } else if ((obj.type as string).startsWith('BUFF')) {
                                    if(obj.type === ObjectType.BUFF_MAGNET) activateBuff('MAGNET');
                                    if(obj.type === ObjectType.BUFF_MULTIPLIER) activateBuff('MULTIPLIER');
                                    if(obj.type === ObjectType.BUFF_INVINCIBLE) activateBuff('INVINCIBLE');
                                    if(obj.type === ObjectType.BUFF_HEAL) heal();
                                    
                                    audio.playGemCollect();
                                    if(obj.type === ObjectType.BUFF_HEAL) {
                                         window.dispatchEvent(new CustomEvent('particle-burst', { detail: { position: obj.position, color: '#ff4081' } }));
                                    }
                                } 

                                if (obj.type !== ObjectType.BUFF_HEAL) {
                                    window.dispatchEvent(new CustomEvent('particle-burst', { 
                                        detail: { position: obj.position, color: obj.color || '#fff' } 
                                    }));
                                }
                                obj.active = false;
                                hasChanges = true;
                             }
                         }
                     }
                }
            }
        }

        if (obj.position[2] > REMOVE_DISTANCE) {
            keep = false;
            hasChanges = true;
        }

        if (keep) keptObjects.push(obj);
    }
    if (newSpawns.length > 0) keptObjects.push(...newSpawns);

    // --- Helper Function for Buff Generation ---
    const generateBuff = (zPos: number, xPos: number): GameObject | null => {
        // 1. Non-consecutive check: Min distance 40m
        if (Math.abs(zPos - lastBuffZ.current) < 40) {
            // Spawn a standard Gem instead if too close
            return { id: uuidv4(), type: ObjectType.GEM, position: [xPos, 1.2, zPos], active: true, points: 50 };
        }

        // 2. Probabilities
        // Magnet: 20%
        // Multiplier: 20%
        // Invincible: 12%
        // Heal: 7%
        // Total Special: 59%
        // Remaining 41%: Gem
        
        const r = Math.random() * 100;
        let type = ObjectType.GEM;
        let color = '#ffd700';

        if (r < 20) {
            type = ObjectType.BUFF_MAGNET;
            color = '#ff1744';
            lastBuffZ.current = zPos;
        } else if (r < 40) {
            type = ObjectType.BUFF_MULTIPLIER;
            color = '#00e676';
            lastBuffZ.current = zPos;
        } else if (r < 52) {
            type = ObjectType.BUFF_INVINCIBLE;
            color = '#ffd700';
            lastBuffZ.current = zPos;
        } else if (r < 59) {
            if (healsSpawned < 3) {
                type = ObjectType.BUFF_HEAL;
                color = '#ff4081';
                incrementHealsSpawned();
                lastBuffZ.current = zPos;
            } else {
                type = ObjectType.GEM;
            }
        } else {
            type = ObjectType.GEM;
        }

        return { 
            id: uuidv4(), 
            type: type, 
            position: [xPos, 1.2, zPos], 
            active: true, 
            color: color,
            points: type === ObjectType.GEM ? 50 : undefined 
        };
    };

    // --- Spawning Logic ---
    let furthestZ = 0;
    const staticObjects = keptObjects.filter(o => o.type !== ObjectType.FIREBALL);
    if (staticObjects.length > 0) furthestZ = Math.min(...staticObjects.map(o => o.position[2]));
    else furthestZ = -20;

    if (furthestZ > -SPAWN_DISTANCE) {
         // Gap calculation
         const baseGap = 16 + (speed * 0.4); 
         const minGap = Math.max(10, baseGap / levelDifficulty);
         const spawnZ = Math.min(furthestZ - minGap, -SPAWN_DISTANCE);
         const isFragmentDue = distanceTraveled.current >= nextFragmentDistance.current;

         if (isFragmentDue && fragmentsCollected < 5) {
             const lane = getRandomLane(laneCount);
             keptObjects.push({
                id: uuidv4(),
                type: ObjectType.FRAGMENT,
                position: [lane * LANE_WIDTH, 1.5, spawnZ], 
                active: true,
                color: '#ffd700' 
             });
             nextFragmentDistance.current += getFragmentInterval(level);
             hasChanges = true;

         } else if (currentZone === ZoneType.SAFE) {
             // Safe Zone Pattern: Coins & Scenery
             const patternId = Math.floor(Math.random() * 3);
             
             if (patternId === 0) { // Coin Line
                 const lane = getRandomLane(laneCount);
                 for(let k=0; k<5; k++) keptObjects.push({ id: uuidv4(), type: ObjectType.GEM, position: [lane * LANE_WIDTH, 1.2, spawnZ - k*2], active: true, color: '#ffd700', points: 50 });
             } else if (patternId === 1) { // Side Pillars + Center Gift
                 keptObjects.push({ id: uuidv4(), type: ObjectType.TALL_OBSTACLE, position: [-LANE_WIDTH*2, 2.0, spawnZ], active: true, color: '#f5f5f5' });
                 keptObjects.push({ id: uuidv4(), type: ObjectType.TALL_OBSTACLE, position: [LANE_WIDTH*2, 2.0, spawnZ], active: true, color: '#f5f5f5' });
                 
                 const buff = generateBuff(spawnZ, 0);
                 if (buff) keptObjects.push(buff);

             } else { // Coin Arch
                 for(let k=0; k<5; k++) {
                     const h = Math.sin((k/4)*Math.PI) * 2 + 1.2;
                     keptObjects.push({ id: uuidv4(), type: ObjectType.GEM, position: [0, h, spawnZ - k*1.5], active: true, color: '#ffd700', points: 50 });
                 }
             }
             hasChanges = true;

         } else { 
            // --- CHAOS & PATTERN SYSTEM ---
            const isDanger = currentZone === ZoneType.DANGER;
            const baseChance = isDanger ? 0.08 : 0.05;
            const effectiveSpawnChance = baseChance * levelDifficulty;

            if (Math.random() <= effectiveSpawnChance) {
                // Determine Mode: Pattern vs Chaos Row
                // High level = More Chaos (Random mixed obstacles)
                const chaosChance = 0.4 + (level * 0.1); // 50% to 90% chaos chance
                const isChaos = Math.random() < chaosChance;

                // Add NEW PATTERNS to the list
                const patterns = ['WALL', 'HURDLE', 'LOW_HIGH', 'TUNNEL', 'NEEDLE', 'RHYTHM', 'BARRAGE', 'TRICKY_WALL', 'MIXED_BARRIER'];

                if (isChaos) {
                    // --- CHAOS SPAWN (Relaxed Rules: Duplicates Allowed) ---
                    // Determine how many lanes to fill (1 to 3)
                    let lanesToSpawn = 1;
                    const r = Math.random();
                    // Level 1: 1-2 (Increased multi-lane chance), Level 5: 2-3
                    if (level === 1) lanesToSpawn = r > 0.7 ? 2 : 1; // Was 0.8
                    else if (level >= 4) lanesToSpawn = r > 0.4 ? (r > 0.85 ? 3 : 2) : 1;
                    else lanesToSpawn = r > 0.6 ? 2 : 1;

                    // Obstacle Pool
                    const obstaclePool = [
                        ObjectType.OBSTACLE, 
                        ObjectType.TALL_OBSTACLE, 
                        ObjectType.FLYING_OBSTACLE, 
                        ObjectType.PIT, 
                        ObjectType.HAMMER, 
                        ObjectType.ENEMY
                    ];

                    const availableLanes = [];
                    const maxLane = Math.floor(laneCount / 2);
                    for (let i = -maxLane; i <= maxLane; i++) availableLanes.push(i);
                    availableLanes.sort(() => Math.random() - 0.5); // Shuffle lanes

                    const generatedTypes: ObjectType[] = [];

                    for(let i=0; i<lanesToSpawn; i++) {
                         // Completely random selection (allow duplicates)
                         const type = obstaclePool[Math.floor(Math.random() * obstaclePool.length)];
                         generatedTypes.push(type);
                    }

                    // SAFETY LOCK: Prevent Impossible Walls
                    // If we spawned obstacles in 3 (or more) lanes, ensure we don't have 3 solid blockers
                    if (lanesToSpawn >= 3) {
                         const tallCount = generatedTypes.filter(t => t === ObjectType.TALL_OBSTACLE).length;
                         if (tallCount === lanesToSpawn) {
                             // Replace the middle one with something passable or a reward
                             generatedTypes[1] = ObjectType.BREAKABLE;
                         }
                    }

                    for(let i=0; i<lanesToSpawn; i++) {
                        const lane = availableLanes[i];
                        let type = generatedTypes[i];
                        
                        // Flavor tweaks
                        if (type === ObjectType.ENEMY && Math.random() > 0.7) type = ObjectType.BREAKABLE;

                        let hammerVariant: 'VERTICAL' | 'HORIZONTAL' = 'VERTICAL';
                        if (type === ObjectType.HAMMER) {
                            hammerVariant = Math.random() > 0.5 ? 'HORIZONTAL' : 'VERTICAL';
                        }

                        keptObjects.push({
                            id: uuidv4(),
                            type: type,
                            active: true,
                            position: [
                                lane * LANE_WIDTH, 
                                (type === ObjectType.HAMMER) ? 4.0 : 
                                (type === ObjectType.FLYING_OBSTACLE) ? 1.4 :
                                (type === ObjectType.TALL_OBSTACLE) ? 2.0 :
                                (type === ObjectType.ENEMY) ? 0.5 :
                                0.05, 
                                spawnZ
                            ],
                            variant: hammerVariant,
                            phaseOffset: Math.random() * Math.PI, 
                            speed: 3.0 + (level * 0.5)
                        });
                        
                        // Occasional coin above spikes
                        if (type === ObjectType.OBSTACLE && Math.random() > 0.5) {
                             keptObjects.push({ id: uuidv4(), type: ObjectType.GEM, position: [lane * LANE_WIDTH, 2.5, spawnZ], active: true, points: 50 });
                        }
                    }

                } else {
                    // --- PATTERN SPAWN (Structured Challenges) ---
                    const patternType = patterns[Math.floor(Math.random() * patterns.length)];
                    
                    switch (patternType) {
                        case 'TRICKY_WALL': // New: 2 Columns + 1 Action Item
                            {
                                // Pick one lane to be the "way out" (Jump or Slide)
                                const actionLane = getRandomLane(laneCount);
                                // Determine what action is required: Jump (Spike) or Slide (Arch)
                                const actionType = Math.random() > 0.5 ? ObjectType.OBSTACLE : ObjectType.FLYING_OBSTACLE;
                                
                                const maxLane = Math.floor(laneCount/2);
                                for(let l = -maxLane; l <= maxLane; l++) {
                                    if (l === actionLane) {
                                        // The way through
                                        keptObjects.push({ 
                                            id: uuidv4(), 
                                            type: actionType, 
                                            position: [l * LANE_WIDTH, actionType === ObjectType.FLYING_OBSTACLE ? 1.4 : 0.05, spawnZ], 
                                            active: true 
                                        });
                                        // Add coin encouragement above/below
                                        keptObjects.push({ 
                                            id: uuidv4(), 
                                            type: ObjectType.GEM, 
                                            position: [l * LANE_WIDTH, actionType === ObjectType.FLYING_OBSTACLE ? 0.5 : 2.5, spawnZ], 
                                            active: true, 
                                            points: 50 
                                        });
                                    } else {
                                        // The blockers (Columns)
                                        keptObjects.push({ 
                                            id: uuidv4(), 
                                            type: ObjectType.TALL_OBSTACLE, 
                                            position: [l * LANE_WIDTH, 2.0, spawnZ], 
                                            active: true 
                                        });
                                    }
                                }
                            }
                            break;

                        case 'MIXED_BARRIER': // New: Alternating Jump/Slide across lanes
                            {
                                // e.g. Jump - Slide - Jump
                                const primaryType = Math.random() > 0.5 ? ObjectType.OBSTACLE : ObjectType.FLYING_OBSTACLE;
                                const secondaryType = primaryType === ObjectType.OBSTACLE ? ObjectType.FLYING_OBSTACLE : ObjectType.OBSTACLE;
                                
                                const maxLane = Math.floor(laneCount/2);
                                for(let l = -maxLane; l <= maxLane; l++) {
                                    const isPrimary = Math.abs(l) % 2 === 0; // Even lanes (center) get primary? Or alternating logic
                                    // Use simple alternation based on index
                                    const type = (l + maxLane) % 2 === 0 ? primaryType : secondaryType;
                                    
                                     keptObjects.push({ 
                                        id: uuidv4(), 
                                        type: type, 
                                        position: [l * LANE_WIDTH, type === ObjectType.FLYING_OBSTACLE ? 1.4 : 0.05, spawnZ], 
                                        active: true 
                                    });
                                }
                            }
                            break;

                        case 'BARRAGE': // Full Lane Assault
                            {
                                const subTypes = ['ALL_SPIKES', 'ALL_ARCHES', 'ALL_HAMMERS'];
                                const subType = subTypes[Math.floor(Math.random() * subTypes.length)];
                                
                                const maxLane = Math.floor(laneCount / 2);
                                for(let l = -maxLane; l <= maxLane; l++) {
                                    if (subType === 'ALL_SPIKES') {
                                        keptObjects.push({ id: uuidv4(), type: ObjectType.OBSTACLE, position: [l * LANE_WIDTH, 0.05, spawnZ], active: true });
                                    } else if (subType === 'ALL_ARCHES') {
                                        keptObjects.push({ id: uuidv4(), type: ObjectType.FLYING_OBSTACLE, position: [l * LANE_WIDTH, 1.4, spawnZ], active: true });
                                    } else if (subType === 'ALL_HAMMERS') {
                                        keptObjects.push({ 
                                            id: uuidv4(), 
                                            type: ObjectType.HAMMER, 
                                            position: [l * LANE_WIDTH, 4.0, spawnZ], 
                                            active: true,
                                            variant: 'VERTICAL',
                                            phaseOffset: (l + 1) * 0.5, 
                                            speed: 5.0
                                        });
                                    }
                                }
                                
                                if (Math.random() > 0.5) {
                                     keptObjects.push({ id: uuidv4(), type: ObjectType.GEM, position: [0, 2.5, spawnZ - 4], active: true, points: 100 });
                                }
                            }
                            break;

                        case 'WALL': // Block 2 lanes, force 1 (Coin/Open)
                            {
                                const openLane = getRandomLane(laneCount);
                                const maxLane = Math.floor(laneCount/2);
                                for(let l = -maxLane; l <= maxLane; l++) {
                                    if (l !== openLane) {
                                        keptObjects.push({ id: uuidv4(), type: ObjectType.TALL_OBSTACLE, position: [l * LANE_WIDTH, 2.0, spawnZ], active: true });
                                    } else {
                                        keptObjects.push({ id: uuidv4(), type: ObjectType.GEM, position: [l * LANE_WIDTH, 1.2, spawnZ], active: true, points: 50 });
                                    }
                                }
                            }
                            break;
                        
                        case 'HURDLE': // Jump -> Land -> Jump
                            {
                                const lane = getRandomLane(laneCount);
                                keptObjects.push({ id: uuidv4(), type: ObjectType.OBSTACLE, position: [lane * LANE_WIDTH, 0.05, spawnZ], active: true });
                                keptObjects.push({ id: uuidv4(), type: ObjectType.GEM, position: [lane * LANE_WIDTH, 2.5, spawnZ], active: true, points: 50 });
                                keptObjects.push({ id: uuidv4(), type: ObjectType.OBSTACLE, position: [lane * LANE_WIDTH, 0.05, spawnZ - 8], active: true });
                            }
                            break;

                        case 'LOW_HIGH': // Trap (Jump) -> Arch (Slide) immediately
                            {
                                const lane = getRandomLane(laneCount);
                                keptObjects.push({ id: uuidv4(), type: ObjectType.OBSTACLE, position: [lane * LANE_WIDTH, 0.05, spawnZ], active: true });
                                keptObjects.push({ id: uuidv4(), type: ObjectType.FLYING_OBSTACLE, position: [lane * LANE_WIDTH, 1.4, spawnZ - 6], active: true });
                                keptObjects.push({ id: uuidv4(), type: ObjectType.GEM, position: [lane * LANE_WIDTH, 0.5, spawnZ - 6], active: true, points: 50 });
                            }
                            break;

                        case 'TUNNEL': // Consecutive Arches (Slide Chain)
                            {
                                const lane = getRandomLane(laneCount);
                                for(let i=0; i<2; i++) {
                                    keptObjects.push({ id: uuidv4(), type: ObjectType.FLYING_OBSTACLE, position: [lane * LANE_WIDTH, 1.4, spawnZ - i*6], active: true });
                                }
                            }
                            break;

                        case 'NEEDLE': // Pillars on sides, Pit in middle (Jump to center)
                            {
                                keptObjects.push({ id: uuidv4(), type: ObjectType.TALL_OBSTACLE, position: [-LANE_WIDTH, 2.0, spawnZ], active: true });
                                keptObjects.push({ id: uuidv4(), type: ObjectType.TALL_OBSTACLE, position: [LANE_WIDTH, 2.0, spawnZ], active: true });
                                keptObjects.push({ id: uuidv4(), type: ObjectType.PIT, position: [0, 0.02, spawnZ], active: true });
                                keptObjects.push({ id: uuidv4(), type: ObjectType.GEM, position: [0, 3.0, spawnZ], active: true, points: 100 });
                            }
                            break;
                        
                        case 'RHYTHM': // Hammers (Mixed Variants)
                            {
                                for(let i=-1; i<=1; i++) {
                                    const variant = (i === 0) ? 'HORIZONTAL' : 'VERTICAL';
                                    keptObjects.push({
                                        id: uuidv4(),
                                        type: ObjectType.HAMMER,
                                        position: [i * LANE_WIDTH, 4.0, spawnZ], 
                                        active: true,
                                        phaseOffset: (i+1) * 1.0, 
                                        speed: 4.0 + (level * 0.5),
                                        variant: variant
                                    });
                                }
                            }
                            break;
                    }
                }
                
                // Add a small chance for a Buff/Item in the mix
                if (Math.random() < 0.15) {
                    const buffLane = getRandomLane(laneCount);
                    const buffZ = spawnZ + 5; // Slightly ahead of pattern
                    
                    const buff = generateBuff(buffZ, buffLane * LANE_WIDTH);
                    if (buff) keptObjects.push(buff);
                }

                hasChanges = true;
            }
         }
    }

    if (hasChanges) {
        objectsRef.current = keptObjects;
        setRenderTrigger(t => t + 1);
    }
  });

  return (
    <group>
      <ParticleSystem />
      {objectsRef.current.map(obj => {
        if (!obj.active) return null;
        return <GameEntity key={obj.id} data={obj} />;
      })}
    </group>
  );
};