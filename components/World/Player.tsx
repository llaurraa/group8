/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore, CHARACTERS } from '../../store';
import { LANE_WIDTH, GameStatus } from '../../types';
import { audio } from '../System/Audio';

// Physics Constants
const GRAVITY = 60; 
const JUMP_FORCE = 18; 

// Spring Physics for Horizontal Movement (Inertia)
const SPRING_STIFFNESS = 120; // Controls how fast it snaps to target
const SPRING_DAMPING = 12;    // Controls oscillation/friction (Low = bouncy/slidey, High = stiff)

// Hero Geometry
const HEAD_GEO = new THREE.BoxGeometry(0.4, 0.45, 0.4);
const TORSO_GEO = new THREE.BoxGeometry(0.45, 0.6, 0.25);
const LIMB_GEO = new THREE.CylinderGeometry(0.09, 0.08, 0.5, 8);
const LAUREL_GEO = new THREE.TorusGeometry(0.23, 0.02, 4, 16); 
const HEART_GEO = new THREE.OctahedronGeometry(0.1, 0);

// Spartan Crest
const CREST_GEO = new THREE.BoxGeometry(0.05, 0.2, 0.5);

// Hermes Wings
const WING_GEO = new THREE.BoxGeometry(0.05, 0.2, 0.3);

export const CharacterPreview: React.FC<{ characterId: string }> = ({ characterId }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const charConfig = useMemo(() => {
      return CHARACTERS.find(c => c.id === characterId) || CHARACTERS[0];
  }, [characterId]);

  const { tunicMaterial, skinMaterial, divineMaterial, goldMaterial, laurelMaterial, crestMaterial } = useMemo(() => {
      return {
          tunicMaterial: new THREE.MeshStandardMaterial({ color: charConfig.colors.tunic, roughness: 0.9 }), 
          skinMaterial: new THREE.MeshStandardMaterial({ color: charConfig.colors.skin, roughness: 0.8 }), 
          divineMaterial: new THREE.MeshBasicMaterial({ color: charConfig.colors.effect }), 
          goldMaterial: new THREE.MeshStandardMaterial({ color: charConfig.colors.accent, metalness: 0.8, roughness: 0.2 }),
          laurelMaterial: new THREE.MeshStandardMaterial({ color: '#4caf50', roughness: 0.8 }),
          crestMaterial: new THREE.MeshStandardMaterial({ color: charConfig.colors.effect, roughness: 0.9 })
      };
  }, [charConfig]); 

  useFrame((state) => {
      if (groupRef.current) {
          groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.5;
          groupRef.current.position.y = -0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      }
  });

  return (
    <group ref={groupRef}>
        {/* Torso */}
        <mesh position={[0, 0.2, 0]} geometry={TORSO_GEO} material={tunicMaterial} />
        <mesh position={[0, -0.05, 0]} scale={[1.05, 0.2, 1.05]}>
            <boxGeometry args={[0.45, 0.4, 0.25]} />
            <meshStandardMaterial color={charConfig.colors.accent} metalness={0.6} />
        </mesh>

        {/* Head */}
        <group position={[0, 0.65, 0]}>
            <mesh geometry={HEAD_GEO} material={skinMaterial} />
            <mesh position={[0.1, 0.05, 0.21]} scale={[0.08, 0.05, 0.02]}>
                    <boxGeometry />
                    <meshBasicMaterial color={charConfig.colors.effect} />
            </mesh>
            <mesh position={[-0.1, 0.05, 0.21]} scale={[0.08, 0.05, 0.02]}>
                    <boxGeometry />
                    <meshBasicMaterial color={charConfig.colors.effect} />
            </mesh>
            {characterId === 'SPARTAN' && (
                <mesh position={[0, 0.35, 0]} geometry={CREST_GEO} material={crestMaterial} />
            )}
            {characterId !== 'SPARTAN' && (
                    <mesh position={[0, 0.15, 0]} rotation={[-Math.PI/2 - 0.2, 0, 0]} geometry={LAUREL_GEO} material={laurelMaterial} />
            )}
        </group>

        {/* Arms */}
        <group position={[0.3, 0.35, 0]}>
            <mesh position={[0, -0.25, 0]} geometry={LIMB_GEO} material={skinMaterial} />
            <mesh position={[0, -0.4, 0]} scale={[1.2, 0.3, 1.2]} geometry={LIMB_GEO} material={goldMaterial} />
        </group>
        <group position={[-0.3, 0.35, 0]}>
            <mesh position={[0, -0.25, 0]} geometry={LIMB_GEO} material={skinMaterial} />
            <mesh position={[0, -0.4, 0]} scale={[1.2, 0.3, 1.2]} geometry={LIMB_GEO} material={goldMaterial} />
        </group>

        {/* Legs */}
        <group position={[0.15, -0.1, 0]}>
            <mesh position={[0, -0.25, 0]} geometry={LIMB_GEO} material={skinMaterial} />
            <mesh position={[0, -0.5, 0.05]} scale={[1.2, 0.1, 1.5]}>
                <boxGeometry args={[0.1,0.5,0.2]} />
                <meshStandardMaterial color="#8d6e63" />
            </mesh>
            {characterId === 'HERMES' && (
                <mesh position={[0.1, -0.4, 0]} rotation={[0,0,-0.5]} geometry={WING_GEO}>
                    <meshStandardMaterial color="#ffffff" />
                </mesh>
            )}
        </group>
        <group position={[-0.15, -0.1, 0]}>
            <mesh position={[0, -0.25, 0]} geometry={LIMB_GEO} material={skinMaterial} />
            <mesh position={[0, -0.5, 0.05]} scale={[1.2, 0.1, 1.5]}>
                <boxGeometry args={[0.1,0.5,0.2]} />
                <meshStandardMaterial color="#8d6e63" />
            </mesh>
            {characterId === 'HERMES' && (
                <mesh position={[-0.1, -0.4, 0]} rotation={[0,0,0.5]} geometry={WING_GEO}>
                    <meshStandardMaterial color="#ffffff" />
                </mesh>
            )}
        </group>

        {/* Divine Heart */}
        <group position={[0, 0.2, 0.15]} scale={[0.8,0.8,0.8]}>
            <mesh geometry={HEART_GEO} material={divineMaterial} />
        </group>
    </group>
  );
};

export const Player: React.FC = () => {
    const groupRef = useRef<THREE.Group>(null);
    const bodyRef = useRef<THREE.Group>(null);
    const soulRef = useRef<THREE.Group>(null);
    const shieldRef = useRef<THREE.Mesh>(null);
    
    const leftArmRef = useRef<THREE.Group>(null);
    const rightArmRef = useRef<THREE.Group>(null);
    const leftLegRef = useRef<THREE.Group>(null);
    const rightLegRef = useRef<THREE.Group>(null);
  
    const { status, laneCount, takeDamage, hasDoubleJump, activateImmortality, isImmortalityActive, triggerSlide, isSliding, isShieldActive, selectedCharacterId, useStamina, regenStamina } = useStore();
    
    const [lane, setLane] = React.useState(0);
    const targetX = useRef(0);
    
    // Physics State
    const velocityX = useRef(0);
    const currentX = useRef(0);
  
    const isJumping = useRef(false);
    const velocityY = useRef(0);
    const jumpsPerformed = useRef(0); 
    const rollRotation = useRef(0); 
  
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
  
    const isInvincible = useRef(false);
    const lastDamageTime = useRef(0);
  
    // Determine Character Config
    const charConfig = useMemo(() => {
        return CHARACTERS.find(c => c.id === selectedCharacterId) || CHARACTERS[0];
    }, [selectedCharacterId]);
  
    // Materials - Dynamic based on Character
    const { tunicMaterial, skinMaterial, divineMaterial, goldMaterial, shadowMaterial, laurelMaterial, crestMaterial } = useMemo(() => {
        return {
            tunicMaterial: new THREE.MeshStandardMaterial({ color: charConfig.colors.tunic, roughness: 0.9 }), 
            skinMaterial: new THREE.MeshStandardMaterial({ color: charConfig.colors.skin, roughness: 0.8 }), 
            divineMaterial: new THREE.MeshBasicMaterial({ color: charConfig.colors.effect }), 
            goldMaterial: new THREE.MeshStandardMaterial({ color: charConfig.colors.accent, metalness: 0.8, roughness: 0.2 }),
            laurelMaterial: new THREE.MeshStandardMaterial({ color: '#4caf50', roughness: 0.8 }),
            shadowMaterial: new THREE.MeshBasicMaterial({ color: '#1a237e', opacity: 0.3, transparent: true }),
            crestMaterial: new THREE.MeshStandardMaterial({ color: charConfig.colors.effect, roughness: 0.9 })
        };
    }, [charConfig]); 
  
    // --- Reset ---
    useEffect(() => {
        if (status === GameStatus.PLAYING) {
            isJumping.current = false;
            jumpsPerformed.current = 0;
            velocityY.current = 0;
            rollRotation.current = 0;
            velocityX.current = 0;
            currentX.current = 0;
            setLane(0);
            if (groupRef.current) {
                groupRef.current.position.y = 0;
                groupRef.current.position.x = 0;
            }
            if (bodyRef.current) bodyRef.current.rotation.x = 0;
        }
    }, [status]);
    
    useEffect(() => {
        const maxLane = Math.floor(laneCount / 2);
        if (Math.abs(lane) > maxLane) {
            setLane(l => Math.max(Math.min(l, maxLane), -maxLane));
        }
    }, [laneCount, lane]);
  
    // --- Controls ---
    const triggerJump = () => {
      const maxJumps = hasDoubleJump ? 2 : 1;
  
      if (isJumping.current && jumpsPerformed.current < maxJumps) {
          // Double Jump requires Stamina
          if (useStamina(20)) {
              audio.playJump(true);
              jumpsPerformed.current += 1;
              velocityY.current = JUMP_FORCE; 
              rollRotation.current = 0; 
              if (bodyRef.current) {
                  bodyRef.current.rotation.y = Math.PI * 2; 
              }
          }
      } else if (!isJumping.current) {
          // Normal Jump is free
          audio.playJump(false);
          isJumping.current = true;
          jumpsPerformed.current = 1;
          velocityY.current = JUMP_FORCE;
      }
    };
  
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (status !== GameStatus.PLAYING) return;
        const maxLane = Math.floor(laneCount / 2);
  
        if (e.key === 'ArrowLeft') setLane(l => Math.max(l - 1, -maxLane));
        else if (e.key === 'ArrowRight') setLane(l => Math.min(l + 1, maxLane));
        else if (e.key === 'ArrowUp' || e.key === 'w') triggerJump();
        else if (e.key === 'ArrowDown' || e.key === 's') triggerSlide();
        else if (e.key === ' ' || e.key === 'Enter') {
            activateImmortality();
        }
      };
  
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [status, laneCount, hasDoubleJump, activateImmortality, triggerSlide, useStamina]);
  
    useEffect(() => {
      const handleTouchStart = (e: TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
      };
  
      const handleTouchEnd = (e: TouchEvent) => {
          if (status !== GameStatus.PLAYING) return;
          const deltaX = e.changedTouches[0].clientX - touchStartX.current;
          const deltaY = e.changedTouches[0].clientY - touchStartY.current;
          const maxLane = Math.floor(laneCount / 2);
  
          if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
               if (deltaX > 0) setLane(l => Math.min(l + 1, maxLane));
               else setLane(l => Math.max(l - 1, -maxLane));
          } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < -30) {
              triggerJump();
          } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 30) {
              triggerSlide();
          } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
              activateImmortality();
          }
      };
  
      window.addEventListener('touchstart', handleTouchStart);
      window.addEventListener('touchend', handleTouchEnd);
      return () => {
          window.removeEventListener('touchstart', handleTouchStart);
          window.removeEventListener('touchend', handleTouchEnd);
      };
    }, [status, laneCount, hasDoubleJump, activateImmortality, triggerSlide]);
  
    // --- Animation Loop ---
    useFrame((state, delta) => {
      if (!groupRef.current) return;
      if (status !== GameStatus.PLAYING && status !== GameStatus.SHOP) return;
  
      // Stamina Regen (approx 10 per second)
      regenStamina(10 * delta);
  
      // 1. Horizontal Position with Inertia (Spring Physics)
      targetX.current = lane * LANE_WIDTH;
      
      // F = -kx - cv
      // Force = (Target - Current) * Stiffness - Velocity * Damping
      const distance = targetX.current - currentX.current;
      const force = distance * SPRING_STIFFNESS;
      const dampingForce = -velocityX.current * SPRING_DAMPING;
      const acceleration = force + dampingForce;
      
      // Euler Integration
      const safeDelta = Math.min(delta, 0.1);
      velocityX.current += acceleration * safeDelta;
      currentX.current += velocityX.current * safeDelta;
  
      groupRef.current.position.x = currentX.current;
  
      // 2. Physics (Jump)
      if (isJumping.current) {
          groupRef.current.position.y += velocityY.current * safeDelta;
          velocityY.current -= GRAVITY * safeDelta;
  
          // Ground Check (Simplified: floor is 0)
          // LevelManager handles Pits via collision logic
          if (groupRef.current.position.y <= 0) {
              groupRef.current.position.y = 0;
              isJumping.current = false;
              jumpsPerformed.current = 0;
              velocityY.current = 0;
              if (bodyRef.current) {
                  bodyRef.current.rotation.x = 0;
                  bodyRef.current.rotation.y = 0;
              }
          }
  
          if (jumpsPerformed.current === 2 && bodyRef.current) {
               // Front Flip
               rollRotation.current -= safeDelta * 18;
               if (rollRotation.current < -Math.PI * 2) rollRotation.current = -Math.PI * 2;
               bodyRef.current.rotation.x = rollRotation.current;
          } else if (bodyRef.current) {
               // Agile Lean
               bodyRef.current.rotation.x = 0.3; 
          }
      } else {
          // Not Jumping
          if (isSliding && bodyRef.current) {
              // Slide (Lean back and get low)
              const slideSpeed = safeDelta * 15;
              bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, -1.2, slideSpeed);
              bodyRef.current.position.y = 0.3; 
          } else if (bodyRef.current) {
               // Running Lean
               bodyRef.current.rotation.x = 0.2; 
               // Bobbing
               bodyRef.current.position.y = 0.8 + Math.abs(Math.sin(state.clock.elapsedTime * 18)) * 0.1;
          }
      }
  
      // 3. Banking (Lean based on velocity, giving physics feel)
      // We lean based on velocity, not just position, for a more dynamic turn
      const bankAngle = -velocityX.current * 0.05;
      const clampedBank = Math.max(Math.min(bankAngle, 0.5), -0.5);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, clampedBank, safeDelta * 10);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, clampedBank * 0.5, safeDelta * 10);
  
      // 4. Limb Animation
      const time = state.clock.elapsedTime * 25; 
      
      if (!isJumping.current && !isSliding) {
          if (leftArmRef.current) {
              leftArmRef.current.rotation.x = 1.2 + Math.sin(time) * 0.5; 
              leftArmRef.current.rotation.z = 0.2;
          }
          if (rightArmRef.current) {
              rightArmRef.current.rotation.x = 1.2 + Math.sin(time + Math.PI) * 0.5; 
              rightArmRef.current.rotation.z = -0.2;
          }
          if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(time + Math.PI) * 1.4;
          if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(time) * 1.4;
      } else if (isSliding) {
          const tuckSpeed = safeDelta * 20;
          if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0, tuckSpeed);
          if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, tuckSpeed);
          if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, -1.5, tuckSpeed);
          if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, -1.5, tuckSpeed);
      } else {
          const jumpPoseSpeed = safeDelta * 10;
          if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -2.0, jumpPoseSpeed); 
          if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -2.0, jumpPoseSpeed);
          if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0.2, jumpPoseSpeed);
          if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, -0.2, jumpPoseSpeed);
      }
  
      // 5. Divine Heart Pulse
      if (soulRef.current) {
          const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.2;
          soulRef.current.scale.set(scale, scale, scale);
      }
  
      // 6. Divine Shield / Immortality Effect
      if (shieldRef.current) {
          if (isShieldActive) {
              shieldRef.current.visible = true;
              shieldRef.current.rotation.y += safeDelta * 2;
          } else {
              shieldRef.current.visible = false;
          }
      }
  
      if (isImmortalityActive) {
          groupRef.current.visible = Math.random() > 0.3; 
      } else if (isInvincible.current) {
           if (Date.now() - lastDamageTime.current > 1500) {
              isInvincible.current = false;
              groupRef.current.visible = true;
           } else {
              groupRef.current.visible = Math.floor(Date.now() / 50) % 2 === 0;
           }
      } else {
          groupRef.current.visible = true;
      }
    });
  
    useEffect(() => {
       const checkHit = (e: any) => {
          if (isInvincible.current || isImmortalityActive || isShieldActive) return;
          audio.playDamage();
          takeDamage();
          isInvincible.current = true;
          lastDamageTime.current = Date.now();
       };
       window.addEventListener('player-hit', checkHit);
       return () => window.removeEventListener('player-hit', checkHit);
    }, [takeDamage, isImmortalityActive, isShieldActive]);
  
    return (
      <group ref={groupRef} position={[0, 0, 0]}>
        {/* God's Shield Bubble */}
        <mesh ref={shieldRef} visible={false} position={[0, 0.8, 0]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshBasicMaterial color="#ffd700" transparent opacity={0.3} wireframe />
        </mesh>
  
        <group ref={bodyRef} position={[0, 0.8, 0]}> 
          
          {/* Torso (Tunic) */}
          <mesh castShadow position={[0, 0.2, 0]} geometry={TORSO_GEO} material={tunicMaterial} />
          
          {/* Belt/Sash (Gold) */}
          <mesh position={[0, -0.05, 0]} scale={[1.05, 0.2, 1.05]}>
              <boxGeometry args={[0.45, 0.4, 0.25]} />
              <meshStandardMaterial color={charConfig.colors.accent} metalness={0.6} />
          </mesh>
          
          {/* Head */}
          <group position={[0, 0.65, 0]}>
              <mesh castShadow geometry={HEAD_GEO} material={skinMaterial} />
              {/* Eyes */}
              <mesh position={[0.1, 0.05, 0.21]} scale={[0.08, 0.05, 0.02]}>
                   <boxGeometry />
                   <meshBasicMaterial color={charConfig.colors.effect} />
              </mesh>
              <mesh position={[-0.1, 0.05, 0.21]} scale={[0.08, 0.05, 0.02]}>
                   <boxGeometry />
                   <meshBasicMaterial color={charConfig.colors.effect} />
              </mesh>
  
              {/* Character Specific Headgear */}
              {selectedCharacterId === 'SPARTAN' && (
                  <mesh position={[0, 0.35, 0]} geometry={CREST_GEO} material={crestMaterial} />
              )}
              
              {/* Laurel Wreath (For Hero & Hermes) */}
              {selectedCharacterId !== 'SPARTAN' && (
                   <mesh position={[0, 0.15, 0]} rotation={[-Math.PI/2 - 0.2, 0, 0]} geometry={LAUREL_GEO} material={laurelMaterial} />
              )}
          </group>
  
          {/* Divine Heart (Chest) */}
          <group ref={soulRef} position={[0, 0.2, 0.15]}>
              <mesh geometry={HEART_GEO} material={divineMaterial} />
              <pointLight distance={2} intensity={0.8} color={charConfig.colors.effect} />
          </group>
  
          {/* Arms */}
          <group position={[0.3, 0.35, 0]}>
              <group ref={rightArmRef} position={[0, 0, 0]}>
                  <mesh position={[0, -0.25, 0]} castShadow geometry={LIMB_GEO} material={skinMaterial} />
                  <mesh position={[0, -0.4, 0]} scale={[1.2, 0.3, 1.2]} geometry={LIMB_GEO} material={goldMaterial} /> {/* Bracer */}
              </group>
          </group>
          <group position={[-0.3, 0.35, 0]}>
              <group ref={leftArmRef} position={[0, 0, 0]}>
                   <mesh position={[0, -0.25, 0]} castShadow geometry={LIMB_GEO} material={skinMaterial} />
                   <mesh position={[0, -0.4, 0]} scale={[1.2, 0.3, 1.2]} geometry={LIMB_GEO} material={goldMaterial} />
              </group>
          </group>
  
          {/* Legs */}
          <group position={[0.15, -0.1, 0]}>
              <group ref={rightLegRef} position={[0,0,0]}>
                   <mesh position={[0, -0.25, 0]} castShadow geometry={LIMB_GEO} material={skinMaterial} />
                   {/* Sandal */}
                   <mesh position={[0, -0.5, 0.05]} scale={[1.2, 0.1, 1.5]}>
                       <boxGeometry args={[0.1,0.5,0.2]} />
                       <meshStandardMaterial color="#8d6e63" />
                   </mesh>
                   {/* Hermes Wings */}
                   {selectedCharacterId === 'HERMES' && (
                       <mesh position={[0.1, -0.4, 0]} rotation={[0,0,-0.5]} geometry={WING_GEO}>
                            <meshStandardMaterial color="#ffffff" />
                       </mesh>
                   )}
              </group>
          </group>
          <group position={[-0.15, -0.1, 0]}>
              <group ref={leftLegRef} position={[0,0,0]}>
                   <mesh position={[0, -0.25, 0]} castShadow geometry={LIMB_GEO} material={skinMaterial} />
                   {/* Sandal */}
                   <mesh position={[0, -0.5, 0.05]} scale={[1.2, 0.1, 1.5]}>
                       <boxGeometry args={[0.1,0.5,0.2]} />
                       <meshStandardMaterial color="#8d6e63" />
                   </mesh>
                   {/* Hermes Wings */}
                   {selectedCharacterId === 'HERMES' && (
                       <mesh position={[-0.1, -0.4, 0]} rotation={[0,0,0.5]} geometry={WING_GEO}>
                            <meshStandardMaterial color="#ffffff" />
                       </mesh>
                   )}
              </group>
          </group>
        </group>
        
        {/* Shadow */}
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI/2, 0, 0]} geometry={new THREE.CircleGeometry(0.4, 16)} material={shadowMaterial} />
      </group>
    );
  };