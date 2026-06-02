/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Direction, Position, GameStatus, Song } from '../types';
import { neonSynth } from '../audioEngine';
import {
  Trophy,
  Play,
  RotateCcw,
  Zap,
  Shield,
  ShieldAlert,
  ArrowBigUp,
  ArrowBigDown,
  ArrowBigLeft,
  ArrowBigRight,
  Gauge,
  HelpCircle
} from 'lucide-react';

interface SnakeGameProps {
  currentSong: Song;
}

const GRID_SIZE = 20; // 20x20 grid

export default function SnakeGame({ currentSong }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // States
  const [snake, setSnake] = useState<Position[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 }
  ]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('UP');
  const [nextDirection, setNextDirection] = useState<Direction>('UP');
  const [gameStatus, setGameStatus] = useState<GameStatus>('IDLE');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('snake_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Gameplay Settings
  const [isWrapMode, setIsWrapMode] = useState<boolean>(false);
  const [speedMode, setSpeedMode] = useState<'slow' | 'medium' | 'fast' | 'sync'>('sync');
  const [showGridLines, setShowGridLines] = useState<boolean>(true);

  // References to keep game logic loop updated with latest states without resetting interval
  const snakeRef = useRef<Position[]>(snake);
  const directionRef = useRef<Direction>(direction);
  const foodRef = useRef<Position>(food);
  const gameStatusRef = useRef<GameStatus>(gameStatus);
  const trailRef = useRef<Position[]>([]);

  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { directionRef.current = direction; }, [direction]);
  useEffect(() => { foodRef.current = food; }, [food]);
  useEffect(() => { gameStatusRef.current = gameStatus; }, [gameStatus]);

  // Determine game speed based on setting and current song BPM
  const getGameSpeed = useCallback(() => {
    switch (speedMode) {
      case 'slow':
        return 110;
      case 'medium':
        return 75;
      case 'fast':
        return 40;
      case 'sync':
      default:
        // BPM calculation hook: Map 90-150BPM to 110-40ms
        // Higher BPM leads to higher speed snake
        const mappedSpeed = Math.max(40, Math.min(110, 1000 / (currentSong.bpm / 60 * 2.5)));
        return Math.floor(mappedSpeed);
    }
  }, [speedMode, currentSong]);

  // Generate random food position not overlapping snake
  const spawnFood = useCallback((currentSnake: Position[]) => {
    let newFood: Position;
    let attempts = 0;
    while (attempts < 200) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      // Check collision
      const collides = currentSnake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      );
      if (!collides) {
        setFood(newFood);
        return;
      }
      attempts++;
    }
    // Fail-safe
    setFood({ x: 4, y: 4 });
  }, []);

  // Set direction on command
  const handleDirectionChange = useCallback((newDir: Direction) => {
    const curr = directionRef.current;
    if (newDir === 'UP' && curr === 'DOWN') return;
    if (newDir === 'DOWN' && curr === 'UP') return;
    if (newDir === 'LEFT' && curr === 'RIGHT') return;
    if (newDir === 'RIGHT' && curr === 'LEFT') return;
    setNextDirection(newDir);
  }, []);

  // Restart game
  const handleReset = () => {
    neonSynth.triggerSfxTap();
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 }
    ];
    trailRef.current = [];
    setSnake(initialSnake);
    setDirection('UP');
    setNextDirection('UP');
    setScore(0);
    spawnFood(initialSnake);
    setGameStatus('PLAYING');
  };

  const handleStartResume = () => {
    neonSynth.triggerSfxTap();
    if (gameStatus === 'GAME_OVER' || gameStatus === 'IDLE') {
      handleReset();
    } else if (gameStatus === 'PAUSED') {
      setGameStatus('PLAYING');
    } else {
      setGameStatus('PAUSED');
    }
  };

  // Listen to keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent screen scrolling when arrow keys are pressed
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (gameStatusRef.current !== 'PLAYING') {
        if (e.code === 'Space' || e.code === 'Enter') {
          handleStartResume();
        }
        return;
      }

      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          handleDirectionChange('UP');
          break;
        case 'ArrowDown':
        case 'KeyS':
          handleDirectionChange('DOWN');
          break;
        case 'ArrowLeft':
        case 'KeyA':
          handleDirectionChange('LEFT');
          break;
        case 'ArrowRight':
        case 'KeyD':
          handleDirectionChange('RIGHT');
          break;
        case 'Space':
        case 'KeyP':
          setGameStatus('PAUSED');
          neonSynth.triggerSfxTap();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, handleDirectionChange, getGameSpeed]);

  // Main game tick execution loop
  useEffect(() => {
    if (gameStatus !== 'PLAYING') return;

    const gameLoop = () => {
      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };
        const currentDir = nextDirection;
        setDirection(currentDir);

        // Compute new head position
        switch (currentDir) {
          case 'UP':
            head.y -= 1;
            break;
          case 'DOWN':
            head.y += 1;
            break;
          case 'LEFT':
            head.x -= 1;
            break;
          case 'RIGHT':
            head.x += 1;
            break;
        }

        // Boundary checks
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          if (isWrapMode) {
            // Screen Wrapping
            head.x = (head.x + GRID_SIZE) % GRID_SIZE;
            head.y = (head.y + GRID_SIZE) % GRID_SIZE;
          } else {
            // Wall Crash
            setGameStatus('GAME_OVER');
            neonSynth.triggerSfxGameOver();
            return prevSnake;
          }
        }

        // Self-collision checks
        const selfCollision = prevSnake.slice(1).some(
          (segment) => segment.x === head.x && segment.y === head.y
        );
        if (selfCollision) {
          setGameStatus('GAME_OVER');
          neonSynth.triggerSfxGameOver();
          return prevSnake;
        }

        // Create new snake sequence
        const newSnake = [head, ...prevSnake];

        // Food collision checking
        const currentFood = foodRef.current;
        if (head.x === currentFood.x && head.y === currentFood.y) {
          // Snake eats food
          setScore((s) => {
            const nextScore = s + 10;
            if (nextScore > highScore) {
              setHighScore(nextScore);
              localStorage.setItem('snake_highscore', nextScore.toString());
            }
            return nextScore;
          });
          neonSynth.triggerSfxEat();
          spawnFood(newSnake);
        } else {
          // Remove tail if didn't eat
          const removedTail = newSnake.pop();
          if (removedTail) {
            trailRef.current.unshift({ ...removedTail });
            if (trailRef.current.length > 8) {
              trailRef.current.pop();
            }
          }
        }

        return newSnake;
      });
    };

    const intervalId = setInterval(gameLoop, getGameSpeed());
    return () => clearInterval(intervalId);
  }, [gameStatus, nextDirection, isWrapMode, getGameSpeed, spawnFood, highScore]);

  // Canvas painting logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed internal coordinates for design resolution
    const size = 480;
    canvas.width = size;
    canvas.height = size;
    const cellWidth = size / GRID_SIZE;

    // Background Canvas paint
    ctx.fillStyle = '#020202'; // Pitch black
    ctx.fillRect(0, 0, size, size);

    // Subtle Grid pattern
    if (showGridLines) {
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; // subtle light gray
      for (let i = 0; i <= GRID_SIZE; i++) {
        // Vertical
        ctx.beginPath();
        ctx.moveTo(i * cellWidth, 0);
        ctx.lineTo(i * cellWidth, size);
        ctx.stroke();

        // Horizontal
        ctx.beginPath();
        ctx.moveTo(0, i * cellWidth);
        ctx.lineTo(size, i * cellWidth);
        ctx.stroke();
      }
    }

    // Paint Food (Cherry)
    const renderFood = foodRef.current;
    const foodGlow = '#ff00ff'; // Neon Magenta

    ctx.shadowBlur = 15;
    ctx.shadowColor = foodGlow;
    ctx.fillStyle = foodGlow;
    
    // Draw neon blocky food
    const centerX = renderFood.x * cellWidth + cellWidth / 2;
    const centerY = renderFood.y * cellWidth + cellWidth / 2;
    const radius = cellWidth / 2.3;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();

    // Small stem for retro food look
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#00f0ff'; // Neon Cyan
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 2);
    ctx.quadraticCurveTo(centerX + 3, centerY - 6, centerX + 5, centerY - 7);
    ctx.stroke();

    // Paint Trail Segments
    const renderTrail = trailRef.current;
    renderTrail.forEach((segment, idx) => {
      // opacity decays from 0.45 down to 0.05
      const opacity = 0.45 * (1 - idx / renderTrail.length);
      ctx.shadowBlur = 12;
      ctx.shadowColor = `rgba(255, 0, 255, ${opacity})`; // Magenta decay trail
      ctx.fillStyle = `rgba(255, 0, 255, ${opacity})`;

      const scale = 0.85 - (idx / renderTrail.length) * 0.45; // shrink from 85% down to 40% size
      const sizeOffset = (cellWidth * (1 - scale)) / 2;
      const px = segment.x * cellWidth + 1.5 + sizeOffset;
      const py = segment.y * cellWidth + 1.5 + sizeOffset;
      const rSize = (cellWidth - 3) * scale;
      const cornerRadius = 0; // Pure pixel box

      ctx.beginPath();
      ctx.roundRect(px, py, rSize, rSize, cornerRadius);
      ctx.fill();
    });

    // Paint Snake Segments
    const renderSnake = snakeRef.current;
    renderSnake.forEach((segment, idx) => {
      const isHead = idx === 0;
      
      // Snake is styled neon electric cyan and head in crisp white magenta
      const snakeColor = isHead ? '#ffffff' : '#00f0ff';
      const snakeGlow = isHead ? '#ffffff' : 'rgba(0, 240, 255, 0.8)';
      
      ctx.shadowBlur = isHead ? 15 : 10;
      ctx.shadowColor = snakeGlow;
      ctx.fillStyle = snakeColor;

      // Pure rect blocky matrix segment drawing
      const px = segment.x * cellWidth + 1.5;
      const py = segment.y * cellWidth + 1.5;
      const rSize = cellWidth - 3;

      ctx.beginPath();
      ctx.rect(px, py, rSize, rSize);
      ctx.fill();

      // Fun retro CRT segment eyes on head
      if (isHead) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ff00ff'; // magenta pupils
        
        let eyeSize = 2.5;
        let offsetLeft = 3;
        let offsetTop = 4;

        // Reposition eyes depending on direction
        const currDir = directionRef.current;
        if (currDir === 'UP') {
          ctx.fillRect(px + offsetLeft, py + offsetTop, eyeSize, eyeSize);
          ctx.fillRect(px + rSize - offsetLeft - eyeSize, py + offsetTop, eyeSize, eyeSize);
        } else if (currDir === 'DOWN') {
          ctx.fillRect(px + offsetLeft, py + rSize - offsetTop - eyeSize, eyeSize, eyeSize);
          ctx.fillRect(px + rSize - offsetLeft - eyeSize, py + rSize - offsetTop - eyeSize, eyeSize, eyeSize);
        } else if (currDir === 'LEFT') {
          ctx.fillRect(px + offsetTop, py + offsetLeft, eyeSize, eyeSize);
          ctx.fillRect(px + offsetTop, py + rSize - offsetLeft - eyeSize, eyeSize, eyeSize);
        } else {
          ctx.fillRect(px + rSize - offsetTop - eyeSize, py + offsetLeft, eyeSize, eyeSize);
          ctx.fillRect(px + rSize - offsetTop - eyeSize, py + rSize - offsetLeft - eyeSize, eyeSize, eyeSize);
        }
      }
    });

    // Ambient overlay gradient for nostalgic CRT Scanlines
    ctx.shadowBlur = 0;
    const scanlinePeriod = 3;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)'; // extremely low opacity subtle glow scanline
    for (let y = 0; y < size; y += scanlinePeriod) {
      ctx.fillRect(0, y, size, 1);
    }

  }, [snake, food, showGridLines, currentSong]);

  // Keep grid lines ref updated
  return (
    <div id="arcade-snake-console" className="flex flex-col h-full bg-[#020204] border-4 border-[#ff00ff] rounded-none overflow-hidden relative shadow-[-6px_6px_0px_#00f0ff]">
      
      {/* Upper Retro Stats Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#000000] border-b-2 border-[#00f0ff] select-none">
        
        {/* Left: Score */}
        <div className="flex items-center gap-1.5 md:gap-2 px-3 py-1 bg-black border-2 border-[#ff00ff] rounded-none shadow-[-2px_2px_0_#00f0ff]">
          <span className="text-[#ff00ff] uppercase tracking-widest text-[9px] font-black font-mono">VAL_SCORE_</span>
          <span id="snake-current-score" className="text-base md:text-lg font-black text-[#00f0ff] font-mono tracking-widest glitch-glow-green">
            {String(score).padStart(4, '0')}
          </span>
        </div>

        {/* Center: Play status speed badge */}
        <div className="flex items-center gap-1.5 md:gap-2 px-3 py-1 bg-black rounded-none border-2 border-[#00f0ff] shadow-[-2px_2px_0_#ff00ff]">
          <Zap className="w-3.5 h-3.5 text-[#ff00ff] animate-pulse hidden xs:inline" />
          <span className="text-[#00f0ff] uppercase tracking-widest text-[9px] font-black font-mono">GRID_HZ_</span>
          <span className="text-base md:text-lg font-black text-[#ff00ff] font-mono tracking-widest glitch-glow-speed">
            {getGameSpeed()}MS
          </span>
        </div>

        {/* Right: High Score / Best */}
        <div className="flex items-center gap-1.5 md:gap-2 px-3 py-1 bg-black border-2 border-[#ff00ff] rounded-none shadow-[-2px_2px_0_#00f0ff]">
          <Trophy className="w-3.5 h-3.5 text-[#00f0ff] hidden xs:inline" />
          <span className="text-[#ff00ff] uppercase tracking-widest text-[9px] font-black font-mono">SYS_HIGH_</span>
          <span id="snake-high-score" className="text-base md:text-lg font-black text-[#00f0ff] font-mono tracking-widest glitch-glow-cyan">
            {String(highScore).padStart(4, '0')}
          </span>
        </div>
      </div>

      {/* Primary Display Windows */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 relative bg-black shadow-[inset_0_0_100px_rgba(255,0,255,0.08)]">
        
        {/* Game Canvas Board Wrapper */}
        <div className="relative w-full max-w-[340px] aspect-square rounded-none border-4 border-[#00f0ff] bg-black shadow-[-4px_4px_0_#ff00ff] overflow-hidden flex items-center justify-center">
            
          <canvas
            id="snake-arcade-canvas"
            ref={canvasRef}
            className="w-full h-full block cursor-pointer transition-opacity duration-300"
            onClick={handleStartResume}
          />

          {/* Absolute Overlays for Screen States */}
          {gameStatus === 'IDLE' && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center select-none backdrop-blur-sm">
              <div className="w-14 h-14 rounded-none bg-black border-2 border-[#ff00ff] flex items-center justify-center text-[#ff00ff] mb-4 shadow-[-3px_3px_0_#00f0ff] animate-pulse">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#00f0ff] font-mono tracking-widest uppercase">:: OPERATOR_READY ::</h3>
              <p className="text-xs text-white/80 mt-2 max-w-[250px] font-mono leading-relaxed">
                ESTABLISH MATRIX FEED AND PILOT THE SNAKE GRID ENERGIZER. KEYPAD LEASH BIND IS ACTIVE.
              </p>
              <button
                id="btn-play-start"
                onClick={handleReset}
                className="cyber-button-magenta mt-6 flex items-center gap-2 px-6 py-2.5 font-mono text-xs uppercase tracking-widest font-black"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>LAUNCH_SIGNAL_</span>
              </button>
            </div>
          )}

          {gameStatus === 'PAUSED' && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center select-none backdrop-blur-xs">
              <span className="text-sm font-mono uppercase tracking-[0.25em] text-[#00f0ff] animate-pulse bg-black border-2 border-[#ff00ff] px-5 py-2 rounded-none shadow-[-3px_3px_0_#ff00ff]">
                :: HALT_FRAME_PAUSE ::
              </span>
              <p className="text-[10px] text-white/60 mt-3 font-mono">TAP SPACEBAR OR CANVAS TO RESUME_</p>
            </div>
          )}

          {gameStatus === 'GAME_OVER' && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 text-center select-none backdrop-blur-sm">
              <div className="w-12 h-12 rounded-none bg-black border-2 border-[#ff00ff] flex items-center justify-center text-[#ff00ff] mb-3 animate-bounce shadow-[-3px_3px_0_#00f0ff]">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-[#ff00ff] font-mono tracking-widest uppercase">:: SYS_CRASH // OVERLOAD ::</h3>
              <p className="text-xs text-white/80 mt-2 font-mono">DUMPED CORES SUMMARY: <span className="text-[#00f0ff] font-bold">{score} LOGS</span></p>
              
              <button
                id="btn-restart-game"
                onClick={handleReset}
                className="cyber-button mt-6 flex items-center gap-2 px-6 py-2 rounded-none font-mono text-xs uppercase tracking-widest font-black"
              >
                <RotateCcw className="w-4 h-4" />
                <span>RESET_KERNEL_</span>
              </button>
            </div>
          )}
        </div>

        {/* Touch / Mobile Joypad controls */}
        <div className="w-full max-w-[280px] mt-6 flex flex-col items-center select-none font-mono">
          {/* Top arrow */}
          <button
            id="mobile-ctrl-up"
            onClick={() => {
              neonSynth.triggerSfxTap();
              handleDirectionChange('UP');
            }}
            className={`w-14 h-11 flex items-center justify-center rounded-none bg-black border-2 border-[#ff00ff] text-[#ff00ff] hover:bg-[#00f0ff] hover:text-black transition-colors ${direction === 'UP' ? 'bg-[#ff00ff]/20 text-[#00f0ff] border-[#00f0ff]' : ''}`}
            title="UP"
          >
            <ArrowBigUp className="w-6 h-6 fill-current" />
          </button>
          
          {/* Middle Row arrows */}
          <div className="flex items-center justify-between w-full mt-2 gap-4">
            <button
              id="mobile-ctrl-left"
              onClick={() => {
                neonSynth.triggerSfxTap();
                handleDirectionChange('LEFT');
              }}
              className={`w-14 h-11 flex items-center justify-center rounded-none bg-black border-2 border-[#ff00ff] text-[#ff00ff] hover:bg-[#00f0ff] hover:text-black transition-colors ${direction === 'LEFT' ? 'bg-[#ff00ff]/20 text-[#00f0ff] border-[#00f0ff]' : ''}`}
              title="LEFT"
            >
              <ArrowBigLeft className="w-6 h-6 fill-current" />
            </button>

            {/* Core Action Command Center Button */}
            <button
              id="mobile-ctrl-action"
              onClick={handleStartResume}
              className={`flex-1 h-11 flex items-center justify-center rounded-none border-2 font-mono text-[11px] uppercase tracking-widest font-black transition-all duration-100 px-3 bg-black ${
                gameStatus === 'PLAYING' 
                  ? 'border-[#ff00ff] text-[#ff00ff] hover:text-black hover:bg-[#ff00ff]' 
                  : 'border-[#00f0ff] text-[#00f0ff] hover:text-black hover:bg-[#00f0ff]'
              }`}
            >
              {gameStatus === 'PLAYING' ? 'PAUSE_CORE' : gameStatus === 'GAME_OVER' ? 'RELINK_SYS' : 'SYS_BOOT_'}
            </button>

            <button
              id="mobile-ctrl-right"
              onClick={() => {
                neonSynth.triggerSfxTap();
                handleDirectionChange('RIGHT');
              }}
              className={`w-14 h-11 flex items-center justify-center rounded-none bg-black border-2 border-[#ff00ff] text-[#ff00ff] hover:bg-[#00f0ff] hover:text-black transition-colors ${direction === 'RIGHT' ? 'bg-[#ff00ff]/20 text-[#00f0ff] border-[#00f0ff]' : ''}`}
              title="RIGHT"
            >
              <ArrowBigRight className="w-6 h-6 fill-current" />
            </button>
          </div>

          {/* Bottom arrow */}
          <button
            id="mobile-ctrl-down"
            onClick={() => {
              neonSynth.triggerSfxTap();
              handleDirectionChange('DOWN');
            }}
            className={`w-14 h-11 flex items-center justify-center rounded-none bg-black border-2 border-[#ff00ff] text-[#ff00ff] hover:bg-[#00f0ff] hover:text-black transition-colors mt-2 ${direction === 'DOWN' ? 'bg-[#ff00ff]/20 text-[#00f0ff] border-[#00f0ff]' : ''}`}
            title="DOWN"
          >
            <ArrowBigDown className="w-6 h-6 fill-current" />
          </button>
        </div>
      </div>

      {/* Settings / Interactive Footer */}
      <div className="p-4 bg-[#000000] border-t-2 border-[#ff00ff] text-white font-mono text-[11px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Velocity Controller */}
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-[#00f0ff]" />
            <span className="text-[#00f0ff]">CLOCK_RATIO:</span>
            <select
              id="speed-select"
              value={speedMode}
              onChange={(e) => {
                neonSynth.triggerSfxTap();
                setSpeedMode(e.target.value as any);
              }}
              className="bg-black text-[#ff00ff] border-2 border-[#00f0ff] rounded-none px-2 py-0.5 outline-none cursor-pointer text-[10px] font-mono tracking-wider"
            >
              <option value="sync">AUDIO_SYNC_BEAT 🎵</option>
              <option value="slow">LO_VELOCITY // SLOW</option>
              <option value="medium">MID_VELOCITY // STANDARD</option>
              <option value="fast">HI_VELOCITY // INSTANT_RUN</option>
            </select>
          </div>

          {/* Wrap Border Settings Toggle */}
          <button
            id="boundary-mode-btn"
            onClick={() => {
              neonSynth.triggerSfxTap();
              setIsWrapMode((w) => !w);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 border-2 font-mono transition-all ${
              isWrapMode
                ? 'bg-[#ff00ff]/10 border-[#ff00ff] text-[#ff00ff]'
                : 'border-[#00f0ff] text-[#00f0ff]'
            }`}
            title="Toggle wall collision wrap mode"
          >
            <span>WALL_LOGIC:</span>
            <span className="font-bold">{isWrapMode ? 'PASSTHRU' : 'FATAL'}</span>
          </button>

          {/* Grid Toggle lines */}
          <button
            id="gridlines-mode-btn"
            onClick={() => {
              neonSynth.triggerSfxTap();
              setShowGridLines((l) => !l);
            }}
            className={`flex items-center gap-1 border-2 px-3 py-1 font-mono transition-all ${
              showGridLines ? 'border-[#00f0ff] text-[#00f0ff] bg-black' : 'border-white/10 text-white/30'
            }`}
          >
            <span>GRID_MESH:</span>
            <span>{showGridLines ? 'ENABLED' : 'TERMINATED'}</span>
          </button>
        </div>
        
        {/* Help label */}
        <div className="mt-3 text-[10px] text-white/50 flex items-center gap-1.5 border-t border-[#00f0ff]/10 pt-2.5 font-mono">
          <HelpCircle className="w-3.5 h-3.5 text-[#00f0ff] shrink-0" />
          <span>SYS_INFO: <strong>AUDIO_SYNC_BEAT</strong> CLAMPS REFRESH DURATION TO THE BPM FREQUENCY OF SELECTED CHANNEL SEQUENCE. Watch step cycle speed sync!</span>
        </div>
      </div>
    </div>
  );
}
