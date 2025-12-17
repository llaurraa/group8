/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useEffect } from 'react';
import { Heart, Zap, Trophy, Shield, PlusCircle, Play, Magnet, X, Sun, CloudLightning, User, ShoppingBag, Crown, Sword, Wind, Flame, Home, ArrowBigUp, Sparkles, Plus } from 'lucide-react';
import { useStore, CHARACTERS } from '../../store';
import { GameStatus, ShopItem, RUN_SPEED_BASE } from '../../types';
import { audio } from '../System/Audio';
import { Canvas } from '@react-three/fiber';
import { CharacterPreview } from '../World/Player';
import { Lobby } from './Lobby'; // Import the new Lobby

// --- Custom Icon Components for Shop Items ---

const IconMaxLife: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        {/* Base Heart */}
        <Heart className="w-full h-full text-red-600 fill-red-900/80 drop-shadow-lg stroke-2" />
        {/* Upgrade Arrow Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pt-1">
            <ArrowBigUp className="w-2/3 h-2/3 text-yellow-300 fill-yellow-400 drop-shadow-md animate-pulse" strokeWidth={1.5} />
        </div>
    </div>
);

const IconHeal: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        {/* Glowing Circle Container */}
        <div className="w-full h-full rounded-full border-4 border-green-500/50 bg-green-900/30 flex items-center justify-center shadow-[0_0_15px_rgba(74,222,128,0.4)]">
             <Plus className="w-2/3 h-2/3 text-green-400 stroke-[4] drop-shadow-sm" />
        </div>
        {/* Sparkles */}
        <Sparkles className="absolute -top-1 -right-2 w-1/2 h-1/2 text-yellow-200 fill-white animate-bounce" strokeWidth={1} />
    </div>
);

const IconAegis: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        {/* Gold Shield */}
        <Shield className="w-full h-full text-yellow-500 fill-yellow-800/80 drop-shadow-xl" />
        {/* Lightning Emblem */}
        <div className="absolute inset-0 flex items-center justify-center">
             <Zap className="w-1/2 h-1/2 text-blue-300 fill-blue-100 drop-shadow-[0_0_5px_rgba(147,197,253,0.8)]" />
        </div>
    </div>
);

const SHOP_ITEMS: ShopItem[] = [
    {
        id: 'MAX_LIFE',
        name: '海克力斯之心',
        description: '永久增加最大生命',
        cost: 2000,
        icon: IconMaxLife
    },
    {
        id: 'HEAL',
        name: '神之饌 (Ambrosia)',
        description: '恢復一點生命',
        cost: 1000,
        icon: IconHeal
    },
    {
        id: 'IMMORTAL',
        name: '埃癸斯之盾',
        description: '獲得短暫無敵',
        cost: 3000,
        icon: IconAegis,
        oneTime: true
    }
];

// Map string keys to Components
const ICON_MAP: Record<string, any> = {
    'HERO': Crown,
    'SPARTAN': Sword,
    'HERMES': Wind
};

// Laurel Icon
const LaurelIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12,2L14.5,8L19,9L15,12.5L16.5,18L12,15L7.5,18L9,12.5L5,9L9.5,8L12,2M12,4.5L10.5,8.2L7.2,8.8L9.9,11.2L9,14.8L12,12.8L15,14.8L14.1,11.2L16.8,8.8L13.5,8.2L12,4.5Z" />
    </svg>
);

const ShopScreen: React.FC = () => {
    const { score, buyItem, closeShop, hasImmortality, unlockCharacter, selectCharacter, unlockedCharacterIds, selectedCharacterId, previousStatus } = useStore();
    const [items, setItems] = useState<ShopItem[]>([]);
    const [activeTab, setActiveTab] = useState<'ITEMS' | 'CHARS'>('ITEMS');

    useEffect(() => {
        let pool = SHOP_ITEMS.filter(item => {
            if (item.id === 'IMMORTAL' && hasImmortality) return false;
            return true;
        });
        setItems(pool);
    }, [hasImmortality]);

    const isResuming = previousStatus === GameStatus.PLAYING;

    return (
        <div className="absolute inset-0 bg-[#0d47a1]/95 z-[100] text-[#fff] pointer-events-auto backdrop-blur-md overflow-y-auto font-serif">
             <div className="flex flex-col items-center justify-center min-h-full py-8 px-4">
                 <h2 className="text-4xl md:text-5xl font-black text-[#ffd700] mb-2 tracking-widest text-center drop-shadow-md uppercase border-b-4 border-[#ffd700] pb-2">奧林帕斯市集</h2>
                 
                 <div className="flex items-center text-[#fff] mb-6 md:mb-8 bg-black/20 px-6 py-2 rounded-full border border-[#ffd700] shadow-md">
                     <span className="text-base md:text-lg mr-2 font-bold text-[#e3f2fd]">財富:</span>
                     <span className="text-xl md:text-2xl font-bold text-[#ffd700]">{score.toLocaleString()}</span>
                 </div>

                 {/* Tab Switcher */}
                 <div className="flex space-x-4 mb-6">
                     <button 
                        onClick={() => setActiveTab('ITEMS')}
                        className={`flex items-center px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'ITEMS' ? 'bg-[#ffd700] text-[#0d47a1]' : 'bg-[#1565c0] text-white hover:bg-[#1976d2]'}`}
                     >
                        <ShoppingBag className="w-4 h-4 mr-2"/> 道具
                     </button>
                     <button 
                        onClick={() => setActiveTab('CHARS')}
                        className={`flex items-center px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'CHARS' ? 'bg-[#ffd700] text-[#0d47a1]' : 'bg-[#1565c0] text-white hover:bg-[#1976d2]'}`}
                     >
                        <User className="w-4 h-4 mr-2"/> 角色
                     </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl w-full mb-8">
                     {activeTab === 'ITEMS' && items.map(item => {
                         const Icon = item.icon;
                         const canAfford = score >= item.cost;
                         return (
                             <div key={item.id} className="bg-[#1565c0] border-2 border-[#64b5f6] p-4 md:p-6 rounded-xl flex flex-col items-center text-center hover:border-[#ffd700] transition-colors shadow-lg group">
                                 {/* Icon Container with Hover Glow */}
                                 <div className="bg-[#0d47a1] p-3 md:p-4 rounded-full mb-3 md:mb-4 border border-[#ffd700] w-20 h-20 md:w-24 md:h-24 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                     <Icon className="w-full h-full" />
                                 </div>
                                 <h3 className="text-lg md:text-xl font-bold mb-2 text-[#fff]">{item.name}</h3>
                                 <p className="text-[#bbdefb] text-xs md:text-sm mb-4 h-10 md:h-12 flex items-center justify-center font-medium">{item.description}</p>
                                 <button 
                                    onClick={() => buyItem(item.id as any, item.cost)}
                                    disabled={!canAfford}
                                    className={`px-4 md:px-6 py-2 rounded-lg font-bold w-full text-sm md:text-base transition-all ${canAfford ? 'bg-[#ffd700] text-[#0d47a1] hover:bg-[#ffea00]' : 'bg-[#424242] cursor-not-allowed opacity-50'}`}
                                 >
                                     {item.cost} 金幣
                                 </button>
                             </div>
                         );
                     })}

                     {activeTab === 'CHARS' && CHARACTERS.map(char => {
                         const isUnlocked = unlockedCharacterIds.includes(char.id);
                         const isSelected = selectedCharacterId === char.id;
                         const canAfford = score >= char.cost;
                         
                         return (
                             <div key={char.id} className={`bg-[#1565c0] border-2 ${isSelected ? 'border-[#00e676]' : 'border-[#64b5f6]'} p-4 md:p-6 rounded-xl flex flex-col items-center text-center hover:border-[#ffd700] transition-colors shadow-lg`}>
                                 {/* 3D Preview Canvas */}
                                 <div className="w-32 h-32 mb-3 rounded-full overflow-hidden border-4 border-[#fff] shadow-inner bg-gradient-to-b from-[#4fc3f7] to-[#0288d1]">
                                     <Canvas camera={{ position: [0, 1.2, 3], fov: 45 }}>
                                         <ambientLight intensity={0.8} />
                                         <directionalLight position={[2, 5, 2]} intensity={1.5} />
                                         <CharacterPreview characterId={char.id} />
                                     </Canvas>
                                 </div>
                                 
                                 <h3 className="text-lg md:text-xl font-bold mb-2 text-[#fff]">{char.name}</h3>
                                 <p className="text-[#bbdefb] text-xs md:text-sm mb-4 h-10 md:h-12 flex items-center justify-center font-medium px-2">{char.description}</p>
                                 
                                 {isUnlocked ? (
                                     <button 
                                        onClick={() => selectCharacter(char.id)}
                                        disabled={isSelected}
                                        className={`px-4 md:px-6 py-2 rounded-lg font-bold w-full text-sm md:text-base transition-all ${isSelected ? 'bg-[#00e676] text-[#0d47a1]' : 'bg-[#ffd700] text-[#0d47a1] hover:bg-[#ffea00]'}`}
                                     >
                                         {isSelected ? '已選擇' : '選擇'}
                                     </button>
                                 ) : (
                                     <button 
                                        onClick={() => unlockCharacter(char.id, char.cost)}
                                        disabled={!canAfford}
                                        className={`px-4 md:px-6 py-2 rounded-lg font-bold w-full text-sm md:text-base transition-all ${canAfford ? 'bg-[#ffd700] text-[#0d47a1] hover:bg-[#ffea00]' : 'bg-[#424242] cursor-not-allowed opacity-50'}`}
                                     >
                                         {char.cost} 金幣
                                     </button>
                                 )}
                             </div>
                         );
                     })}
                 </div>

                 <button 
                    onClick={closeShop}
                    className="flex items-center px-8 md:px-10 py-3 md:py-4 bg-[#0288d1] text-white font-bold text-lg md:text-xl rounded-xl hover:scale-105 transition-all shadow-lg border-b-4 border-[#01579b]"
                 >
                     {isResuming ? "繼續征途" : "重返大廳"} 
                     <Play className="ml-2 w-5 h-5" fill="white" />
                 </button>
             </div>
        </div>
    );
};

export const HUD: React.FC = () => {
  const { 
      score, highScore, lives, maxLives, fragmentsCollected, status, level, 
      restartGame, startGame, scarabsCollected, distance, 
      isImmortalityActive, speed, isMagnetActive, isMultiplierActive, isShieldActive,
      stamina, maxStamina, combo, returnToMenu
  } = useStore();
  const FRAGMENT_TARGET = 5;

  const containerClass = "absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-8 z-50 font-serif";

  // Level Names
  const getLevelName = (lvl: number) => {
      switch(lvl) {
          case 1: return "奧林帕斯天路";
          case 2: return "冥府深淵";
          case 3: return "亞特蘭提斯";
          case 4: return "特洛伊戰場";
          case 5: return "混沌虛空";
          default: return `神之領域 ${lvl}`;
      }
  };

  if (status === GameStatus.SHOP) {
      return <ShopScreen />;
  }

  // REPLACED OLD MENU WITH NEW LOBBY COMPONENT
  if (status === GameStatus.MENU) {
      return <Lobby />;
  }

  if (status === GameStatus.GAME_OVER) {
      return (
          <div className="absolute inset-0 bg-[#0d47a1]/95 z-[100] text-[#fff] pointer-events-auto backdrop-blur-sm overflow-y-auto font-serif">
              <div className="flex flex-col items-center justify-center min-h-full py-8 px-4">
                <h1 className="text-4xl md:text-6xl font-black text-[#e57373] mb-6 drop-shadow-lg text-center uppercase">殞落</h1>
                
                <div className="grid grid-cols-1 gap-3 md:gap-4 text-center mb-8 w-full max-w-md text-[#fff]">
                    <div className="bg-[#1565c0] p-3 md:p-4 rounded-xl border border-[#42a5f5] flex items-center justify-between shadow-lg">
                        <div className="flex items-center text-[#bbdefb] text-sm md:text-base font-bold"><Trophy className="mr-2 w-4 h-4 md:w-5 md:h-5"/> 本次得分</div>
                        <div className="text-xl md:text-2xl font-bold">{score.toLocaleString()}</div>
                    </div>
                    {score >= highScore && score > 0 && (
                        <div className="bg-[#ffd700]/20 p-2 rounded-lg text-[#ffd700] font-bold animate-pulse text-center">
                            創造新紀錄！
                        </div>
                    )}
                    <div className="bg-[#1565c0] p-3 md:p-4 rounded-xl border border-[#42a5f5] flex items-center justify-between shadow-lg">
                        <div className="flex items-center text-[#bbdefb] text-sm md:text-base font-bold"><Trophy className="mr-2 w-4 h-4 md:w-5 md:h-5"/> 歷史最高</div>
                        <div className="text-xl md:text-2xl font-bold text-[#ffd700]">{highScore.toLocaleString()}</div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                    <button 
                      onClick={returnToMenu}
                      className="px-8 md:px-10 py-3 md:py-4 bg-[#1565c0] text-[#fff] font-bold text-lg md:text-xl rounded-xl hover:bg-[#1976d2] transition-all shadow-lg border-b-4 border-[#0d47a1] flex items-center justify-center"
                    >
                        <Home className="mr-2 w-5 h-5" /> 返回大廳
                    </button>
                    <button 
                      onClick={() => { audio.init(); restartGame(); }}
                      className="px-8 md:px-10 py-3 md:py-4 bg-[#ffd700] text-[#0d47a1] font-bold text-lg md:text-xl rounded-xl hover:scale-105 transition-all shadow-lg border-b-4 border-[#fbc02d] flex items-center justify-center"
                    >
                        <Play className="mr-2 w-5 h-5 fill-[#0d47a1]" /> 再次挑戰
                    </button>
                </div>
              </div>
          </div>
      );
  }

  if (status === GameStatus.VICTORY) {
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-[#4fc3f7] to-[#0288d1] z-[100] text-[#fff] pointer-events-auto backdrop-blur-md overflow-y-auto font-serif">
            <div className="flex flex-col items-center justify-center min-h-full py-8 px-4">
                <CloudLightning className="w-16 h-16 md:w-24 md:h-24 text-[#ffd700] mb-4 animate-bounce drop-shadow-lg" />
                <h1 className="text-3xl md:text-6xl font-black text-[#fff] mb-2 drop-shadow-md text-center leading-tight">
                    晉升神格
                </h1>
                <p className="text-[#e1f5fe] text-sm md:text-2xl font-bold mb-8 tracking-widest text-center">
                    您已收集所有雷霆，征服了五界！
                </p>
                
                <div className="bg-white/20 p-6 rounded-2xl border border-[#fff] shadow-xl mb-8 w-full max-w-md text-center">
                    <div className="text-xs md:text-sm text-[#e1f5fe] mb-1 font-bold">最終榮耀</div>
                    <div className="text-4xl md:text-5xl font-black text-[#ffd700] drop-shadow-sm">{score.toLocaleString()}</div>
                </div>

                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                     <button 
                      onClick={returnToMenu}
                      className="px-8 md:px-10 py-3 md:py-4 bg-[#1565c0] text-[#fff] font-bold text-lg md:text-xl rounded-xl hover:bg-[#1976d2] transition-all shadow-lg border-b-4 border-[#0d47a1] flex items-center justify-center"
                    >
                        <Home className="mr-2 w-5 h-5" /> 返回大廳
                    </button>
                    <button 
                      onClick={() => { audio.init(); restartGame(); }}
                      className="px-8 md:px-12 py-4 md:py-5 bg-[#ffd700] text-[#0d47a1] font-black text-lg md:text-xl rounded-xl hover:scale-105 transition-all shadow-xl"
                    >
                        開啟新紀元
                    </button>
                </div>
            </div>
        </div>
    );
  }

  // Stamina Percentage
  const staminaPct = (stamina / maxStamina) * 100;

  return (
    <div className={containerClass}>
        {/* Top Bar */}
        <div className="flex justify-between items-start w-full">
            <div className="flex flex-col">
                <div className={`text-3xl md:text-5xl font-black drop-shadow-[0_2px_0_rgba(0,0,0,0.5)] transition-colors duration-300 ${isMultiplierActive ? 'text-[#00e676] scale-110 origin-left' : 'text-[#ffd700]'}`}>
                    {score.toLocaleString()} {isMultiplierActive && <span className="text-lg align-top ml-1">x2</span>}
                </div>
                
                {/* Combo Counter */}
                {combo > 1 && (
                    <div className="text-[#00e676] text-xl md:text-3xl font-black italic mt-1 drop-shadow-md animate-pulse">
                        {combo} COMBO!
                    </div>
                )}
            </div>
            
            <div className="flex flex-col items-end">
                <div className="flex space-x-1 md:space-x-2 mb-2">
                    {[...Array(maxLives)].map((_, i) => (
                        <LaurelIcon 
                            key={i} 
                            className={`w-6 h-6 md:w-8 md:h-8 ${i < lives ? 'text-[#00e5ff] drop-shadow-sm' : 'text-gray-500'} transition-all duration-300`} 
                        />
                    ))}
                </div>
                {/* Stamina Bar */}
                <div className="w-32 h-3 bg-black/40 rounded-full overflow-hidden border border-[#42a5f5]">
                    <div 
                        className="h-full bg-gradient-to-r from-[#00e676] to-[#00b0ff] transition-all duration-100 ease-out" 
                        style={{ width: `${staminaPct}%` }}
                    />
                </div>
                <div className="text-[10px] font-bold text-[#e3f2fd] mt-1 flex items-center">
                    <Flame className="w-3 h-3 mr-1 text-[#00e676]"/> 體力
                </div>
            </div>
        </div>
        
        {/* Level Indicator */}
        <div className="absolute top-5 left-1/2 transform -translate-x-1/2 text-sm md:text-lg text-[#ffd700] font-bold tracking-wider bg-[#0d47a1]/80 px-4 py-1 rounded-full border border-[#42a5f5] backdrop-blur-sm z-50 shadow-sm whitespace-nowrap">
            {getLevelName(level)}
        </div>

        {/* Buff Indicators */}
        <div className="absolute top-24 left-4 flex flex-col space-y-2">
            {isMagnetActive && (
                 <div className="flex items-center bg-[#ff1744]/20 border border-[#ff1744] text-[#ff1744] px-3 py-1 rounded-lg animate-pulse backdrop-blur-sm">
                     <Magnet className="w-5 h-5 mr-2" /> 磁力吸引
                 </div>
            )}
            {isMultiplierActive && (
                 <div className="flex items-center bg-[#00e676]/20 border border-[#00e676] text-[#00e676] px-3 py-1 rounded-lg animate-pulse backdrop-blur-sm">
                     <X className="w-5 h-5 mr-2" /> 雙倍積分
                 </div>
            )}
            {isShieldActive && (
                 <div className="flex items-center bg-[#ffd700]/20 border border-[#ffd700] text-[#ffd700] px-3 py-1 rounded-lg animate-pulse backdrop-blur-sm">
                     <Shield className="w-5 h-5 mr-2" /> 神之盾
                 </div>
            )}
             {isImmortalityActive && (
                 <div className="flex items-center bg-[#fff176]/20 border border-[#fff176] text-[#fff176] px-3 py-1 rounded-lg animate-pulse backdrop-blur-sm">
                     <Shield className="w-5 h-5 mr-2" /> 埃癸斯守護
                 </div>
            )}
        </div>

        {/* Fragment Collection Status */}
        <div className="absolute top-16 md:top-24 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-[#0d47a1]/60 px-4 py-2 rounded-xl border border-[#42a5f5] backdrop-blur-sm">
             <div className="text-[#fff] font-bold text-sm md:text-base mr-2">雷霆碎片</div>
             <div className="flex space-x-1">
                {[...Array(FRAGMENT_TARGET)].map((_, i) => (
                    <div 
                        key={i}
                        className={`w-4 h-4 md:w-6 md:h-6 rounded-sm rotate-45 border-2 transition-all duration-500 flex items-center justify-center ${
                            i < fragmentsCollected 
                            ? 'bg-[#ffd700] border-[#ffffff]' 
                            : 'bg-black/20 border-[#90caf9]'
                        }`}
                    >
                         {i < fragmentsCollected && <Zap className="w-3 h-3 md:w-4 md:h-4 text-[#e65100] -rotate-45" />}
                    </div>
                ))}
             </div>
        </div>

        {/* Bottom Overlay */}
        <div className="w-full flex justify-end items-end">
             <div className="flex items-center space-x-2 text-[#fff] bg-[#0d47a1]/60 px-3 py-1 rounded-full font-bold border border-[#42a5f5]">
                 <Zap className="w-4 h-4 md:w-6 md:h-6 text-[#ffd700] fill-[#ffd700]" />
                 <span className="text-base md:text-xl">{Math.round((speed / RUN_SPEED_BASE) * 100)}%</span>
             </div>
        </div>
    </div>
  );
};