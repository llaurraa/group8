/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useEffect } from 'react';
import { useStore, CHARACTERS } from '../../store';
import { audio } from '../System/Audio';
import { Canvas, useFrame } from '@react-three/fiber';
import { CharacterPreview } from '../World/Player';
import { Environment } from '../World/Environment';
import { Play, Trophy, ShoppingBag, ChevronLeft, ChevronRight, Lock, Crown, Map, Zap, CheckCircle, Coins } from 'lucide-react';

const LEVEL_INFO = [
    { id: 1, name: "奧林帕斯", color: "from-[#0d47a1] to-[#e3f2fd]", icon: Crown, desc: "神聖殿堂" },
    { id: 2, name: "冥府深淵", color: "from-[#4a0000] to-[#ef5350]", icon: Map, desc: "岩漿地獄" },
    { id: 3, name: "亞特蘭提斯", color: "from-[#004d40] to-[#00e5ff]", icon: Zap, desc: "深海遺跡" },
    { id: 4, name: "特洛伊", color: "from-[#3e2723] to-[#ff6f00]", icon: Crown, desc: "漫天黃沙" },
    { id: 5, name: "混沌虛空", color: "from-[#311b92] to-[#d500f9]", icon: Zap, desc: "最終試煉" }
];

const LobbyCameraRig: React.FC = () => {
    useFrame((state) => {
        // Subtle camera movement to make the background feel alive
        state.camera.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 2;
        state.camera.position.y = 5 + Math.cos(state.clock.elapsedTime * 0.15) * 1;
        state.camera.lookAt(0, 4, -40);
    });
    return null;
}

export const Lobby: React.FC = () => {
    const { 
        highScore, 
        startGame, 
        openShop, 
        score,
        selectedCharacterId,
        unlockedCharacterIds,
        selectCharacter,
        unlockCharacter
    } = useStore();

    const [previewLevelId, setPreviewLevelId] = useState(1);
    
    // Initialize preview with the currently selected character
    const [previewCharIndex, setPreviewCharIndex] = useState(() => {
        const idx = CHARACTERS.findIndex(c => c.id === selectedCharacterId);
        return idx >= 0 ? idx : 0;
    });

    const activeChar = CHARACTERS[previewCharIndex];
    const isUnlocked = unlockedCharacterIds.includes(activeChar.id);
    const isSelected = selectedCharacterId === activeChar.id;
    const canAfford = score >= activeChar.cost;

    // Sync preview if selection changes externally (e.g. if we add other ways to select)
    useEffect(() => {
        const idx = CHARACTERS.findIndex(c => c.id === selectedCharacterId);
        if (idx >= 0) setPreviewCharIndex(idx);
    }, [selectedCharacterId]);
    
    const handleNextChar = () => {
        setPreviewCharIndex((prev) => (prev + 1) % CHARACTERS.length);
    };

    const handlePrevChar = () => {
        setPreviewCharIndex((prev) => (prev - 1 + CHARACTERS.length) % CHARACTERS.length);
    };

    const handleCharacterAction = () => {
        if (isUnlocked) {
            if (!isSelected) {
                selectCharacter(activeChar.id);
                // audio.playUiSelect(); // If available
            }
        } else {
            if (canAfford) {
                unlockCharacter(activeChar.id, activeChar.cost);
                audio.playGemCollect(); // Use existing sound for purchase feedback
            } else {
                // audio.playError(); 
            }
        }
    };

    return (
        <div className="absolute inset-0 z-[100] flex flex-col font-serif pointer-events-auto">
             
             {/* --- 3D Background Layer --- */}
             <div className="absolute inset-0 z-0">
                 <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
                     <LobbyCameraRig />
                     <Environment forceLevel={previewLevelId} />
                 </Canvas>
                 {/* Dark overlay to ensure text readability */}
                 <div className="absolute inset-0 bg-black/50 pointer-events-none"></div>
             </div>

             {/* Content Container */}
             <div className="relative z-10 flex flex-col h-full p-4 md:p-8">
                 
                 {/* Header: Title & High Score */}
                 <div className="flex justify-between items-start">
                     <div>
                         <h1 className="text-4xl md:text-6xl font-black text-[#fff] italic uppercase tracking-tighter drop-shadow-xl">
                             Olympus<br/>
                             <span className="text-[#ffd700]">Dash</span>
                         </h1>
                         <div className="text-[#90caf9] text-sm md:text-base font-bold tracking-widest mt-1">眾神之路</div>
                     </div>
                     
                     <div className="bg-black/30 backdrop-blur-md rounded-2xl p-4 border border-[#ffd700]/30 flex items-center space-x-4">
                         <div className="bg-[#ffd700]/20 p-3 rounded-full">
                             <Trophy className="w-6 h-6 text-[#ffd700]" />
                         </div>
                         <div className="flex flex-col">
                             <span className="text-xs text-[#bbdefb] font-bold uppercase tracking-wider">歷史最高分</span>
                             <span className="text-2xl font-black text-[#fff] font-mono">{highScore.toLocaleString()}</span>
                         </div>
                     </div>
                 </div>

                 {/* Main Section */}
                 <div className="flex-1 flex flex-col md:flex-row items-center justify-between mt-8 md:mt-0 gap-8">
                     
                     {/* Left: Level Preview (Cards) */}
                     <div className="w-full md:w-1/3 flex flex-col space-y-4">
                         <h3 className="text-[#fff] text-xl font-bold border-l-4 border-[#ffd700] pl-3">旅程預覽</h3>
                         <div className="space-y-3">
                             {LEVEL_INFO.map((lvl) => (
                                 <div 
                                    key={lvl.id} 
                                    onMouseEnter={() => setPreviewLevelId(lvl.id)}
                                    className={`relative group overflow-hidden rounded-xl bg-black/40 border transition-all cursor-pointer ${previewLevelId === lvl.id ? 'border-[#ffd700] bg-black/60 scale-105' : 'border-white/10 hover:border-white/40'}`}
                                 >
                                     <div className={`absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b ${lvl.color}`}></div>
                                     <div className="p-3 pl-6 flex items-center justify-between">
                                         <div>
                                             <div className="text-[#e3f2fd] font-bold text-sm">{lvl.name}</div>
                                             <div className="text-[#90caf9] text-xs">{lvl.desc}</div>
                                         </div>
                                         <div className="text-white/20 font-black text-2xl italic">0{lvl.id}</div>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>

                     {/* Center: Character Showcase */}
                     <div className="w-full md:w-1/3 flex flex-col items-center justify-center relative">
                         {/* 3D Preview */}
                         <div className="w-64 h-64 md:w-80 md:h-80 relative">
                             {/* Halo Effect */}
                             <div className="absolute inset-0 bg-[#ffd700]/10 rounded-full blur-[60px] animate-pulse"></div>
                             
                             <Canvas camera={{ position: [0, 1.0, 3.5], fov: 45 }}>
                                 <ambientLight intensity={0.8} />
                                 <spotLight position={[5, 10, 5]} angle={0.5} penumbra={1} intensity={2} />
                                 <pointLight position={[-5, 5, -5]} color="#00e5ff" intensity={1} />
                                 <CharacterPreview characterId={activeChar.id} />
                             </Canvas>
                         </div>

                         {/* Character Info */}
                         <div className="text-center -mt-4 mb-6">
                             <div className="flex items-center justify-center space-x-2">
                                <h2 className="text-2xl md:text-3xl font-black text-white drop-shadow-md">{activeChar.name}</h2>
                                {!isUnlocked && <Lock className="w-5 h-5 text-gray-400" />}
                             </div>
                             <p className="text-[#90caf9] text-sm">{activeChar.description}</p>
                         </div>

                         {/* Selector Controls */}
                         <div className="flex items-center space-x-6 mb-6">
                             <button 
                                onClick={handlePrevChar}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/20 text-white"
                             >
                                 <ChevronLeft className="w-6 h-6" />
                             </button>
                             
                             {/* Action Button */}
                             <button
                                onClick={handleCharacterAction}
                                disabled={isSelected || (!isUnlocked && !canAfford)}
                                className={`
                                    min-w-[140px] px-6 py-2 rounded-full font-bold uppercase tracking-wider flex items-center justify-center transition-all
                                    ${isSelected 
                                        ? 'bg-[#00e676]/20 border border-[#00e676] text-[#00e676] cursor-default' 
                                        : isUnlocked 
                                            ? 'bg-[#ffd700] text-[#0d47a1] hover:scale-105 shadow-lg'
                                            : canAfford 
                                                ? 'bg-[#ff9100] text-white hover:bg-[#ff6d00] shadow-lg animate-pulse'
                                                : 'bg-gray-600/50 text-gray-400 cursor-not-allowed border border-gray-600'
                                    }
                                `}
                             >
                                {isSelected ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        已選擇
                                    </>
                                ) : isUnlocked ? (
                                    "選擇角色"
                                ) : (
                                    <>
                                        <Coins className="w-4 h-4 mr-2" />
                                        {activeChar.cost} G
                                    </>
                                )}
                             </button>

                             <button 
                                onClick={handleNextChar}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/20 text-white"
                             >
                                 <ChevronRight className="w-6 h-6" />
                             </button>
                         </div>
                     </div>

                     {/* Right: Actions */}
                     <div className="w-full md:w-1/3 flex flex-col items-end justify-center space-y-6">
                         
                         {/* Money Pouch */}
                         <div className="flex items-center space-x-2 bg-black/40 px-4 py-2 rounded-full border border-[#ffd700]/50 mb-4 backdrop-blur-md">
                             <span className="text-[#e0e0e0] text-sm font-bold">財富:</span>
                             <span className="text-[#ffd700] text-lg font-black">{score.toLocaleString()}</span>
                         </div>

                         <button 
                            onClick={openShop}
                            className="w-full max-w-xs group relative flex items-center justify-center space-x-3 px-6 py-4 bg-[#1565c0] border-l-4 border-[#42a5f5] text-white rounded-r-xl hover:bg-[#1976d2] hover:pl-8 transition-all shadow-lg"
                         >
                             <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                             <span className="font-bold text-lg">進入市集 / 強化</span>
                         </button>

                         <button 
                            onClick={() => { audio.init(); startGame(); }}
                            className="w-full max-w-xs group relative flex items-center justify-center space-x-3 px-8 py-6 bg-[#ffd700] text-[#0d47a1] rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,215,0,0.4)] border-b-4 border-[#fbc02d]"
                         >
                             <span className="font-black text-2xl uppercase tracking-wider">開始征途</span>
                             <Play className="w-6 h-6 fill-[#0d47a1]" />
                         </button>

                     </div>

                 </div>

                 {/* Footer Info */}
                 <div className="mt-4 text-center text-[#546e7a] text-xs font-bold uppercase tracking-widest">
                     Built with React Three Fiber • Web Audio API
                 </div>

             </div>
        </div>
    );
};
