/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import type { ThreeElements } from '@react-three/fiber';

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {
        group: any;
        mesh: any;
        meshStandardMaterial: any;
        meshBasicMaterial: any;
        pointLight: any;
        ambientLight: any;
        directionalLight: any;
        spotLight: any;
        bufferGeometry: any;
        bufferAttribute: any;
        points: any;
        pointsMaterial: any;
        planeGeometry: any;
        boxGeometry: any;
        sphereGeometry: any;
        coneGeometry: any;
        cylinderGeometry: any;
        dodecahedronGeometry: any;
        instancedMesh: any;
        color: any;
        fog: any;
    }
  }
}

export enum GameStatus {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  SHOP = 'SHOP',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export enum ZoneType {
    NORMAL = 'NORMAL',
    SAFE = 'SAFE',   // Elysium: No obstacles, rewards only, wide camera
    DANGER = 'DANGER' // Tartarus: High density, close camera, red fog
}

export enum ObjectType {
  OBSTACLE = 'OBSTACLE', // Spikes / Trap (Jump over)
  TALL_OBSTACLE = 'TALL_OBSTACLE', // Pillar (Dodge)
  FLYING_OBSTACLE = 'FLYING_OBSTACLE', // Floating Arch/Harpy (Slide under)
  PIT = 'PIT', // Void/Lava Pit (Must Jump)
  BREAKABLE = 'BREAKABLE', // Pottery/Crate (Slide to destroy)
  HAMMER = 'HAMMER', // New: Rhythmic crushing obstacle
  
  GEM = 'GEM', // Drachma
  FRAGMENT = 'FRAGMENT', // Thunderbolt
  SHOP_PORTAL = 'SHOP_PORTAL',
  ENEMY = 'ENEMY', // Automaton
  FIREBALL = 'FIREBALL', // Missile
  
  // Power-ups
  BUFF_MAGNET = 'BUFF_MAGNET',
  BUFF_MULTIPLIER = 'BUFF_MULTIPLIER',
  BUFF_HEAL = 'BUFF_HEAL',
  BUFF_INVINCIBLE = 'BUFF_INVINCIBLE',
  
  // Markers
  WARNING = 'WARNING' // Visual indicator
}

export interface GameObject {
  id: string;
  type: ObjectType;
  position: [number, number, number]; // x, y, z
  active: boolean;
  color?: string;
  points?: number; 
  hasFired?: boolean; 
  passed?: boolean; // For Combo tracking
  // For rhythmic objects
  phaseOffset?: number; 
  speed?: number;
  variant?: string;
}

export const LANE_WIDTH = 2.2;
export const JUMP_HEIGHT = 2.8; 
export const JUMP_DURATION = 0.55; 
export const SLIDE_DURATION = 0.8; 
export const RUN_SPEED_BASE = 22.8; 
export const SPAWN_DISTANCE = 120;
export const REMOVE_DISTANCE = 20;

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    icon: any; 
    oneTime?: boolean; 
}

export interface CharacterConfig {
    id: string;
    name: string;
    description: string;
    cost: number;
    iconKey: string; 
    colors: {
        tunic: string;
        skin: string;
        accent: string; // Gold/Bronze/Silver
        effect: string; // Eye/Magic color
    }
}