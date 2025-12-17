/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { create } from 'zustand';
import { GameStatus, RUN_SPEED_BASE, SLIDE_DURATION, CharacterConfig, ZoneType } from './types';
import { audio } from './components/System/Audio';

export const CHARACTERS: CharacterConfig[] = [
    {
        id: 'HERO',
        name: '奧林帕斯英雄',
        description: '被選中的半神，身穿潔白長袍。',
        cost: 0,
        iconKey: 'HERO',
        colors: { tunic: '#ffffff', skin: '#d7a173', accent: '#ffd700', effect: '#00b0ff' }
    },
    {
        id: 'SPARTAN',
        name: '斯巴達戰神',
        description: '身經百戰的勇士，身披鮮紅戰袍。',
        cost: 5000,
        iconKey: 'SPARTAN',
        colors: { tunic: '#b71c1c', skin: '#d7a173', accent: '#cd7f32', effect: '#ff1744' }
    },
    {
        id: 'HERMES',
        name: '天界信使',
        description: '迅捷如風，身穿天藍神裝。',
        cost: 12000,
        iconKey: 'HERMES',
        colors: { tunic: '#e3f2fd', skin: '#d7a173', accent: '#00e5ff', effect: '#ffffff' }
    }
];

interface GameState {
  status: GameStatus;
  previousStatus: GameStatus; // Added to track where we came from
  score: number;
  highScore: number; 
  lives: number;
  maxLives: number;
  speed: number;
  
  // Level Progress
  fragmentsCollected: number; 
  level: number;
  laneCount: number;
  scarabsCollected: number; 
  distance: number;
  currentZone: ZoneType;
  
  // Inventory / Abilities
  hasDoubleJump: boolean; 
  hasImmortality: boolean; 
  isImmortalityActive: boolean; 
  isSliding: boolean;

  // New Mechanics
  stamina: number;
  maxStamina: number;
  combo: number;

  // Active Buffs
  isMagnetActive: boolean;
  isMultiplierActive: boolean;
  isShieldActive: boolean; 

  // Limits
  healsSpawned: number;

  // Characters
  unlockedCharacterIds: string[];
  selectedCharacterId: string;

  // Actions
  startGame: () => void;
  restartGame: () => void;
  returnToMenu: () => void; 
  takeDamage: () => void;
  addScore: (amount: number) => void;
  collectScarab: (value: number) => void;
  collectFragment: () => void; 
  setDistance: (dist: number) => void;
  setZone: (zone: ZoneType) => void;
  
  // Mechanics Actions
  useStamina: (amount: number) => boolean;
  regenStamina: (amount: number) => void;
  addCombo: (amount: number) => void;
  resetCombo: () => void;
  incrementHealsSpawned: () => void;

  triggerSlide: () => void;
  activateBuff: (type: 'MAGNET' | 'MULTIPLIER' | 'INVINCIBLE') => void;
  heal: () => void; 

  buyItem: (type: 'MAX_LIFE' | 'HEAL' | 'IMMORTAL', cost: number) => boolean;
  unlockCharacter: (id: string, cost: number) => boolean;
  selectCharacter: (id: string) => void;
  
  advanceLevel: () => void;
  openShop: () => void;
  closeShop: () => void;
  activateImmortality: () => void;
}

const FRAGMENT_TARGET = 5; 
const MAX_LEVEL = 5; 

// Helper to get high score safely
const getStoredHighScore = () => {
    try {
        return parseInt(localStorage.getItem('olympus_high_score') || '0', 10);
    } catch (e) {
        return 0;
    }
};

const setStoredHighScore = (score: number) => {
    try {
        localStorage.setItem('olympus_high_score', score.toString());
    } catch (e) {}
};

export const useStore = create<GameState>((set, get) => ({
  status: GameStatus.MENU,
  previousStatus: GameStatus.MENU, // Default
  score: 0,
  highScore: getStoredHighScore(),
  lives: 3,
  maxLives: 3,
  speed: 0,
  fragmentsCollected: 0,
  level: 1,
  laneCount: 3,
  scarabsCollected: 0,
  distance: 0,
  currentZone: ZoneType.NORMAL,
  
  hasDoubleJump: true,
  hasImmortality: false,
  isImmortalityActive: false,
  isSliding: false,

  stamina: 100,
  maxStamina: 100,
  combo: 0,

  isMagnetActive: false,
  isMultiplierActive: false,
  isShieldActive: false,

  healsSpawned: 0,

  unlockedCharacterIds: ['HERO'],
  selectedCharacterId: 'HERO',

  startGame: () => {
    audio.startMusic();
    set((state) => ({ 
        status: GameStatus.PLAYING, 
        score: 0, 
        lives: 3, 
        maxLives: 3,
        speed: RUN_SPEED_BASE,
        fragmentsCollected: 0,
        level: 1,
        laneCount: 3,
        scarabsCollected: 0,
        distance: 0,
        currentZone: ZoneType.NORMAL,
        hasDoubleJump: true,
        hasImmortality: false,
        isImmortalityActive: false,
        isSliding: false,
        stamina: 100,
        combo: 0,
        isMagnetActive: false,
        isMultiplierActive: false,
        isShieldActive: false,
        healsSpawned: 0,
        unlockedCharacterIds: state.unlockedCharacterIds,
        selectedCharacterId: state.selectedCharacterId
  }))},

  restartGame: () => {
    audio.startMusic();
    set((state) => ({ 
        status: GameStatus.PLAYING, 
        score: 0, 
        lives: 3, 
        maxLives: 3,
        speed: RUN_SPEED_BASE,
        fragmentsCollected: 0,
        level: 1,
        laneCount: 3,
        scarabsCollected: 0,
        distance: 0,
        currentZone: ZoneType.NORMAL,
        hasDoubleJump: true,
        hasImmortality: false,
        isImmortalityActive: false,
        isSliding: false,
        stamina: 100,
        combo: 0,
        isMagnetActive: false,
        isMultiplierActive: false,
        isShieldActive: false,
        healsSpawned: 0,
        unlockedCharacterIds: state.unlockedCharacterIds,
        selectedCharacterId: state.selectedCharacterId
  }))},

  returnToMenu: () => {
      audio.stopMusic();
      set({ status: GameStatus.MENU });
  },

  useStamina: (amount) => {
      const { stamina } = get();
      if (stamina >= amount) {
          set({ stamina: stamina - amount });
          return true;
      }
      return false;
  },

  regenStamina: (amount) => set((state) => ({ 
      stamina: Math.min(state.stamina + amount, state.maxStamina) 
  })),

  addCombo: (amount) => set((state) => ({ combo: state.combo + amount })),
  resetCombo: () => set({ combo: 0 }),
  incrementHealsSpawned: () => set((state) => ({ healsSpawned: state.healsSpawned + 1 })),

  takeDamage: () => {
    const { lives, isImmortalityActive, isShieldActive } = get();
    if (isImmortalityActive || isShieldActive) return; 

    // Reset combo on hit
    set({ combo: 0 });

    if (lives > 1) {
      set({ lives: lives - 1 });
    } else {
      audio.stopMusic();
      const currentScore = get().score;
      const currentHigh = get().highScore;
      if (currentScore > currentHigh) {
          setStoredHighScore(currentScore);
      }
      set({ 
          lives: 0, 
          status: GameStatus.GAME_OVER, 
          speed: 0,
          highScore: Math.max(currentScore, currentHigh)
      });
    }
  },

  addScore: (amount) => set((state) => {
      // Combo Multiplier: 1 + (combo / 10)
      const multiplier = 1 + Math.floor(state.combo / 10) * 0.1;
      return { score: state.score + Math.floor(amount * multiplier) };
  }),
  
  collectScarab: (value) => {
    const { isMultiplierActive, score, scarabsCollected, combo } = get();
    // Multiplier buff stacks with Combo
    let finalValue = value;
    if (isMultiplierActive) finalValue *= 2;
    
    // Combo bonus for coins as well
    const comboMult = 1 + Math.floor(combo / 10) * 0.1;
    finalValue = Math.floor(finalValue * comboMult);

    set({ 
        score: score + finalValue, 
        scarabsCollected: scarabsCollected + 1 
    });
  },

  setDistance: (dist) => set({ distance: dist }),
  setZone: (zone) => set({ currentZone: zone }),

  heal: () => {
      const { lives, maxLives } = get();
      if (lives < maxLives) {
          set({ lives: lives + 1 });
      } else {
          get().addScore(500);
      }
  },

  collectFragment: () => {
    const { fragmentsCollected, level, speed } = get();
    const newCount = fragmentsCollected + 1;
    
    // Base speed increase per fragment
    let speedIncrease = RUN_SPEED_BASE * 0.08; 
    
    // RAMP UP: Increase speed more aggressively in higher levels
    // MODIFIED: Reduced intensity for levels 4 and 5 to prevent uncontrollable speed
    if (level === 4) speedIncrease *= 1.0; // Was 1.2
    if (level === 5) speedIncrease *= 1.15; // Was 1.5

    const nextSpeed = speed + speedIncrease;

    set({ 
      fragmentsCollected: newCount,
      speed: nextSpeed
    });

    if (newCount >= FRAGMENT_TARGET) {
      if (level < MAX_LEVEL) {
          get().advanceLevel();
      } else {
          audio.stopMusic();
          const currentScore = get().score + 20000;
          const currentHigh = get().highScore;
          if (currentScore > currentHigh) {
              setStoredHighScore(currentScore);
          }
          set({
              status: GameStatus.VICTORY,
              score: currentScore,
              highScore: Math.max(currentScore, currentHigh)
          });
      }
    }
  },

  triggerSlide: () => {
    const { isSliding, useStamina } = get();
    // Slide costs 15 Stamina
    if (!isSliding) {
        if (useStamina(15)) {
            set({ isSliding: true });
            setTimeout(() => {
                set({ isSliding: false });
            }, SLIDE_DURATION * 1000);
        }
    }
  },

  activateBuff: (type) => {
      if (type === 'MAGNET') {
          set({ isMagnetActive: true });
          setTimeout(() => set({ isMagnetActive: false }), 8000); 
      } else if (type === 'MULTIPLIER') {
          set({ isMultiplierActive: true });
          setTimeout(() => set({ isMultiplierActive: false }), 10000); 
      } else if (type === 'INVINCIBLE') {
          set({ isShieldActive: true });
          setTimeout(() => set({ isShieldActive: false }), 8000); 
      }
  },

  advanceLevel: () => {
      const { level, laneCount, speed } = get();
      const nextLevel = level + 1;
      
      // PROGRESSIVE SPEED BOOST
      // Matched to new 15/25/35/45 curve -> Adjusted to be gentler for 3, 4, 5
      let boostFactor = 0.15; // +15% for Level 2
      if (nextLevel === 3) boostFactor = 0.10; // Was 0.15
      if (nextLevel === 4) boostFactor = 0.10; // Was 0.15
      if (nextLevel === 5) boostFactor = 0.12; // Was 0.20

      const speedIncrease = RUN_SPEED_BASE * boostFactor; 
      const newSpeed = speed + speedIncrease;

      set({
          level: nextLevel,
          laneCount: 3, // Fixed at 3 lanes
          status: GameStatus.PLAYING, 
          speed: newSpeed,
          fragmentsCollected: 0,
          currentZone: ZoneType.NORMAL, // Reset zone
          isMagnetActive: false,
          isMultiplierActive: false,
          isShieldActive: false
      });
  },

  openShop: () => set((state) => ({ status: GameStatus.SHOP, previousStatus: state.status })),
  closeShop: () => set((state) => ({ status: state.previousStatus })),

  buyItem: (type, cost) => {
      const { score, maxLives, lives } = get();
      
      if (score >= cost) {
          set({ score: score - cost });
          switch (type) {
              case 'MAX_LIFE':
                  set({ maxLives: maxLives + 1, lives: lives + 1 });
                  break;
              case 'HEAL':
                  set({ lives: Math.min(lives + 1, maxLives) });
                  break;
              case 'IMMORTAL':
                  set({ hasImmortality: true });
                  break;
          }
          audio.playGemCollect(); // Sound effect
          return true;
      }
      return false;
  },

  unlockCharacter: (id, cost) => {
      const { score, unlockedCharacterIds } = get();
      if (score >= cost && !unlockedCharacterIds.includes(id)) {
          set({ 
              score: score - cost,
              unlockedCharacterIds: [...unlockedCharacterIds, id],
              selectedCharacterId: id
          });
          return true;
      }
      return false;
  },

  selectCharacter: (id) => set({ selectedCharacterId: id }),

  activateImmortality: () => {
      const { hasImmortality, isImmortalityActive } = get();
      if (hasImmortality && !isImmortalityActive) {
          set({ hasImmortality: false, isImmortalityActive: true });
          setTimeout(() => {
              set({ isImmortalityActive: false });
          }, 5000);
      }
  }
}));