/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { Song } from '../types';
import { neonSynth, DUMMY_SONGS } from '../audioEngine';
import Visualizer from './Visualizer';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Disc,
  Disc3,
  Music,
  Heart,
  Radio,
  Sliders,
  Sparkles
} from 'lucide-react';

interface MusicPlayerProps {
  currentSong: Song;
  onSongChange: (song: Song) => void;
  isPlaying: boolean;
  onPlayPauseToggle: () => void;
}

export default function MusicPlayer({
  currentSong,
  onSongChange,
  isPlaying,
  onPlayPauseToggle
}: MusicPlayerProps) {
  const [volume, setVolume] = useState<number>(50); // 0 - 100 scale
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [prevVolume, setPrevVolume] = useState<number>(50);
  const [progress, setProgress] = useState<number>(24); // simulated progress %
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('0:18');
  const [durationStr, setDurationStr] = useState<string>('1:15');
  const progressIntervalRef = useRef<number | null>(null);

  // Initialize synth volumes
  useEffect(() => {
    neonSynth.setVolume(isMuted ? 0 : volume / 100);
  }, [volume, isMuted]);

  // Track simulation timeline
  useEffect(() => {
    if (isPlaying) {
      const stepDurationSecInput = 60 / currentSong.bpm;
      const totalEstimatedLengthSec = 75; // All songs represent standard loop length of 1:15 minute
      setDurationStr('1:15');
      
      progressIntervalRef.current = window.setInterval(() => {
        setProgress((prev) => {
          const next = prev + (100 / (totalEstimatedLengthSec * 10)); // increment by tenth of seconds
          if (next >= 100) {
            // Simulated loop wrap around or automatic skip! Let's just wrap around simulated track
            return 0;
          }
          return next;
        });
      }, 100);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, currentSong]);

  // Format current elapsed time based on progress
  useEffect(() => {
    const totalSec = 75; // 1:15 duration
    const currentTotalSec = Math.floor((progress / 100) * totalSec);
    const mins = Math.floor(currentTotalSec / 60);
    const secs = currentTotalSec % 60;
    setCurrentTimeStr(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
  }, [progress]);

  const handleSkip = (forward: boolean) => {
    neonSynth.triggerSfxTap();
    const currentIndex = DUMMY_SONGS.findIndex((s) => s.id === currentSong.id);
    let nextIndex = forward ? currentIndex + 1 : currentIndex - 1;
    
    if (nextIndex >= DUMMY_SONGS.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = DUMMY_SONGS.length - 1;
    
    onSongChange(DUMMY_SONGS[nextIndex]);
    setProgress(0);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (val > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    neonSynth.triggerSfxTap();
    if (isMuted) {
      setVolume(prevVolume || 50);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  // Color mappings
  const glowShadowStyle = {
    boxShadow: isPlaying ? `0 0 25px -5px ${currentSong.glowColor}55, 0 0 10px -5px ${currentSong.glowColor}` : 'none',
  };

  const getAccentClass = (type: 'text' | 'bg' | 'border' | 'accent' | 'glow') => {
    switch (currentSong.neonColor) {
      case 'fuchsia':
        if (type === 'text') return 'text-fuchsia-400 group-hover:text-fuchsia-300';
        if (type === 'bg') return 'bg-fuchsia-500';
        if (type === 'border') return 'border-fuchsia-500/40 text-fuchsia-400';
        if (type === 'accent') return 'accent-fuchsia-500';
        return 'shadow-[0_0_15px_rgba(217,70,239,0.5)]';
      case 'emerald':
        if (type === 'text') return 'text-emerald-400 group-hover:text-emerald-300';
        if (type === 'bg') return 'bg-emerald-500';
        if (type === 'border') return 'border-emerald-500/40 text-emerald-400';
        if (type === 'accent') return 'accent-emerald-500';
        return 'shadow-[0_0_15px_rgba(16,185,129,0.5)]';
      case 'cyan':
      default:
        if (type === 'text') return 'text-cyan-400 group-hover:text-cyan-300';
        if (type === 'bg') return 'bg-cyan-500';
        if (type === 'border') return 'border-cyan-500/40 text-cyan-400';
        if (type === 'accent') return 'accent-cyan-500';
        return 'shadow-[0_0_15px_rgba(6,182,212,0.5)]';
    }
  };

  return (
    <div
      id="arcade-music-panel"
      className="flex flex-col h-full bg-[#020204] border-4 border-[#00f0ff] p-4 md:p-5 transition-all duration-100 relative overflow-hidden shadow-[-6px_6px_0_#ff00ff]"
    >
      {/* Background ambient gradient glow */}
      <div 
        className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-[80px] pointer-events-none transition-all duration-700"
        style={{
          backgroundColor: isPlaying ? '#ff00ff15' : 'transparent',
        }}
      />

      {/* Title & Badge */}
      <div className="flex items-center justify-between mb-4 select-none">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-none border border-[#ff00ff] bg-black">
            <Radio className="w-4 h-4 animate-pulse text-[#ff00ff]" />
          </div>
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-[#00f0ff] font-black">SYNTH_MODULATOR_MATRIX</h2>
            <p className="text-[10px] text-white/50 font-mono">CORES_DSP // WEB AUDIO ENGINE</p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 font-mono text-[9px] px-2 py-0.5 rounded-none border border-[#ff00ff] bg-black">
          <span className={`w-1.5 h-1.5 rounded-none ${isPlaying ? 'bg-[#00f0ff] animate-pulse' : 'bg-[#ff00ff]'}`}></span>
          <span className="text-[#00f0ff] uppercase tracking-widest font-black">{isPlaying ? 'TRANSMITTING' : 'STATIONARY'}</span>
        </div>
      </div>

      {/* Main Track Section -- Album Art & Title */}
      <div className="flex flex-row sm:flex-col lg:flex-row items-center gap-4 mb-4 select-none">
        {/* Animated Cylinder Record / CD */}
        <div className="relative w-18 h-18 sm:w-20 sm:h-20 lg:w-20 lg:h-20 shrink-0 select-none">
          <div
            className={`w-full h-full rounded-none border-2 bg-gradient-to-tr from-black via-zinc-950 to-black flex items-center justify-center relative shadow-lg ${
              isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''
            }`}
            style={{
              borderColor: '#ff00ff',
              boxShadow: isPlaying ? '0 0 15px -3px #ff00ff' : 'none',
            }}
          >
            {/* Grooves on vinyl */}
            <div className="absolute inset-2 rounded-none border-2 border-dashed border-[#00f0ff]/10 pointer-events-none" />
            <div className="absolute inset-4 rounded-none border border-dotted border-[#ff00ff]/20 pointer-events-none" />

            {/* Inner Center Label */}
            <div className="w-6 h-6 rounded-none bg-black flex items-center justify-center border border-[#ff00ff]">
              <div
                className="w-2.5 h-2.5 rounded-none transition-colors duration-500 bg-[#00f0ff]"
              />
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex-1 min-w-0 font-mono">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-none tracking-widest bg-black border border-[#00f0ff] font-black text-[#00f0ff]">
              {currentSong.genre}
            </span>
            <span className="text-[10px] text-[#ff00ff]">{currentSong.bpm} BPM_CORE</span>
          </div>
          <h3 className="text-sm font-black text-white truncate tracking-widest uppercase">{currentSong.title}</h3>
          <p className="text-xs text-[#00f0ff] truncate">{currentSong.artist}</p>
          <p className="text-[10px] text-white/50 leading-normal line-clamp-1 mt-1 font-mono">{currentSong.description.toUpperCase()}</p>
        </div>
      </div>

      {/* Visualizer Panel */}
      <div className="mb-4">
        <Visualizer currentSong={currentSong} isPlaying={isPlaying} />
      </div>

      {/* Audio Slider Timeline */}
      <div className="mb-4 font-mono select-none">
        <div className="flex items-center justify-between text-[10px] text-white/50 mb-1">
          <span>{currentTimeStr}</span>
          <span className="text-[#ff00ff] tracking-widest font-black">LOOPING INTERACTIVE WAVEFORM</span>
          <span>{durationStr}</span>
        </div>
        <div className="h-2 w-full bg-black rounded-none overflow-hidden relative cursor-pointer border-2 border-[#00f0ff]" onClick={() => {
          neonSynth.triggerSfxTap();
        }}>
          <div
            className="h-full rounded-none bg-gradient-to-r from-[#ff00ff] to-[#00f0ff]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Player Controller Buttons */}
      <div className="flex items-center justify-between gap-3 mb-5 font-mono select-none">
        {/* Previous Button */}
        <button
          id="btn-skip-prev"
          onClick={() => handleSkip(false)}
          className="p-2.5 rounded-none border-2 border-[#00f0ff] bg-black text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black transition duration-155"
          title="PREVIOUS INDEX_"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        {/* Major Play/Pause Button */}
        <button
          id="btn-play-pause"
          onClick={onPlayPauseToggle}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-none border-2 font-mono text-xs uppercase tracking-widest font-black transition-all duration-100 bg-black ${
            isPlaying 
              ? 'border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black shadow-[-3px_3px_0_#00f0ff]' 
              : 'border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black shadow-[-3px_3px_0_#ff00ff]'
          }`}
          title={isPlaying ? 'HALT AUDIO_' : 'INITIATE AUDIO_'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>TERMINATE_SIGNAL</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>TRANSMIT_SIGNAL</span>
            </>
          )}
        </button>

        {/* Skip Forward Button */}
        <button
          id="btn-skip-next"
          onClick={() => handleSkip(true)}
          className="p-2.5 rounded-none border-2 border-[#00f0ff] bg-black text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black transition duration-155"
          title="NEXT INDEX_"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Volume & Details Row */}
      <div className="flex items-center justify-between border-t border-[#00f0ff]/20 pt-4 mb-4 select-none font-mono">
        {/* Left: Volume Section */}
        <div className="flex items-center gap-2 w-[140px]">
          <button
            id="btn-mute-toggle"
            onClick={toggleMute}
            className="text-[#00f0ff] hover:text-[#ff00ff] transition-colors"
            title={isMuted ? 'UNMUTE CORES_' : 'MUTE CORES_'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-500 animate-pulse" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            id="volume-slider"
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full h-1.5 bg-black rounded-none cursor-pointer border border-[#00f0ff] accent-[#ff00ff]"
            title={`DSP Volume: ${volume}%`}
          />
        </div>

        {/* Right: Loop Status Badge */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#ff00ff] hover:text-[#00f0ff] cursor-pointer" onClick={() => {
          neonSynth.triggerSfxEat();
        }}>
          <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
          <span className="font-black uppercase tracking-widest text-[9px]">REALTIME_SYNTHESIS_ACTIVE</span>
        </div>
      </div>

      {/* Tracks Selection Grid */}
      <div className="font-mono">
        <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2.5 font-bold">SELECT_CHANNEL_TAPE_INDEX</h4>
        <div className="flex flex-col gap-2 h-[105px] overflow-y-auto pr-1">
          {DUMMY_SONGS.map((song) => {
            const isSelected = song.id === currentSong.id;
            return (
              <button
                id={`channel-select-${song.id}`}
                key={song.id}
                onClick={() => {
                  neonSynth.triggerSfxTap();
                  onSongChange(song);
                  setProgress(0);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-none text-left transition font-mono border-2 ${
                  isSelected
                    ? 'bg-black border-[#ff00ff] text-white shadow-[-2px_2px_0_#00f0ff]'
                    : 'bg-black border-[#00f0ff]/10 text-white/60 hover:border-[#00f0ff]/40 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-none shrink-0"
                    style={{ backgroundColor: isSelected ? '#ff00ff' : '#00f0ff' }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-white truncate font-black tracking-wider uppercase">{song.title}</p>
                    <p className="text-[10px] text-white/50 truncate uppercase">{song.artist}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  <span className="text-[9px] text-[#00f0ff] font-bold">{song.bpm}BPM_DSP</span>
                  {isSelected && isPlaying && (
                    <div className="flex items-end gap-[2px] h-2 w-3">
                      <div className="w-[2px] h-full bg-[#ff00ff] animate-[bounce_0.6s_ease-in-out_infinite]" style={{ animationDelay: '0.1s' }} />
                      <div className="w-[2px] h-1/2 bg-[#ff00ff] animate-[bounce_0.6s_ease-in-out_infinite]" style={{ animationDelay: '0.3s' }} />
                      <div className="w-[2px] h-[75%] bg-[#ff00ff] animate-[bounce_0.6s_ease-in-out_infinite]" style={{ animationDelay: '0.2s' }} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
