/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { neonSynth } from '../audioEngine';
import { Song } from '../types';
import { Sparkles, Activity } from 'lucide-react';

interface VisualizerProps {
  currentSong: Song;
  isPlaying: boolean;
}

export default function Visualizer({ currentSong, isPlaying }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visMode, setVisMode] = useState<'bars' | 'wave'>('bars');
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas safely
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || 300;
      canvas.height = canvas.parentElement?.clientHeight || 90;
    };
    resizeCanvas();
    
    // Check periodically or on window resize
    window.addEventListener('resize', resizeCanvas);
    
    // Trigger lazy init of Analyser
    const analyser = neonSynth.getAnalyser();
    const bufferLength = analyser ? analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      if (!ctx || !canvas) return;
      
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas with a solid black trail wash
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, width, height);

      if (analyser && isPlaying) {
        if (visMode === 'bars') {
          analyser.getByteFrequencyData(dataArray);

          const barWidth = (width / bufferLength) * 1.6;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const value = dataArray[i];
            // Normalise height
            const barHeight = (value / 255) * height * 0.85;

            // Stark contrasting shadow
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#00f0ff';

            const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
            gradient.addColorStop(0, '#ff00ff'); // Neon Magenta
            gradient.addColorStop(1, '#00f0ff'); // Neon Cyan

            ctx.fillStyle = gradient;
            ctx.fillRect(x, height - barHeight, barWidth - 2.5, barHeight);

            x += barWidth;
          }
        } else {
          // Waveform Mode
          analyser.getByteTimeDomainData(dataArray);
          
          ctx.beginPath();
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = '#ff00ff'; // Neon Magenta
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#00f0ff'; // Neon Cyan

          const sliceWidth = width / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0; // normalised centered around 1.0
            const y = (v * height) / 2;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }

            x += sliceWidth;
          }

          ctx.stroke();
        }
      } else {
        // Draw elegant flat ambient wave when paused
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00f0ff'; // Neon Cyan
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#ff00ff';
        
        ctx.moveTo(0, height / 2);
        for (let i = 0; i < width; i++) {
          const y = height / 2 + Math.sin(i * 0.08) * 3;
          ctx.lineTo(i, y);
        }
        ctx.stroke();
      }

      ctx.shadowBlur = 0; // reset
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentSong, isPlaying, visMode]);

  return (
    <div className="relative w-full h-[95px] flex flex-col justify-between">
      {/* Canvas */}
      <div className="flex-1 w-full relative overflow-hidden rounded-none border-2 border-[#ff00ff] bg-[#000000] p-0.5">
        <canvas
          id="music-visualizer-canvas"
          ref={canvasRef}
          className="w-full h-full block rounded-none"
        />
      </div>

      {/* Mini Bar style switch */}
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black border border-[#00f0ff] p-1 text-[10px] text-white font-mono select-none z-10">
        <button
          id="visualizer-toggle-bars"
          onClick={() => {
            neonSynth.triggerSfxTap();
            setVisMode('bars');
          }}
          className={`flex items-center gap-1 px-2.5 py-0.5 rounded-none transition-colors ${
            visMode === 'bars'
              ? 'bg-[#00f0ff] text-black font-black'
              : 'text-[#00f0ff] hover:bg-[#00f0ff]/10'
          }`}
          title="Spectrum Bars"
        >
          <Sparkles className="w-3 h-3 shrink-0" />
          <span>BARS_</span>
        </button>
        <button
          id="visualizer-toggle-wave"
          onClick={() => {
            neonSynth.triggerSfxTap();
            setVisMode('wave');
          }}
          className={`flex items-center gap-1 px-2.5 py-0.5 rounded-none transition-colors ${
            visMode === 'wave'
              ? 'bg-[#ff00ff] text-black font-black'
              : 'text-[#ff00ff] hover:bg-[#ff00ff]/10'
          }`}
          title="Frequency Wave"
        >
          <Activity className="w-3 h-3 shrink-0" />
          <span>WAVE_</span>
        </button>
      </div>
    </div>
  );
}
