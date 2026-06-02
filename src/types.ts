/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Position {
  x: number;
  y: number;
}

export type GameStatus = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  neonColor: string; // Tailwind class color like 'emerald', 'fuchsia', 'cyan'
  glowColor: string; // HEX or RGBA for visualizer effects
  description: string;
  pattern: {
    tempo: number;
    bass: number[];
    melody: number[];
    leadOctave: number;
    drumPattern: boolean[];
  };
}
