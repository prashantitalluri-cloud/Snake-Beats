/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Song } from './types';
import { neonSynth, DUMMY_SONGS } from './audioEngine';
import SnakeGame from './components/SnakeGame';
import MusicPlayer from './components/MusicPlayer';
import {
  Gamepad2,
  Music,
  Tv,
  HelpCircle,
  Share2,
  Terminal,
  Volume2,
  ExternalLink,
  Cpu,
  Flame,
  User
} from 'lucide-react';

export default function App() {
  const [currentSong, setCurrentSong] = useState<Song>(DUMMY_SONGS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showWelcome, setShowWelcome] = useState<boolean>(true);

  // Sync state initially
  useEffect(() => {
    setIsPlaying(neonSynth.getIsPlaying());
  }, []);

  const handlePlayPauseToggle = () => {
    const nextState = neonSynth.togglePlay();
    setIsPlaying(nextState);
  };

  const handleSongChange = (song: Song) => {
    neonSynth.setSong(song);
    setCurrentSong(song);
    // Synth auto resumes if it was already playing
    setIsPlaying(neonSynth.getIsPlaying());
  };

  const getGlowColorStyle = () => {
    return {
      borderColor: isPlaying ? `${currentSong.glowColor}50` : 'rgba(74, 85, 104, 0.2)',
      boxShadow: isPlaying ? `0 0 35px -5px ${currentSong.glowColor}25` : 'none',
    };
  };

  return (
    <div className="min-h-screen bg-[#020204] text-white flex flex-col justify-between selection:bg-[#ff00ff]/30 selection:text-[#00f0ff] relative overflow-x-hidden crt-overlay">
      
      {/* Background glitch glow lines */}
      <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-[#00f0ff]/10 via-[#ff00ff]/10 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[1px] h-full bg-gradient-to-b from-[#ff00ff]/10 via-[#00f0ff]/10 to-transparent pointer-events-none" />

      {/* Retro Header Accent */}
      <header className="border-b-4 border-[#00f0ff] bg-[#000000] sticky top-0 z-50 shadow-[0_4px_0_#ff00ff]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3 select-none">
            <div className="relative">
              <div 
                className="w-10 h-10 bg-[#000000] border-2 border-[#ff00ff] flex items-center justify-center text-[#ff00ff] glitch-tear"
                style={{
                  boxShadow: isPlaying ? '0 0 15px #00f0ff' : 'none'
                }}
              >
                <Gamepad2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#00f0ff] rounded-none animate-ping" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#00f0ff] rounded-none" />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#ff00ff] leading-none flicker-cyan font-mono">
                  SYNTH_SNAKE_CORE
                </h1>
                <span className="text-[10px] font-mono font-bold bg-[#ff00ff] text-black px-1 border border-[#ff00ff] rounded-none">
                  V_3.1-SYS
                </span>
              </div>
              <p className="text-[9px] text-[#00f0ff] font-bold uppercase tracking-[0.25em] mt-1 flicker-cyan">
                CRT_TERMINAL // DUAL_CORE_HARMONICS
              </p>
            </div>
          </div>

          {/* Quick Stats Header Info */}
          <div className="hidden md:flex items-center gap-6 font-mono text-[11px] text-white/50">
            <div className="flex items-center gap-2 border-r border-[#ff00ff]/20 pr-5">
              <Cpu className="w-3.5 h-3.5 text-[#00f0ff] animate-pulse" />
              <span>CORE_GATE: <strong className="text-[#00f0ff] font-bold">ONLINE_</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-[#ff00ff] animate-bounce" />
              <span>BUS_FREQ: <strong className="text-[#ff00ff] truncate max-w-[120px] font-bold">{currentSong.title.toUpperCase()}</strong></span>
            </div>
          </div>

          {/* User Profile info */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[#00f0ff] font-bold text-[11px] uppercase tracking-widest">GUEST_LINK_08</span>
              <span className="text-[9px] text-[#ff00ff] font-medium tracking-wider">SECURE_CONNECT</span>
            </div>
            <div className="w-8 h-8 rounded-none bg-black border-2 border-[#00f0ff] flex items-center justify-center text-[#ff00ff] shadow-[-2px_2px_0_#ff00ff]">
              <User className="w-4 h-4" />
            </div>
          </div>

        </div>
      </header>

      {/* Welcome Dialog Banner (Can be dissolved by user) */}
      {showWelcome && (
        <div className="max-w-6xl mx-auto w-full px-4 mt-6 select-none">
          <div className="p-5 rounded-none bg-[#030306] border-2 border-[#ff00ff] shadow-[-6px_6px_0px_#00f0ff] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Background cyan horizontal line */}
            <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-[#ff00ff]" />

            <div className="flex items-start gap-4">
              <div className="p-2 bg-black border border-[#00f0ff] text-[#00f0ff] rounded-none shrink-0 mt-1 shadow-[-2px_2px_0_#ff00ff]">
                <Terminal className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-black font-mono tracking-[0.2em] uppercase text-[#ff00ff]">
                  :: CORE PROTOCOL INITIATED // USER_GREETING ::
                </h4>
                <p className="text-xs text-white/80 leading-relaxed mt-2 font-mono max-w-[700px]">
                  WELCOME_AGENT. WEBAUDIO_CHIP_CONNECTIVITY DETECTED. SELECT <strong className="text-[#00f0ff]">PLAY SYNTH_</strong> ON THE DECK CONTROLLER TO ACTIVATE THE AM-FM SYNTHESIS HARMONICS GENERATOR (SUBBASS + DUAL OSC HEADS). ROTATION SEQUENCING WILL AUTOMATICALLY PILOT THE GRID FREQUENCY IN CONSTANT STEERING SYNCHRONICITY. AVOID GRID BREAKS.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
              <button
                id="welcome-acknowledge-btn"
                onClick={() => {
                  neonSynth.triggerSfxEat();
                  setShowWelcome(false);
                }}
                className="cyber-button px-5 py-2 text-xs font-mono tracking-widest uppercase font-bold"
              >
                ACKNOWLEDGE_ENTRY_
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Workspace */}
      <main className="max-w-6xl mx-auto w-full px-4 py-8 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Block: Snake Game Console Window (Colspan 7) */}
          <section className="lg:col-span-7 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-[#ff00ff] animate-pulse" />
                <h3 className="text-xs font-black font-mono uppercase tracking-[0.25em] text-[#ff00ff]">
                  SNAKE_GRID_SUBSYSTEM.SYS
                </h3>
              </div>
              <span className="text-[9px] font-mono text-[#00f0ff] animate-pulse">● FEEDER_INJECTOR_LIVE</span>
            </div>
            
            <div className="flex-1">
              <SnakeGame currentSong={currentSong} />
            </div>
          </section>

          {/* Right Block: Synth Music Deck Player Panel (Colspan 5) */}
          <section className="lg:col-span-5 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-[#00f0ff] glitch-tear" />
                <h3 className="text-xs font-black font-mono uppercase tracking-[0.25em] text-[#00f0ff]">
                  AUDIO_DECK_SYNTHESIZER.IO
                </h3>
              </div>
              <span className="text-[9px] font-mono text-[#ff00ff] animate-bounce">● BEAT_SYNC_READY</span>
            </div>

            <div className="flex-1">
              <MusicPlayer
                currentSong={currentSong}
                onSongChange={handleSongChange}
                isPlaying={isPlaying}
                onPlayPauseToggle={handlePlayPauseToggle}
              />
            </div>
          </section>

        </div>

        {/* Dashboard quick help keyboard rules bar */}
        <div className="mt-8 p-6 rounded-none border-2 border-[#00f0ff] bg-black shadow-[-4px_4px_0_#ff00ff] font-mono text-xs text-white grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-3">
            <span className="text-2xl text-[#00f0ff] select-none font-bold">▶_</span>
            <div>
              <p className="font-bold text-[#ff00ff] text-[12px] uppercase tracking-widest">I. STEERING_HYPERLINK</p>
              <p className="text-white/70 text-[11px] mt-1.5 leading-relaxed">
                PILOT HEAD COORDS VIA <strong className="text-[#00f0ff]">W_A_S_D</strong> OR <strong className="text-[#00f0ff]">DIRECTION_ARROWS</strong>. PRESS <strong className="text-[#ff00ff]">SPACEBAR_</strong> TO HALT OR INITIALIZE GAME ENGINE CORE.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="text-2xl text-[#ff00ff] select-none font-bold">☢_</span>
            <div>
              <p className="font-bold text-[#00f0ff] text-[12px] uppercase tracking-widest">II. WRAP_DYNAMICS</p>
              <p className="text-white/70 text-[11px] mt-1.5 leading-relaxed">
                DEFAULT PERIMETERS ARE FATAL. ENGAGE <strong className="text-[#ff00ff]">WALLS: PASS-THRU</strong> TO ROUTE GRID WRAPPING FOR UNRESTRICTED ENDURANCE LOGS.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="text-2xl text-[#00f0ff] select-none font-bold">█_</span>
            <div>
              <p className="font-bold text-[#ff00ff] text-[12px] uppercase tracking-widest">III. PULSE_MODULATOR</p>
              <p className="text-white/70 text-[11px] mt-1.5 leading-relaxed">
                SELECT <strong className="text-[#00f0ff]">SYNC_TO_BEAT</strong> INTERFACE TO DIRECTLY CLAMP SNAKE ENGINE PACE TO THE CYCLICAL AUDIO BPM MATRIX.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Cyberpunk Footer */}
      <footer className="border-t-2 border-[#ff00ff] bg-black py-4 select-none mt-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10.5px] text-white/50 font-mono tracking-wider">
          <div className="flex items-center gap-1.5">
            <span>TERMINAL_POWER:</span>
            <span className="text-[#00f0ff] font-bold uppercase flicker-cyan">CRITICAL_WEB_AUDIO_DSP_CORE</span>
          </div>
          
          <div className="flex items-center gap-1.5 bg-black border border-[#00f0ff] px-2.5 py-1 rounded-none text-[#00f0ff] shadow-[-2px_2px_0_#ff00ff]">
            <span>SYSTEM_TRANSLINK: CONNECTED</span>
            <span className="inline-block w-1.5 h-1.5 bg-[#00f0ff] animate-ping"></span>
          </div>

          <div>
            <span className="text-[#ff00ff] font-bold">RETROPLAY_LABS // SHIELD_LOGICS_©_2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
